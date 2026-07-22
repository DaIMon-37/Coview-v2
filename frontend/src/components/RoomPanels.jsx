import React, { useState, useEffect, useRef } from 'react';
import { Link, Mic, MicOff, Video, VideoOff, Globe, Lock, Shield, Copy, Check, Crown, UserX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { partyAPI } from '../services/api';
import Swal from 'sweetalert2';

// ─── Invite Panel ─────────────────────────────────────────────────────────────
export const InvitePanel = ({ partyCode }) => {
  const [copied, setCopied] = useState(false);
  const link = partyCode ? `${window.location.origin}/join?code=${partyCode}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: 'Join my CoView party!', url: link });
    else handleCopy();
  };

  // Deterministic QR-like pattern based on partyCode
  const QRPlaceholder = () => {
    const seed = partyCode || 'default';
    return (
      <div className="w-32 h-32 bg-white rounded-lg p-2 mx-auto">
        <div className="grid grid-cols-7 gap-0.5 w-full h-full">
          {Array.from({ length: 49 }).map((_, i) => {
            const val = (seed.charCodeAt(i % seed.length) + i) % 2;
            return <div key={i} className={`rounded-sm ${val ? 'bg-black' : 'bg-white'}`} />;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Room Code</label>
        <div className="flex items-center justify-center gap-2">
          {(partyCode || '------').split('').map((c, i) => (
            <div key={i} className="w-10 h-10 bg-[#0a0b1e] border border-[#252648] rounded-lg flex items-center justify-center text-lg font-bold text-indigo-400 font-mono">{c}</div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Invite Link</label>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 bg-[#0a0b1e] border border-[#252648] rounded-lg text-xs text-gray-400 font-mono truncate">{link || 'No active room'}</div>
          <button onClick={handleCopy} disabled={!link} className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-all">
            {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4 text-white" />}
          </button>
        </div>
        {copied && <p className="text-xs text-green-400 mt-1">Copied!</p>}
      </div>
      <div className="text-center">
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-3">QR Code</label>
        <QRPlaceholder />
        <p className="text-xs text-gray-600 mt-2">Scan to join instantly</p>
      </div>
      <button onClick={handleShare} disabled={!link}
        className="w-full py-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40">
        <Link className="h-4 w-4" />Share Invite
      </button>
    </div>
  );
};

// ─── User List Panel ──────────────────────────────────────────────────────────
export const UserListPanel = () => {
  const { onlineUsers, user, currentHostId, typingUsers, transferHost, kickUser, banUser, muteUser, unmuteUser, promoteModeratorAction, removeModeratorAction } = useApp();
  const isHost = user?.id === currentHostId;

  const confirm = (title, text, color, cb) =>
    Swal.fire({ title, text, icon: 'warning', showCancelButton: true, confirmButtonColor: color, confirmButtonText: 'Confirm' }).then(r => { if (r.isConfirmed) cb(); });

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {onlineUsers.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">No participants yet</p>
      ) : onlineUsers.map(u => {
        const isThisHost = u.id === currentHostId;
        const isMe = u.id === user?.id;
        const isTyping = typingUsers.includes(u.username);
        return (
          <div key={u.id} className="p-2.5 bg-[#0a0b1e] border border-[#252648] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`} className="w-8 h-8 rounded-full" alt={u.username} />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0b1e]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">{u.username}</span>
                  {isMe && <span className="text-[10px] text-gray-500">(you)</span>}
                  {isThisHost && <Crown className="h-3 w-3 text-yellow-400 flex-shrink-0" title="Host" />}
                  {u.isModerator && <Shield className="h-3 w-3 text-blue-400 flex-shrink-0" title="Moderator" />}
                  {u.isMuted && <span className="text-[10px] text-red-400 font-bold">MUTED</span>}
                </div>
                {isTyping && <span className="text-xs text-indigo-400 italic">typing...</span>}
              </div>
            </div>
            {isHost && !isMe && (
              <div className="flex gap-1 mt-2 pt-2 border-t border-[#252648]/50">
                <button onClick={() => confirm(`Make ${u.username} host?`, '', '#6366f1', () => transferHost(u.id))}
                  className="flex-1 py-1 text-[10px] font-semibold text-yellow-400 hover:bg-yellow-500/10 rounded transition-all">Host</button>
                <button onClick={() => u.isModerator ? removeModeratorAction(u.id) : promoteModeratorAction(u.id)}
                  className="flex-1 py-1 text-[10px] font-semibold text-blue-400 hover:bg-blue-500/10 rounded transition-all">
                  {u.isModerator ? 'Unmod' : 'Mod'}
                </button>
                <button onClick={() => u.isMuted ? unmuteUser(u.id) : muteUser(u.id)}
                  className="flex-1 py-1 text-[10px] font-semibold text-orange-400 hover:bg-orange-500/10 rounded transition-all">
                  {u.isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={() => confirm(`Kick ${u.username}?`, '', '#ef4444', () => kickUser(u.id))}
                  className="flex-1 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/10 rounded transition-all">Kick</button>
                <button onClick={() => confirm(`Ban ${u.username}?`, 'They cannot rejoin.', '#dc2626', () => banUser(u.id))}
                  className="flex-1 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-600/10 rounded transition-all">Ban</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Room Settings Panel ──────────────────────────────────────────────────────
export const RoomSettingsPanel = ({ partyCode }) => {
  const { party, setParty, roomLocked, toggleRoomLock, user, currentHostId } = useApp();
  const [roomName, setRoomName] = useState(party?.title || '');
  const [description, setDescription] = useState(party?.description || '');
  const [language, setLanguage] = useState(party?.language || 'English');
  const [privacy, setPrivacy] = useState(party?.privacy || 'public');
  const [chatEnabled, setChatEnabled] = useState(party?.chat_enabled ?? true);
  const [allowLinks, setAllowLinks] = useState(party?.allow_links ?? true);
  const [playbackPerm, setPlaybackPerm] = useState(party?.playback_perm || 'everyone');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isHost = user?.id === currentHostId;

  // Pull the room's actual persisted settings from the server instead of
  // trusting whatever (possibly stale/incomplete) party object is already
  // in context — this is what the form should reflect, not hardcoded
  // defaults.
  useEffect(() => {
    let cancelled = false;
    if (!partyCode) return;
    partyAPI.getByCode(partyCode).then((res) => {
      if (cancelled) return;
      const p = res.data?.party;
      if (!p) return;
      setRoomName(p.title ?? '');
      setDescription(p.description ?? '');
      setLanguage(p.language || 'English');
      setPrivacy(p.privacy || 'public');
      setChatEnabled(p.chat_enabled ?? true);
      setAllowLinks(p.allow_links ?? true);
      setPlaybackPerm(p.playback_perm || 'everyone');
      setParty((prev) => (prev ? { ...prev, ...p } : p));
    }).catch(() => {}).finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [partyCode]); // eslint-disable-line

  const Toggle = ({ enabled, onChange, disabled }) => (
    <button onClick={() => !disabled && onChange(!enabled)} disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-700'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  const handleSave = async () => {
    if (!isHost || !partyCode) return;
    setSaving(true);
    try {
      const res = await partyAPI.updateSettings(partyCode, { title: roomName, description, language, privacy, chatEnabled, allowLinks, playbackPerm });
      const saved = res.data?.party;
      if (saved) setParty((prev) => (prev ? { ...prev, ...saved } : saved));
      Swal.fire({ icon: 'success', title: 'Settings Saved!', timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to save', timer: 1500, showConfirmButton: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isHost && <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">Only the host can change room settings.</p>}

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Room Name</label>
        <input value={roomName} onChange={e => setRoomName(e.target.value)} disabled={!isHost}
          className="w-full px-3 py-2 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
      </div>

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={!isHost} rows={2}
          className="w-full px-3 py-2 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 resize-none"
          placeholder="What are you watching?" />
      </div>

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Language</label>
        <select value={language} onChange={e => setLanguage(e.target.value)} disabled={!isHost}
          className="w-full px-3 py-2 bg-[#0a0b1e] border border-[#252648] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50">
          {['English','Spanish','French','German','Japanese','Korean','Portuguese','Italian'].map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Visibility</label>
        <div className="flex gap-2">
          {[['public', 'Public'], ['private', 'Private']].map(([val, label]) => (
            <button key={val} onClick={() => isHost && setPrivacy(val)} disabled={!isHost}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${privacy === val ? 'bg-indigo-600 text-white' : 'bg-[#0a0b1e] border border-[#252648] text-gray-400'} disabled:opacity-50`}>
              {val === 'public' ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Playback Control</label>
        <div className="flex gap-2">
          {[['host', 'Host Only'], ['everyone', 'Everyone']].map(([val, label]) => (
            <button key={val} disabled={!isHost} onClick={() => setPlaybackPerm(val)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${playbackPerm === val ? 'bg-indigo-600 text-white' : 'bg-[#0a0b1e] border border-[#252648] text-gray-400'} disabled:opacity-50`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[#252648]">
        <label className="block text-xs text-gray-500 uppercase tracking-wider">Chat & Room</label>
        {[['Enable Chat', chatEnabled, setChatEnabled], ['Allow Links', allowLinks, setAllowLinks]].map(([label, val, setter]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{label}</span>
            <Toggle enabled={val} onChange={setter} disabled={!isHost} />
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Room Lock</span>
          <Toggle enabled={roomLocked} onChange={toggleRoomLock} disabled={!isHost} />
        </div>
      </div>

      {isHost && (
        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
          {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Settings'}
        </button>
      )}
    </div>
  );
};

// ─── Webcam Panel ─────────────────────────────────────────────────────────────
export const WebcamPanel = () => {
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [layout, setLayout] = useState('grid');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Attach stream to video element after camOn becomes true and video is rendered
  useEffect(() => {
    if (camOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [camOn]);

  const toggleCam = async () => {
    if (!camOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        streamRef.current = stream;
        setCamOn(true); // video element renders, then useEffect attaches srcObject
      } catch {
        Swal.fire({ icon: 'error', title: 'Camera Error', text: 'Could not access camera. Please check permissions.', confirmButtonColor: '#6366f1' });
      }
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOn(false);
    }
  };

  const toggleMic = async () => {
    if (!micOn) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicOn(true);
      } catch {
        Swal.fire({ icon: 'error', title: 'Mic Error', text: 'Could not access microphone.', confirmButtonColor: '#6366f1' });
      }
    } else {
      setMicOn(false);
    }
  };

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-[#0a0b1e] border border-[#252648] rounded-xl overflow-hidden flex items-center justify-center">
        {camOn ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <VideoOff className="h-8 w-8" />
            <span className="text-xs">Camera off</span>
          </div>
        )}
        {camOn && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />LIVE
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={toggleCam}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${camOn ? 'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30' : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30'}`}>
          {camOn ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          {camOn ? 'Stop Camera' : 'Start Camera'}
        </button>
        <button onClick={toggleMic}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${micOn ? 'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30' : 'bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30'}`}>
          {micOn ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {micOn ? 'Mute' : 'Unmute'}
        </button>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Layout</label>
        <div className="flex gap-2">
          {['grid', 'speaker'].map(l => (
            <button key={l} onClick={() => setLayout(l)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${layout === l ? 'bg-indigo-600 text-white' : 'bg-[#0a0b1e] border border-[#252648] text-gray-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Audio Settings Panel ─────────────────────────────────────────────────────
export const AudioPanel = () => {
  const [micVol, setMicVol] = useState(80);
  const [speakerVol, setSpeakerVol] = useState(100);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);

  const Toggle = ({ enabled, onChange }) => (
    <button onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Microphone Volume</label>
          <span className="text-xs text-indigo-400 font-mono">{micVol}%</span>
        </div>
        <input type="range" min={0} max={100} value={micVol} onChange={e => setMicVol(+e.target.value)}
          className="w-full h-1.5 bg-[#252648] rounded-full appearance-none cursor-pointer accent-indigo-500" />
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Speaker Volume</label>
          <span className="text-xs text-indigo-400 font-mono">{speakerVol}%</span>
        </div>
        <input type="range" min={0} max={100} value={speakerVol} onChange={e => setSpeakerVol(+e.target.value)}
          className="w-full h-1.5 bg-[#252648] rounded-full appearance-none cursor-pointer accent-indigo-500" />
      </div>
      <div className="space-y-3 pt-2 border-t border-[#252648]">
        {[['Echo Cancellation', echoCancellation, setEchoCancellation], ['Noise Suppression', noiseSuppression, setNoiseSuppression]].map(([label, val, setter]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{label}</span>
            <Toggle enabled={val} onChange={setter} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Connection Status ────────────────────────────────────────────────────────
export const ConnectionStatus = ({ status = 'connected' }) => {
  const config = {
    connected:    { color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   dot: 'bg-green-500',               label: 'Connected' },
    connecting:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-500 animate-pulse', label: 'Connecting...' },
    reconnecting: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-500 animate-pulse', label: 'Reconnecting...' },
    offline:      { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       dot: 'bg-red-500',                 label: 'Offline' },
    syncing:      { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     dot: 'bg-blue-500 animate-pulse',  label: 'Syncing...' },
  };
  const c = config[status] || config.connected;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 ${c.bg} border rounded-full`}>
      <div className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span className={`text-xs font-semibold ${c.color}`}>{c.label}</span>
    </div>
  );
};

// ─── Keyboard Shortcuts Hook ──────────────────────────────────────────────────
export const useKeyboardShortcuts = ({ onPlayPause, onFullscreen, onMute, onSeekBackward, onSeekForward }) => {
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); onPlayPause?.(); }
      if (e.code === 'KeyF') { e.preventDefault(); onFullscreen?.(); }
      if (e.code === 'KeyM') { e.preventDefault(); onMute?.(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); onSeekBackward?.(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); onSeekForward?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPlayPause, onFullscreen, onMute, onSeekBackward, onSeekForward]);
};

// ─── Keyboard Shortcuts Modal ─────────────────────────────────────────────────
export const KeyboardShortcutsModal = () => {
  const shortcuts = [
    ['Space', 'Play / Pause'],
    ['F', 'Toggle Fullscreen'],
    ['M', 'Toggle Mute'],
    ['Esc', 'Exit Fullscreen'],
    ['↑ / ↓', 'Volume (browser)'],
    ['← / →', 'Seek -10s / +10s'],
  ];
  return (
    <div className="space-y-2">
      {shortcuts.map(([key, desc]) => (
        <div key={key} className="flex items-center justify-between py-2 border-b border-[#252648]/50 last:border-0">
          <span className="text-sm text-gray-300">{desc}</span>
          <kbd className="px-2 py-1 bg-[#0a0b1e] border border-[#252648] rounded text-xs font-mono text-indigo-400">{key}</kbd>
        </div>
      ))}
    </div>
  );
};
