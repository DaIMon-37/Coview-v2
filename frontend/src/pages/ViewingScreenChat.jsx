import React, { useState, useRef, useEffect, useCallback } from "react";

import { Play, Pause, Volume2, VolumeX, Maximize, Settings, MessageSquare, Theater, Send, Users, Link,  Keyboard, LogOut, Smile, Trash2, ListVideo, Plus, Film, X, RotateCcw, RotateCw, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getSocket } from "../services/socket";
import { loadYouTubeApi } from "../services/youtubeApi";
import { chatAPI, partyAPI } from "../services/api";
import Modal from "../components/Modal";
import { InvitePanel, UserListPanel, RoomSettingsPanel, ConnectionStatus, useKeyboardShortcuts, KeyboardShortcutsModal } from "../components/RoomPanels";
import YoutubeSearchModal from "../components/YoutubeSearchModal";
import Swal from "sweetalert2";

const EMOJIS = ["❤️","🔥","😍","👏","😂","🎉","😮","💯","🤣","😭","🙌","✨","😎","🤔","👀","💀","🫡","🥹"];

const SIDEBAR_TABS = [
  { id: 'chat',     icon: <MessageSquare className="h-4 w-4" />, label: 'Chat' },
  { id: 'queue',    icon: <ListVideo className="h-4 w-4" />,     label: 'Up Next' },
  { id: 'users',    icon: <Users className="h-4 w-4" />,         label: 'Users' },
  { id: 'invite',   icon: <Link className="h-4 w-4" />,          label: 'Invite' },
  { id: 'settings', icon: <Settings className="h-4 w-4" />,      label: 'Settings' },
];

const extractYouTubeId = (url) => {
  const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  return match ? match[1] : null;
};

const toEmbedUrl = (url) => {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

// Stable mount point id for the real YouTube IFrame Player. Must never
// change with play/pause/mute state — only the video itself should ever
// cause this element (and the player bound to it) to be torn down.
const YT_MOUNT_ID = "coview-yt-player";

// Fallback video used when a room already exists (e.g. it was created
// earlier and everyone since left) but no video was ever loaded into it —
// without this, a fresh joiner would sit on "Loading video..." forever
// since there's no host present to seed one.
const FALLBACK_VIDEO_URL = "https://youtu.be/GTJhK77aEXw?si=MUmqc1DlGE_LCeKF";

const ViewingScreenChat = () => {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const {
    chatMessages, loadChatHistory, sendMessage, sendTyping,
    currentVideo, setCurrentVideo,
    user, party, onlineUsers, currentHostId, typingUsers, token,
    queue, addToQueue, removeFromQueue,
    roomSettings,
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("1080p");
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState("synced");
  const [connStatus, setConnStatus] = useState("connected");
  const [activeTab, setActiveTab] = useState("chat");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showYoutubeSearch, setShowYoutubeSearch] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const iframeRef = useRef(null); // only used for the non-YouTube fallback embed
  const ytPlayerRef = useRef(null); // real YT.Player instance — gives us
                                     // getCurrentTime()/seekTo()/playVideo()
                                     // instead of blind postMessage guesses
  const ytReadyRef = useRef(false);
  // Latest state we know the room to be in, kept up to date from every
  // socket event so a freshly (re)created player can seed itself correctly.
  const lastKnownStateRef = useRef({ currentTime: 0, isPlaying: false });

  const partyCode = roomCode || party?.code;
  const isHost = user?.id === currentHostId || (!currentHostId && user?.id === party?.hostId);
  const currentYoutubeId = extractYouTubeId(currentVideo || "");
  const isYoutube = !!currentYoutubeId;
  // Playback control follows the room's "Playback Control" setting — when
  // set to "Host Only", non-host participants can watch but not drive
  // play/pause/seek. Everyone can control by default.
  const canControlPlayback = isHost || roomSettings?.playbackPerm !== 'host';
  // Chat follows the room's "Enable Chat" setting — the host can always
  // post even when chat is disabled for everyone else.
  const canChat = isHost || roomSettings?.chatEnabled !== false;

  // Persist room so refresh stays on same page
  useEffect(() => {
    if (partyCode) localStorage.setItem("coview_last_room", partyCode);
  }, [partyCode]);

  useEffect(() => {
    if (!partyCode) {
      const saved = localStorage.getItem("coview_last_room");
      if (saved) navigate(`/watch/${saved}/chat`, { replace: true });
    }
  }, []); // eslint-disable-line

  // When host lands on watch page, seed the video into the socket room
  // so any joiner gets the correct video from room-state
  useEffect(() => {
    if (!partyCode || !isHost) return;
    const videoToSeed = party?.videoUrl || currentVideo;
    if (!videoToSeed) return;
    const sock = getSocket();
    if (!sock) return;
    const emit = () => sock.emit("video-load", { partyCode, provider: "custom", source: videoToSeed });
    if (sock.connected) emit();
    else sock.once("connect", emit);
  }, [partyCode, isHost]); // eslint-disable-line

  // Fallback: if video still null after socket join, fetch from DB. If the
  // room genuinely has no video saved either (e.g. it was created and then
  // emptied out before anyone picked something to watch), fall back to a
  // default video instead of leaving the player stuck on "Loading video..."
  // forever. If we're the host of this now-empty room, also seed it into
  // the socket room so it's persisted for anyone else who joins.
  useEffect(() => {
    if (!partyCode || currentVideo) return;
    const timer = setTimeout(async () => {
      if (currentVideo) return;
      let url = null;
      try {
        const res = await partyAPI.getByCode(partyCode);
        url = res.data?.party?.video_url || null;
      } catch {}

      const finalUrl = url || FALLBACK_VIDEO_URL;
      setCurrentVideo(finalUrl);

      if (!url && isHost) {
        const sock = getSocket();
        const emit = () => sock.emit("video-load", { partyCode, provider: "custom", source: finalUrl });
        if (sock?.connected) emit();
        else sock?.once("connect", emit);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [partyCode, currentVideo, isHost]); // eslint-disable-line

  // Load chat history
  useEffect(() => {
    if (party?.id && token && chatMessages.length === 0) {
      chatAPI.getHistory(party.id)
        .then(res => { if (res.data) loadChatHistory(res.data); })
        .catch(() => {});
    }
  }, [party?.id, token]); // eslint-disable-line

  // Best-effort postMessage control, kept ONLY as a fallback for non-YouTube
  // custom embeds that expose no real control API. YouTube playback below
  // goes through a real YT.Player instance instead.
  const postToIframe = useCallback((func, args) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args: args !== undefined ? [args] : [] }),
        '*'
      );
    } catch {}
  }, []);

  // Create (or tear down) the real YouTube player whenever the *video
  // itself* changes. This must never depend on isPlaying/isMuted — doing
  // that previously baked autoplay/mute params into the iframe `src` and
  // used that string as the React `key`, which destroyed and rebuilt the
  // entire embed on every single play/pause click. A remote socket-driven
  // reload has no user gesture behind it, so the browser's autoplay policy
  // silently blocked it — that's why the other participant's video stayed
  // paused.
  useEffect(() => {
    if (!currentYoutubeId) {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
      ytReadyRef.current = false;
      return;
    }

    let cancelled = false;
    ytReadyRef.current = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !YT) return;
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
      }
      ytPlayerRef.current = new YT.Player(YT_MOUNT_ID, {
        videoId: currentYoutubeId,
        playerVars: {
          autoplay: 0,
          controls: 0, // all playback goes through the app so no one can
                       // scrub/play/pause locally and fall out of sync
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            ytReadyRef.current = true;
            const state = lastKnownStateRef.current;
            try {
              ytPlayerRef.current.seekTo(state.currentTime || 0, true);
              if (state.isPlaying) ytPlayerRef.current.playVideo();
              else ytPlayerRef.current.pauseVideo();
              ytPlayerRef.current.setPlaybackRate(playbackSpeed);
              if (isMuted) ytPlayerRef.current.mute(); else ytPlayerRef.current.unMute();
            } catch {}
          },
          onStateChange: (e) => {
            if (e.data === 0 && isHost && partyCode) { // 0 = ended
              const sock = getSocket();
              if (sock?.connected) sock.emit("video-next", { partyCode });
            }
          },
        },
      });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYoutubeId]);

  // Apply an authoritative state update (from the server) to whichever
  // real player is active. Every client — including the one who triggered
  // the action, since the server broadcasts back to the sender too — goes
  // through this single code path, so nobody can drift out of sync.
  const applyRemoteState = useCallback(({ isPlaying: playing, currentTime }) => {
    if (currentTime != null) lastKnownStateRef.current.currentTime = currentTime;
    if (playing != null) lastKnownStateRef.current.isPlaying = playing;

    if (isYoutube) {
      const player = ytPlayerRef.current;
      if (player && ytReadyRef.current) {
        try {
          if (currentTime != null) player.seekTo(currentTime, true);
          if (playing === true) player.playVideo();
          else if (playing === false) player.pauseVideo();
        } catch {}
      }
      // If the player isn't ready yet, onReady() above seeds it from
      // lastKnownStateRef once it is.
    } else {
      if (currentTime != null) postToIframe('seekTo', currentTime);
      if (playing === true) postToIframe('playVideo');
      else if (playing === false) postToIframe('pauseVideo');
    }
  }, [isYoutube, postToIframe]);

  // Socket video sync
  useEffect(() => {
    const sock = getSocket();
    if (!sock || !partyCode) return;

    const onVideoLoaded = (state) => {
      if (state?.url) setCurrentVideo(state.url);
      if (state) {
        lastKnownStateRef.current = { currentTime: state.currentTime || 0, isPlaying: !!state.isPlaying };
        setIsPlaying(!!state.isPlaying);
      }
      setSyncStatus("syncing");
      setTimeout(() => setSyncStatus("synced"), 1000);
    };
    const onVideoPlayed = (state) => {
      setIsPlaying(true);
      setSyncStatus("syncing");
      applyRemoteState({ isPlaying: true, currentTime: state?.currentTime });
      setTimeout(() => setSyncStatus("synced"), 300);
    };
    const onVideoPaused = (state) => {
      setIsPlaying(false);
      setSyncStatus("syncing");
      applyRemoteState({ isPlaying: false, currentTime: state?.currentTime });
      setTimeout(() => setSyncStatus("synced"), 300);
    };
    const onVideoSeeked = (state) => {
      setSyncStatus("syncing");
      applyRemoteState({ currentTime: state?.currentTime });
      setTimeout(() => setSyncStatus("synced"), 500);
    };
    const onSpeedChanged = ({ speed }) => {
      setPlaybackSpeed(speed);
      if (isYoutube && ytPlayerRef.current && ytReadyRef.current) {
        try { ytPlayerRef.current.setPlaybackRate(speed); } catch {}
      } else {
        postToIframe('setPlaybackRate', speed);
      }
    };
    const onDisconnect = () => setConnStatus("reconnecting");
    const onConnect = () => setConnStatus("connected");

    sock.on("video-loaded", onVideoLoaded);
    sock.on("video-played", onVideoPlayed);
    sock.on("video-paused", onVideoPaused);
    sock.on("video-seeked", onVideoSeeked);
    sock.on("video-speed-changed", onSpeedChanged);
    sock.on("disconnect", onDisconnect);
    sock.on("connect", onConnect);
    return () => {
      sock.off("video-loaded", onVideoLoaded); sock.off("video-played", onVideoPlayed);
      sock.off("video-paused", onVideoPaused); sock.off("video-seeked", onVideoSeeked);
      sock.off("video-speed-changed", onSpeedChanged);
      sock.off("disconnect", onDisconnect); sock.off("connect", onConnect);
    };
  }, [partyCode, setCurrentVideo, applyRemoteState, isYoutube, postToIframe]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Poll the real player for its actual position — this is what feeds the
  // seek bar and what handlePlayPause/handleSeek read when emitting events,
  // so the server always gets a real number instead of a guess.
  useEffect(() => {
    if (!isYoutube) { setProgress({ current: 0, duration: 0 }); return; }
    const interval = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player || !ytReadyRef.current) return;
      try {
        const current = player.getCurrentTime() || 0;
        const duration = player.getDuration() || 0;
        lastKnownStateRef.current.currentTime = current;
        setProgress({ current, duration });
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [isYoutube, currentYoutubeId]);

  const handleAddVideoByUrl = () => {
    if (!newVideoUrl.trim()) { Swal.fire({ icon: "warning", title: "Missing URL", text: "Please enter a video URL" }); return; }
    addToQueue({
      id: Date.now(),
      title: newVideoTitle || "New Video",
      url: toEmbedUrl(newVideoUrl.trim()),
      provider: "custom",
    });
    setNewVideoUrl(""); setNewVideoTitle(""); setShowAddVideo(false);
    Swal.fire({ icon: "success", title: "Added to queue", timer: 1200, showConfirmButton: false });
  };

  const handleYoutubeSearchAdd = (video) => {
    addToQueue({ ...video, provider: "youtube" });
    setShowYoutubeSearch(false);
  };

  const handlePlayFromQueue = (video) => {
    if (!isHost || !partyCode) return;
    const sock = getSocket();
    if (sock?.connected) sock.emit("video-next", { partyCode, videoId: video.id });
  };

  // Play/pause/seek are shared control now — any participant can drive
  // playback, and the server broadcasts the resulting state to everyone
  // in the room (sender included), so all clients stay in sync no matter
  // who pressed the button.
  const emitVideoEvent = useCallback((event, data) => {
    const sock = getSocket();
    if (sock?.connected && partyCode) sock.emit(event, { partyCode, ...data });
  }, [partyCode]);

  // Build universal embed URL for any platform
  const buildEmbedUrl = useCallback((url, playing, muted) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      // Already embed-style URLs — just update autoplay param
      if (url.includes('/embed/') || url.includes('player.vimeo') || url.includes('player.twitch') || url.includes('dailymotion.com/embed') || url.includes('facebook.com/plugins')) {
        u.searchParams.set('autoplay', playing ? '1' : '0');
        if (url.includes('youtube')) { u.searchParams.set('mute', muted ? '1' : '0'); u.searchParams.set('enablejsapi', '1'); }
        return u.toString();
      }
      return url;
    } catch { return url; }
  }, []);

  // Read the *actual* playback position from whichever real player is
  // active, instead of guessing. Sending a hardcoded 0 here was the other
  // half of the sync bug: every play/pause told the whole room to jump
  // back to the start of the video.
  const getRealCurrentTime = useCallback(() => {
    if (isYoutube && ytPlayerRef.current && ytReadyRef.current) {
      try { return ytPlayerRef.current.getCurrentTime() ?? lastKnownStateRef.current.currentTime ?? 0; } catch {}
    }
    return lastKnownStateRef.current.currentTime || 0;
  }, [isYoutube]);

  const handlePlayPause = useCallback(() => {
    if (!canControlPlayback) return;
    const newState = !isPlaying;
    const currentTime = getRealCurrentTime();
    // Don't touch the player or isPlaying locally — the server broadcasts
    // this event back to everyone in the room, sender included, so every
    // client applies the exact same update via the single
    // onVideoPlayed/onVideoPaused path above.
    emitVideoEvent(newState ? "video-play" : "video-pause", { currentTime });
  }, [isPlaying, emitVideoEvent, getRealCurrentTime, canControlPlayback]);

  const handleSeek = useCallback((time) => {
    if (!canControlPlayback) return;
    emitVideoEvent("video-seek", { currentTime: time });
  }, [emitVideoEvent, canControlPlayback]);

  // Relative seek (+/-10s) for the skip buttons and arrow-key shortcuts.
  // Reads the real current position (not local state) and clamps to the
  // video bounds, then goes through the same synced handleSeek path as
  // the seek bar so every client jumps together.
  const handleSeekBy = useCallback((delta) => {
    const current = getRealCurrentTime();
    const duration = progress.duration || Infinity;
    const target = Math.min(duration, Math.max(0, current + delta));
    handleSeek(target);
  }, [getRealCurrentTime, progress.duration, handleSeek]);

  const handleSpeedChange = useCallback((speed) => {
    if (!isHost) return;
    const sock = getSocket();
    if (sock?.connected && partyCode) sock.emit("video-speed", { partyCode, speed });
  }, [isHost, partyCode]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((v) => {
      const next = !v;
      if (isYoutube && ytPlayerRef.current && ytReadyRef.current) {
        try { next ? ytPlayerRef.current.mute() : ytPlayerRef.current.unMute(); } catch {}
      } else {
        postToIframe(next ? 'mute' : 'unMute');
      }
      return next;
    });
  }, [isYoutube, postToIframe]);

  useKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onFullscreen: handleFullscreen,
    onMute: handleMuteToggle,
    onSeekBackward: () => handleSeekBy(-10),
    onSeekForward: () => handleSeekBy(10),
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!canChat) return;
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage("");
      sendTyping(false);
      clearTimeout(typingTimeoutRef.current);
      setShowEmojiPicker(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleMention = (username) => {
    setNewMessage(prev => prev + `@${username} `);
    setActiveTab('chat');
    inputRef.current?.focus();
  };

  const handleLeave = () => {
    Swal.fire({
      title: 'Leave Room?', text: 'You will be disconnected from the watch party.',
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Leave'
    }).then(r => { if (r.isConfirmed) navigate('/'); });
  };

  const syncColors = { synced: "text-green-400", syncing: "text-yellow-400", desynced: "text-red-400" };
  const syncLabels = { synced: "Synced", syncing: "Syncing...", desynced: "Out of Sync" };
  const syncBgColors = { synced: "bg-green-500/10 border-green-500/20", syncing: "bg-yellow-500/10 border-yellow-500/20", desynced: "bg-red-500/10 border-red-500/20" };
  const syncDotColors = { synced: "bg-green-500", syncing: "bg-yellow-500 animate-pulse", desynced: "bg-red-500" };

  // Fixed at autoplay=0 — this is only used for non-YouTube custom embeds,
  // and it's keyed by the URL alone (below) so it never remounts on
  // play/pause/mute. Real playback for those is attempted best-effort via
  // postToIframe once mounted.
  const customIframeSrc = !isYoutube ? buildEmbedUrl(currentVideo, false, isMuted) : "";
  const visibleMessages = chatMessages.filter(m => !localMessages.includes(m.id));

  return (
    <div className="h-screen bg-[#0a0b1e] text-white flex overflow-hidden">
      {/* Left: Video */}
      <div className={`flex-1 flex flex-col ${isTheaterMode ? "w-full" : ""}`}>
        {/* Nav */}
        <nav className="flex items-center justify-between px-4 py-2.5 bg-[#0d0e24] border-b border-[#252648] flex-shrink-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-wide hidden sm:block">CoView</span>
          </button>

          <div className="flex items-center gap-2">
            <ConnectionStatus status={connStatus} />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 ${syncBgColors[syncStatus]} border rounded-full`}>
              <div className={`w-1.5 h-1.5 rounded-full ${syncDotColors[syncStatus]}`} />
              <span className={`text-xs font-semibold ${syncColors[syncStatus]}`}>{syncLabels[syncStatus]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {partyCode && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-[#13142e] border border-[#252648] rounded-lg">
                <span className="text-xs text-gray-400">Room:</span>
                <span className="text-xs font-bold text-indigo-400 font-mono">{partyCode}</span>
              </div>
            )}
            <button onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1a1b3a] rounded transition-all">
              <Keyboard className="h-4 w-4" />
            </button>
            <button onClick={handleLeave} title="Leave Room"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
              <LogOut className="h-4 w-4" />
            </button>
            <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=User`} alt="Profile"
              className="w-8 h-8 rounded-full border-2 border-[#252648] object-cover cursor-pointer hover:border-indigo-500 transition-all"
              onClick={() => navigate("/profile")} />
          </div>
        </nav>

        {/* Video */}
        <div className="flex-1 relative bg-black">
          {!currentVideo ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400 text-sm">Loading video...</span>
              </div>
            </div>
          ) : isYoutube ? (
            // Stable id, keyed only on the video id — never on isPlaying/
            // isMuted. The real YT.Player bound to this element (see the
            // effect above) receives play/pause/seek as live commands
            // instead of the element being torn down and rebuilt.
            <div id={YT_MOUNT_ID} key={currentYoutubeId} className="w-full h-full" />
          ) : (
            <iframe
              ref={iframeRef}
              key={currentVideo}
              src={customIframeSrc}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Player"
            />
          )}

          {/* Click-to-toggle overlay. YouTube's embedded player still toggles
              play/pause on a plain click even with controls:0 — that click
              never reaches our socket code, so that participant's video
              silently falls out of sync with everyone else's. This overlay
              sits above the player and catches the click first, routing it
              through the same synced handlePlayPause the bottom button
              uses, and shows a center icon so it's clear a click here does
              something. When playback is host-only and this user isn't the
              host, the overlay is inert and shows a lock instead. */}
          {currentVideo && (
            <div className={`absolute inset-0 z-10 group ${canControlPlayback ? "cursor-pointer" : "cursor-default"}`}
              onClick={canControlPlayback ? handlePlayPause : undefined}>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="p-4 rounded-full bg-black/50">
                  {canControlPlayback
                    ? (isPlaying ? <Pause className="h-10 w-10 text-white" /> : <Play className="h-10 w-10 text-white" />)
                    : <Lock className="h-8 w-8 text-white" />}
                </div>
              </div>
            </div>
          )}

          {onlineUsers.length > 0 && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 4).map((u, idx) => (
                  <img key={idx} src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`}
                    className="w-8 h-8 rounded-full border-2 border-[#0a0b1e]" title={u.username} alt={u.username} />
                ))}
              </div>
              {onlineUsers.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#0a0b1e] flex items-center justify-center text-xs font-bold">+{onlineUsers.length - 4}</div>
              )}
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4">
            {isYoutube && progress.duration > 0 && (
              <div
                className={`h-1.5 mb-3 rounded-full bg-white/20 relative ${canControlPlayback ? "cursor-pointer" : "cursor-not-allowed"}`}
                onClick={(e) => {
                  if (!canControlPlayback) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                  handleSeek(ratio * progress.duration);
                }}
                title={canControlPlayback ? "Click to seek" : "Only the host can seek"}
              >
                <div
                  className="h-1.5 rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, (progress.current / progress.duration) * 100)}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => handleSeekBy(-10)} disabled={!canControlPlayback}
                  className="relative text-white hover:text-gray-300 transition-colors disabled:text-gray-600 disabled:hover:text-gray-600 disabled:cursor-not-allowed"
                  title={canControlPlayback ? "← (-10s)" : "Only the host can control playback"}>
                  <RotateCcw className="h-5 w-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold pt-px">10</span>
                </button>
                <button onClick={handlePlayPause} disabled={!canControlPlayback}
                  className="text-white hover:text-gray-300 transition-colors disabled:text-gray-600 disabled:hover:text-gray-600 disabled:cursor-not-allowed"
                  title={canControlPlayback ? "Space" : "Only the host can control playback"}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button onClick={() => handleSeekBy(10)} disabled={!canControlPlayback}
                  className="relative text-white hover:text-gray-300 transition-colors disabled:text-gray-600 disabled:hover:text-gray-600 disabled:cursor-not-allowed"
                  title={canControlPlayback ? "→ (+10s)" : "Only the host can control playback"}>
                  <RotateCw className="h-5 w-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold pt-px">10</span>
                </button>
                <button onClick={handleMuteToggle} className="text-white hover:text-gray-300 transition-colors" title="M">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('chat')} className={`transition-colors ${activeTab === 'chat' && !isTheaterMode ? "text-indigo-400" : "text-gray-400 hover:text-white"}`}>
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button onClick={() => setIsTheaterMode(v => !v)} className={`${isTheaterMode ? "text-indigo-400" : "text-gray-400"} hover:text-white transition-colors`} title="Theater Mode">
                  <Theater className="h-4 w-4" />
                </button>
                <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-white transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
                <button onClick={handleFullscreen} className="text-gray-400 hover:text-white transition-colors" title="F">
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Sidebar */}
      {!isTheaterMode && (
        <div className="w-80 bg-[#0d0e24] border-l border-[#252648] flex flex-col flex-shrink-0">
          <div className="flex border-b border-[#252648] overflow-x-auto flex-shrink-0">
            {SIDEBAR_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.label}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] font-semibold transition-all relative min-w-0 ${activeTab === tab.id ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab.icon}
                <span className="hidden sm:block truncate">{tab.label}</span>
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                {tab.id === 'users' && onlineUsers.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full text-[8px] flex items-center justify-center text-white font-bold">{onlineUsers.length}</span>
                )}
                {tab.id === 'queue' && queue.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full text-[8px] flex items-center justify-center text-white font-bold">{queue.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                  {visibleMessages.length === 0 && (
                    <div className="text-center text-gray-600 text-sm mt-8">No messages yet. Say something!</div>
                  )}
                  {visibleMessages.map(msg => (
                    <div key={msg.id} className={`flex gap-2.5 group ${msg.isSystem ? "justify-center" : ""}`}>
                      {msg.isSystem ? (
                        <span className={`text-xs ${msg.color} bg-[#13142e] px-3 py-1 rounded-full`}>{msg.message}</span>
                      ) : (
                        <>
                          {msg.avatar ? (
                            <img src={msg.avatar} alt={msg.user} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {msg.user?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-0.5">
                              <button onClick={() => handleMention(msg.user)} className={`font-semibold text-xs ${msg.color} hover:underline`}>{msg.user}</button>
                              <span className="text-[10px] text-gray-600">{msg.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed break-words">{msg.message}</p>
                          </div>
                          {msg.user === user?.name && (
                            <button onClick={() => setLocalMessages(prev => [...prev, msg.id])}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all flex-shrink-0 self-start mt-0.5">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {typingUsers.length > 0 && (
                  <div className="px-3 py-1 text-xs text-gray-500 italic flex-shrink-0">
                    {typingUsers.slice(0, 2).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </div>
                )}

                {showEmojiPicker && (
                  <div className="px-3 py-2 border-t border-[#252648] flex-shrink-0">
                    <div className="flex flex-wrap gap-1">
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => handleEmojiClick(e)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[#1a1b3a] rounded transition-all hover:scale-110">
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 border-t border-[#252648] flex-shrink-0">
                  {!canChat && (
                    <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5 mb-2">
                      Chat has been disabled by the host.
                    </p>
                  )}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowEmojiPicker(v => !v)} disabled={!canChat}
                      className={`p-2 rounded-lg transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${showEmojiPicker ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500 hover:text-gray-300'}`}>
                      <Smile className="h-4 w-4" />
                    </button>
                    <input ref={inputRef} type="text" value={newMessage} onChange={handleTyping} disabled={!canChat}
                      placeholder={canChat ? "Message... (@mention)" : "Chat is disabled"}
                      className="flex-1 px-3 py-2 bg-[#0a0b1e] border border-[#252648] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" />
                    <button type="submit" disabled={!canChat} className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all flex-shrink-0">
                      <Send className="h-4 w-4 text-white" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Up Next</h3>
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{queue.length} queued</span>
                </div>

                {queue.length === 0 ? (
                  <div className="text-center text-gray-600 text-sm py-8">
                    Queue is empty. Add a video below.
                  </div>
                ) : (
                  <div className="space-y-2 mb-3">
                    {queue.map((video, idx) => (
                      <div key={video.id} className="flex gap-2.5 p-2 bg-[#0a0b1e] border border-[#252648] rounded-lg group">
                        <div className="w-16 h-10 rounded bg-[#13142e] flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {video.thumbnail
                            ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                            : <Film className="h-4 w-4 text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="text-xs font-semibold text-white truncate">{video.title}</span>
                          <span className="text-[10px] text-gray-500">{idx === 0 ? "Next up" : `#${idx + 1} in queue`}</span>
                        </div>
                        {isHost && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => handlePlayFromQueue(video)} title="Play now"
                              className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-all">
                              <Play className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => removeFromQueue(video.id)} title="Remove"
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setShowAddVideo(true)}
                    className="flex-1 py-2 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />Add by URL
                  </button>
                  <button onClick={() => setShowYoutubeSearch(true)}
                    className="flex-1 py-2 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />Search YouTube
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Participants</h3>
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{onlineUsers.length} online</span>
                </div>
                <UserListPanel />
              </div>
            )}

            {activeTab === 'invite' && (
              <div className="p-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Invite Friends</h3>
                <InvitePanel partyCode={partyCode} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Room Settings</h3>
                <RoomSettingsPanel partyCode={partyCode} />
              </div>
            )}

          </div>
        </div>
      )}

      {/* Playback Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Playback Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Playback Speed {!isHost && <span className="text-gray-600">(host only)</span>}</label>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                <button key={speed} onClick={() => handleSpeedChange(speed)} disabled={!isHost}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${playbackSpeed === speed ? "bg-indigo-600 text-white" : "bg-[#0a0b1e] border border-[#252648] text-gray-400 hover:text-white"} disabled:opacity-40`}>
                  {speed}x
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {["720p", "1080p", "4K"].map(q => (
                <button key={q} onClick={() => setQuality(q)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${quality === q ? "bg-indigo-600 text-white" : "bg-[#0a0b1e] border border-[#252648] text-gray-400 hover:text-white"}`}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} title="Keyboard Shortcuts">
        <KeyboardShortcutsModal />
      </Modal>

      {/* Add Video by URL */}
      <Modal isOpen={showAddVideo} onClose={() => setShowAddVideo(false)} title="Add Video to Queue">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Video URL</label>
            <input type="url" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Title (optional)</label>
            <input type="text" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)}
              placeholder="Video title"
              className="w-full px-4 py-3 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
          </div>
          <button onClick={handleAddVideoByUrl} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all">
            Add to Queue
          </button>
        </div>
      </Modal>

      <YoutubeSearchModal isOpen={showYoutubeSearch} onClose={() => setShowYoutubeSearch(false)} onAdd={handleYoutubeSearchAdd} />
    </div>
  );
};

export default ViewingScreenChat;
