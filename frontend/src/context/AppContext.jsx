import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("coview_user")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("coview_token"));
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("coview_is_guest") === "true");
  // Start sessionRestored as true if we already have user+token in localStorage
  // so ProtectedRoute never flashes a redirect on refresh
  const [sessionRestored, setSessionRestored] = useState(() => {
    const hasToken = !!localStorage.getItem("coview_token");
    const hasUser = !!localStorage.getItem("coview_user");
    const isGuestStored = localStorage.getItem("coview_is_guest") === "true";
    return !hasToken || hasUser || isGuestStored;
  });
  const [party, setParty] = useState(() => { try { return JSON.parse(localStorage.getItem("coview_party")); } catch { return null; } });
  const [chatMessages, setChatMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentHostId, setCurrentHostId] = useState(null);
  const [roomLocked, setRoomLocked] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [queue, setQueue] = useState([]);
  const [roomSettings, setRoomSettings] = useState({ chatEnabled: true, allowLinks: true, playbackPerm: 'everyone' });
  const [moodPlaylists] = useState({
    popular: [
      { id: 1, title: "Top Movies 2024", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400" },
      { id: 2, title: "Trending Now", url: "https://www.youtube.com/embed/9bZkp7q19f0", thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400" },
      { id: 3, title: "Most Watched", url: "https://www.youtube.com/embed/kJQP7kiw5Fk", thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400" },
    ],
    chill: [
      { id: 1, title: "Relaxing Vibes", url: "https://www.youtube.com/embed/5qap5aO4i9A", thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400" },
      { id: 2, title: "Lo-Fi Beats", url: "https://www.youtube.com/embed/jfKfPfyJRdk", thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400" },
      { id: 3, title: "Calm Cinema", url: "https://www.youtube.com/embed/2Vv-BfVoq4g", thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400" },
    ],
    action: [
      { id: 1, title: "Epic Action", url: "https://www.youtube.com/embed/hA6hldpSTF8", thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400" },
      { id: 2, title: "Thriller Movies", url: "https://www.youtube.com/embed/L3pk_TBkihU", thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400" },
      { id: 3, title: "Adventure Time", url: "https://www.youtube.com/embed/tgbNymZ7vqY", thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400" },
    ],
    romance: [
      { id: 1, title: "Romantic Classics", url: "https://www.youtube.com/embed/fJ9rUzIMcZQ", thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400" },
      { id: 2, title: "Love Stories", url: "https://www.youtube.com/embed/QH2-TGUlwu4", thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400" },
      { id: 3, title: "Date Night Movies", url: "https://www.youtube.com/embed/nfWlot6h_JM", thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400" },
    ],
  });

  const pushNotification = useCallback((msg) => {
    const id = Date.now();
    setNotifications((prev) => [...prev.slice(-4), { id, message: msg }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4000);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("coview_token");
    if (storedToken && !isGuest) {
      authAPI.getMe()
        .then((res) => {
          const { user: u } = res.data;
          setUser((prev) => ({
            id: u.id, name: u.username, email: u.email,
            avatar: prev?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`,
            isPremium: prev?.isPremium || false, bio: prev?.bio || "",
            joinedDate: prev?.joinedDate || new Date(u.created_at).toLocaleDateString(),
          }));
          setToken(storedToken);
        })
        .catch((err) => {
          const status = err?.response?.status;
          // Only clear the session when the server actually rejected the token
          // (expired/invalid/revoked). A network hiccup, a 5xx, or the API
          // being briefly unreachable should NOT force the user to log back in —
          // this was the cause of "asks to relogin on every refresh".
          if (status === 401 || status === 403) {
            localStorage.removeItem("coview_token");
            localStorage.removeItem("coview_user");
            setToken(null); setUser(null);
          }
          // otherwise: keep the cached user/token from localStorage as-is
        })
        .finally(() => setSessionRestored(true));
    } else {
      setSessionRestored(true);
    }
  }, []); // eslint-disable-line

  // Socket wiring
  useEffect(() => {
    if (!token || isGuest) return;
    const sock = connectSocket(token);

    const handlers = {
      "online-users": (users) => setOnlineUsers(users),
      "typing-users": (users) => setTypingUsers(users),
      "host-changed": ({ hostId }) => setCurrentHostId(hostId),
      "room-locked": ({ locked }) => setRoomLocked(locked),
      "moderator-assigned": ({ userId, username }) => {
        pushNotification(`${username || "A user"} is now a moderator`);
        setOnlineUsers(prev => prev.map(u => u.id === userId ? { ...u, isModerator: true } : u));
      },

      "moderator-removed": ({ userId }) => {
        setOnlineUsers(prev => prev.map(u => u.id === userId ? { ...u, isModerator: false } : u));
      },

      "muted": ({ message }) => {
        pushNotification(message || "You have been muted");
      },

      "unmuted": () => {
        pushNotification("You have been unmuted");
      },

      "notification": ({ message }) => pushNotification(message),

      "room-state": ({ users, hostId, video, playlist, locked, settings }) => {
        if (users) setOnlineUsers(users);
        if (hostId) setCurrentHostId(hostId);
        if (video?.url) setCurrentVideo(video.url);
        if (playlist !== undefined) setQueue(playlist);
        if (locked !== undefined) setRoomLocked(locked);
        if (settings) setRoomSettings(settings);
      },

      "settings-updated": ({ settings }) => {
        if (settings) setRoomSettings(settings);
      },

      "chat-error": ({ message }) => {
        pushNotification(message);
      },

      "video-loaded": (state) => {
        if (state?.url) setCurrentVideo(state.url);
      },

      "video-speed-changed": ({ speed }) => {
        // handled in ViewingScreen/ViewingScreenChat directly
      },

      "playlist-updated": ({ playlist }) => {
        if (playlist) setQueue(playlist);
      },

      "receive-message": (msg) => {
        setChatMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, {
            id: msg.id, user: msg.username,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${msg.username}`,
            message: msg.message,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            color: "text-indigo-400",
          }];
        });
      },

      "user-joined": ({ username }) => {
        setChatMessages((prev) => [...prev, {
          id: `sys-join-${Date.now()}`, user: "System", avatar: null,
          message: `${username} joined the party 🎉`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          color: "text-green-400", isSystem: true,
        }]);
      },

      "user-left": ({ username }) => {
        setChatMessages((prev) => [...prev, {
          id: `sys-left-${Date.now()}`, user: "System", avatar: null,
          message: `${username} left the party`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          color: "text-red-400", isSystem: true,
        }]);
      },

      "kicked": ({ message }) => {
        pushNotification("You were removed from the room");
        setParty(null);
        localStorage.removeItem("coview_party");
        window.location.href = "/";
      },

      "join-error": ({ message }) => {
        pushNotification(message);
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => sock.on(event, handler));
    return () => Object.entries(handlers).forEach(([event, handler]) => sock.off(event, handler));
  }, [token, isGuest]); // eslint-disable-line

  useEffect(() => {
    if (user) localStorage.setItem("coview_user", JSON.stringify(user));
    else localStorage.removeItem("coview_user");
  }, [user]);

  useEffect(() => {
    if (party) localStorage.setItem("coview_party", JSON.stringify(party));
    else localStorage.removeItem("coview_party");
  }, [party]);

  const login = useCallback(async (credentials) => {
    if (credentials.skipAPI) {
      const { skipAPI, ...userData } = credentials;
      setUser({ ...userData, avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}` });
      setIsGuest(false);
      localStorage.setItem("coview_is_guest", "false");
      return { success: true };
    }
    try {
      const res = await authAPI.login({ email: credentials.email, password: credentials.password });
      const { token: newToken, user: u } = res.data;
      setToken(newToken);
      localStorage.setItem("coview_token", newToken);
      setUser({ id: u.id, name: u.username, email: u.email, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`, isPremium: false, bio: "", joinedDate: new Date().toLocaleDateString() });
      setIsGuest(false);
      localStorage.setItem("coview_is_guest", "false");
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Login failed" };
    }
  }, []);

  const register = useCallback(async ({ fullName, email, password }) => {
    try {
      await authAPI.register({ username: fullName, email, password });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Registration failed" };
    }
  }, []);

  const logout = useCallback(() => {
    const sock = getSocket();
    if (sock && party?.code) sock.emit("leave-party", { partyCode: party.code });
    disconnectSocket();
    setUser(null); setToken(null); setIsGuest(false); setParty(null);
    setChatMessages([]); setOnlineUsers([]); setCurrentHostId(null);
    localStorage.removeItem("coview_token"); localStorage.removeItem("coview_user");
    localStorage.removeItem("coview_party"); localStorage.removeItem("coview_is_guest");
  }, [party]);

  const loginAsGuest = useCallback(() => {
    const guestName = `Guest_${Math.floor(Math.random() * 10000)}`;
    setUser({ name: guestName, email: null, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${guestName}`, isGuest: true, joinedDate: new Date().toLocaleDateString() });
    setIsGuest(true);
    localStorage.setItem("coview_is_guest", "true");
  }, []);

  const emitJoinParty = useCallback((code, videoUrl) => {
    const sock = getSocket();
    if (!sock) return;
    const payload = { partyCode: code, ...(videoUrl ? { videoUrl } : {}) };
    if (sock.connected) sock.emit("join-party", payload);
    else sock.once("connect", () => sock.emit("join-party", payload));
  }, []);

  // Re-join socket room on refresh if party is in localStorage
  useEffect(() => {
    if (!token || isGuest) return;
    const savedParty = (() => { try { return JSON.parse(localStorage.getItem("coview_party")); } catch { return null; } })();
    if (savedParty?.code) {
      const sock = getSocket();
      const payload = { partyCode: savedParty.code };
      if (sock) {
        if (sock.connected) sock.emit("join-party", payload);
        else sock.once("connect", () => sock.emit("join-party", payload));
      }
    }
  }, [token, isGuest]); // eslint-disable-line

  const joinParty = useCallback((partyData) => {
    setParty(partyData); setChatMessages([]);
    if (partyData.code) emitJoinParty(partyData.code, partyData.videoUrl);
  }, [emitJoinParty]);

  const createParty = useCallback((partyData) => {
    setParty(partyData); setChatMessages([]);
    if (partyData.code) emitJoinParty(partyData.code, partyData.videoUrl);
    return partyData.code;
  }, [emitJoinParty]);

  const sendMessage = useCallback((message) => {
    const sock = getSocket();
    if (sock?.connected && party?.code && !isGuest) {
      sock.emit("send-message", { partyCode: party.code, message });
    } else {
      setChatMessages((prev) => [...prev, {
        id: `local-${Date.now()}`, user: user?.name || "Guest",
        avatar: user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=Guest`,
        message, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        color: "text-gray-400",
      }]);
    }
  }, [party, isGuest, user]);

  const sendTyping = useCallback((isTyping) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) {
      sock.emit(isTyping ? "typing-start" : "typing-stop", { partyCode: party.code });
    }
  }, [party]);

  const transferHost = useCallback((newHostId) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) {
      sock.emit("transfer-host", { partyCode: party.code, newHostId });
    }
  }, [party]);

  const kickUser = useCallback((userId) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("kick-user", { partyCode: party.code, userId });
  }, [party]);

  const banUser = useCallback((userId) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("ban-user", { partyCode: party.code, userId });
  }, [party]);

  const muteUser = useCallback((userId) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("mute-user", { partyCode: party.code, userId });
  }, [party]);

  const unmuteUser = useCallback((userId) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("unmute-user", { partyCode: party.code, userId });
  }, [party]);

  const promoteModeratorAction = useCallback((userId) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("promote-moderator", { partyCode: party.code, userId });
  }, [party]);

  const removeModeratorAction = useCallback((userId) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("remove-moderator", { partyCode: party.code, userId });
  }, [party]);

  const toggleRoomLock = useCallback(() => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("toggle-lock", { partyCode: party.code });
  }, [party]);

  const syncPlaylist = useCallback((newQueue) => {
    setQueue(newQueue);
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("playlist-update", { partyCode: party.code, playlist: newQueue });
  }, [party]);

  const addToQueue = useCallback((video) => {
    setQueue((prev) => {
      const updated = [...prev, video];
      const sock = getSocket();
      if (sock?.connected && party?.code) sock.emit("playlist-add", { partyCode: party.code, video });
      return updated;
    });
  }, [party]);

  const removeFromQueue = useCallback((videoId) => {
    setQueue((prev) => {
      const updated = prev.filter((v) => v.id !== videoId);
      const sock = getSocket();
      if (sock?.connected && party?.code) sock.emit("playlist-remove", { partyCode: party.code, videoId });
      return updated;
    });
  }, [party]);

  const clearPlaylist = useCallback(() => {
    setQueue([]);
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("playlist-clear", { partyCode: party.code });
  }, [party]);

  const shufflePlaylist = useCallback(() => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("playlist-shuffle", { partyCode: party.code });
  }, [party]);

  const videoStop = useCallback(() => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("video-stop", { partyCode: party.code });
  }, [party]);

  const videoSpeed = useCallback((speed) => {
    const sock = getSocket();
    if (sock?.connected && party?.code) sock.emit("video-speed", { partyCode: party.code, speed });
  }, [party]);

  const clearChatMessages = useCallback(() => setChatMessages([]), []);

  const loadChatHistory = useCallback((messages) => {
    if (!messages || messages.length === 0) return;
    const formatted = messages.map((m) => ({
      id: m.id,
      user: m.users?.username || m.username || "Unknown",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${m.users?.username || "User"}`,
      message: m.message,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      color: "text-indigo-400",
    }));
    setChatMessages(formatted);
  }, []);

  const updateUserProfile = useCallback(async (updates) => {
    if (isGuest) return { success: false, error: "Guests can't edit their profile" };
    try {
      // Only "name" maps to a real backend column (username). Bio/avatar
      // aren't in the schema, so they stay client-side same as before.
      if (updates.name !== undefined && updates.name !== user?.name) {
        await authAPI.updateProfile({ username: updates.name });
      }
      setUser((prev) => ({ ...prev, ...updates }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to update profile" };
    }
  }, [isGuest, user]);

  const validateAccessCode = useCallback(() => true, []);
  const getPartyByCode = useCallback(() => null, []);
  const [invalidCodeAttempts, setInvalidCodeAttempts] = useState(0);
  const incrementInvalidCodeAttempts = useCallback(() => setInvalidCodeAttempts((p) => p + 1), []);
  const resetInvalidCodeAttempts = useCallback(() => setInvalidCodeAttempts(0), []);

  return (
    <AppContext.Provider value={{
      user, token, isGuest, sessionRestored,
      login, register, logout, loginAsGuest,
      party, setParty, joinParty, createParty,
      chatMessages, sendMessage, sendTyping, clearChatMessages, loadChatHistory,
      onlineUsers, typingUsers, currentHostId,
      roomLocked, toggleRoomLock,
      notifications,
      transferHost, kickUser, banUser, muteUser, unmuteUser, promoteModeratorAction, removeModeratorAction,
      queue, setQueue, syncPlaylist, addToQueue, removeFromQueue, clearPlaylist, shufflePlaylist,
      roomSettings,
      currentVideo, setCurrentVideo, videoStop, videoSpeed,
      moodPlaylists,
      updateUserProfile,
      validateAccessCode, getPartyByCode,
      invalidCodeAttempts, incrementInvalidCodeAttempts, resetInvalidCodeAttempts,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
