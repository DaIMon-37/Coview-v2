// How long an empty room is kept alive before being torn down.
// This exists so a solo host who refreshes the page (which briefly
// disconnects their socket before the client reconnects) doesn't lose
// the room's video state, playlist, and host assignment.
const EMPTY_ROOM_GRACE_MS = 60 * 1000;

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.pendingDeletions = new Map(); // partyCode -> setTimeout handle
    }

    createRoom(partyCode, hostId) {
        if (this.rooms.has(partyCode)) return this.rooms.get(partyCode);

        const room = {
            partyCode,
            hostId,
            temporaryHostId: null,
            users: new Map(),
            typingUsers: new Set(),
            locked: false,
            playlist: [],
            bannedUsers: new Set(),
            mutedUsers: new Set(),
            moderators: new Set(),
            settings: {
                chatEnabled: true,
                allowLinks: true,
                playbackPerm: "everyone",
            },
            video: {
                provider: null,
                url: null,
                isPlaying: false,
                currentTime: 0,
                playbackRate: 1,
                lastUpdated: Date.now(),
                version: 0,
                startedAt: null
            },
            clockOffsets: new Map()
        };

        this.rooms.set(partyCode, room);
        return room;
    }

    getRoom(partyCode) { return this.rooms.get(partyCode); }

    deleteRoom(partyCode) {
        this.clearPendingDeletion(partyCode);
        this.rooms.delete(partyCode);
    }

    clearPendingDeletion(partyCode) {
        const handle = this.pendingDeletions.get(partyCode);
        if (handle) {
            clearTimeout(handle);
            this.pendingDeletions.delete(partyCode);
        }
    }

    // Schedule a room for deletion after a grace period instead of nuking it
    // immediately. Cancelled automatically if anyone (re)joins in the meantime.
    scheduleRoomDeletion(partyCode) {
        this.clearPendingDeletion(partyCode);
        const handle = setTimeout(() => {
            const room = this.rooms.get(partyCode);
            if (room && room.users.size === 0) this.rooms.delete(partyCode);
            this.pendingDeletions.delete(partyCode);
        }, EMPTY_ROOM_GRACE_MS);
        this.pendingDeletions.set(partyCode, handle);
    }

    addUser(partyCode, user) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        // Reject banned users
        if (room.bannedUsers.has(user.id)) return false;
        room.users.set(user.id, { id: user.id, username: user.username, email: user.email, socketId: user.socketId });
        // Someone is here again — cancel any pending teardown for this room.
        this.clearPendingDeletion(partyCode);
        return true;
    }

    removeUser(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.users.delete(userId);
        room.typingUsers.delete(userId);
        room.clockOffsets.delete(userId);
        // Don't delete immediately — give a reconnecting/refreshing user a
        // grace window to rejoin before the room (and its playlist/video
        // state) is torn down.
        if (room.users.size === 0) this.scheduleRoomDeletion(partyCode);
    }

    getUsers(partyCode) {
        const room = this.getRoom(partyCode);
        if (!room) return [];
        return [...room.users.values()].map(u => ({
            ...u,
            isModerator: room.moderators.has(u.id),
            isMuted: room.mutedUsers.has(u.id),
        }));
    }

    getUser(partyCode, userId) {
        const room = this.getRoom(partyCode);
        return room?.users.get(userId) || null;
    }

    banUser(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.bannedUsers.add(userId);
    }

    isBanned(partyCode, userId) {
        const room = this.getRoom(partyCode);
        return room ? room.bannedUsers.has(userId) : false;
    }

    muteUser(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.mutedUsers.add(userId);
    }

    unmuteUser(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.mutedUsers.delete(userId);
    }

    isMuted(partyCode, userId) {
        const room = this.getRoom(partyCode);
        return room ? room.mutedUsers.has(userId) : false;
    }

    addModerator(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.moderators.add(userId);
    }

    removeModerator(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.moderators.delete(userId);
    }

    isModerator(partyCode, userId) {
        const room = this.getRoom(partyCode);
        return room ? room.moderators.has(userId) : false;
    }

    getHost(partyCode) {
        const room = this.getRoom(partyCode);
        if (!room) return null;
        return room.temporaryHostId || room.hostId;
    }

    isHost(partyCode, userId) { return this.getHost(partyCode) === userId; }

    transferHostTo(partyCode, newHostId) {
        const room = this.getRoom(partyCode);
        if (!room) return null;
        if (!room.users.has(newHostId)) return null;
        room.temporaryHostId = newHostId;
        return room.users.get(newHostId);
    }

    transferHost(partyCode) {
        const room = this.getRoom(partyCode);
        if (!room) return null;
        const users = [...room.users.values()];
        if (users.length === 0) { room.temporaryHostId = null; return null; }
        const nextHost = users[0];
        room.temporaryHostId = nextHost.id;
        return nextHost;
    }

    restoreHost(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        if (room.hostId === userId) room.temporaryHostId = null;
    }

    getSettings(partyCode) {
        const room = this.getRoom(partyCode);
        return room ? room.settings : { chatEnabled: true, allowLinks: true, playbackPerm: "everyone" };
    }

    setSettings(partyCode, updates) {
        const room = this.getRoom(partyCode);
        if (!room) return null;
        room.settings = { ...room.settings, ...updates };
        return room.settings;
    }

    setLocked(partyCode, locked) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.locked = locked;
    }

    isLocked(partyCode) {
        const room = this.getRoom(partyCode);
        return room ? room.locked : false;
    }

    // Playlist management
    setPlaylist(partyCode, playlist) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.playlist = playlist;
    }

    getPlaylist(partyCode) {
        const room = this.getRoom(partyCode);
        return room ? room.playlist : [];
    }

    addToPlaylist(partyCode, item) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.playlist.push(item);
    }

    removeFromPlaylist(partyCode, itemId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.playlist = room.playlist.filter(v => v.id !== itemId);
    }

    reorderPlaylist(partyCode, playlist) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.playlist = playlist;
    }

    updateVideo(partyCode, updates) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        if (updates.isPlaying === true && !room.video.isPlaying) updates.startedAt = Date.now();
        if (updates.isPlaying === false && room.video.isPlaying) updates.startedAt = null;
        room.video = { ...room.video, ...updates, lastUpdated: Date.now(), version: room.video.version + 1 };
    }

    getVideo(partyCode) {
        const room = this.getRoom(partyCode);
        return room ? room.video : null;
    }

    getAuthoritativeTime(partyCode) {
        const room = this.getRoom(partyCode);
        if (!room) return null;
        const video = room.video;
        if (!video.isPlaying || !video.startedAt) return video.currentTime;
        return video.currentTime + (Date.now() - video.startedAt) / 1000;
    }

    setTyping(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.typingUsers.add(userId);
    }

    removeTyping(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.typingUsers.delete(userId);
    }

    getTypingUsers(partyCode) {
        const room = this.getRoom(partyCode);
        if (!room) return [];
        return [...room.typingUsers].map(id => room.users.get(id)).filter(Boolean);
    }

    setClockOffset(partyCode, userId, offset) {
        const room = this.getRoom(partyCode);
        if (!room) return;
        room.clockOffsets.set(userId, offset);
    }

    getRoomBySocket(socketId) {
        for (const room of this.rooms.values()) {
            for (const user of room.users.values()) {
                if (user.socketId === socketId) return { room, user };
            }
        }
        return null;
    }

    getUserSocket(partyCode, userId) {
        const room = this.getRoom(partyCode);
        if (!room) return null;
        return room.users.get(userId)?.socketId || null;
    }

    getAllRooms() { return [...this.rooms.values()]; }
}

module.exports = new RoomManager();
