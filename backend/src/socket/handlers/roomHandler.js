const VideoService = require("../../services/VideoService");
const RoomManager = require("../../services/RoomManager");
const PartyService = require("../../services/PartyService");

module.exports = (io, socket) => {

    socket.on("join-party", async ({ partyCode, videoUrl }) => {
        let room = RoomManager.getRoom(partyCode);
        const isNewRoom = !room;
        if (!room) room = RoomManager.createRoom(partyCode, socket.user.id);

        // First time this room comes to life in memory — seed its settings
        // (chat/links/playback permission) from whatever was last saved to
        // the DB, instead of always starting from hardcoded defaults.
        if (isNewRoom) {
            try {
                const partyRow = await PartyService.getPartyByCode(partyCode);
                RoomManager.setSettings(partyCode, {
                    chatEnabled: partyRow.chat_enabled ?? true,
                    allowLinks: partyRow.allow_links ?? true,
                    playbackPerm: partyRow.playback_perm || "everyone",
                });
            } catch {
                // Party row might not exist yet (e.g. race with create) — keep defaults.
            }
        }

        // Reject banned users
        if (RoomManager.isBanned(partyCode, socket.user.id)) {
            socket.emit("join-error", { message: "You are banned from this room." });
            return;
        }

        // Reject if room is locked and user is not the host
        if (room.locked && !RoomManager.isHost(partyCode, socket.user.id)) {
            socket.emit("join-error", { message: "This room is locked by the host." });
            return;
        }

        socket.join(partyCode);
        socket.partyCode = partyCode;

        RoomManager.addUser(partyCode, {
            id: socket.user.id,
            username: socket.user.username,
            email: socket.user.email,
            socketId: socket.id
        });

        RoomManager.restoreHost(partyCode, socket.user.id);
        const hostId = RoomManager.getHost(partyCode);

        // Always seed video from host; for joiners only seed if room has no video yet
        const existingVideo = RoomManager.getVideo(partyCode);
        const isRoomHost = RoomManager.getHost(partyCode) === socket.user.id;
        if (videoUrl && (isRoomHost || !existingVideo?.url)) {
            RoomManager.updateVideo(partyCode, {
                provider: "custom",
                url: videoUrl,
                currentTime: existingVideo?.currentTime || 0,
                isPlaying: existingVideo?.isPlaying || false,
                playbackRate: existingVideo?.playbackRate || 1
            });
        }

        io.to(partyCode).emit("host-changed", { hostId });

        const video = RoomManager.getVideo(partyCode);
        const playlist = RoomManager.getPlaylist(partyCode);

        // Send full room state to joining user
        socket.emit("room-state", {
            video,
            users: RoomManager.getUsers(partyCode),
            hostId,
            playlist,
            locked: room.locked,
            settings: RoomManager.getSettings(partyCode)
        });

        // Sync current video to late joiner
        if (video && video.url) {
            socket.emit("video-loaded", {
                ...video,
                currentTime: RoomManager.getAuthoritativeTime(partyCode)
            });
        }

        socket.emit("joined-success", { room: partyCode });
        io.to(partyCode).emit("online-users", RoomManager.getUsers(partyCode));
        socket.to(partyCode).emit("user-joined", {
            id: socket.user.id,
            username: socket.user.username,
            email: socket.user.email
        });

        console.log(`[Room] ${socket.user.username} joined ${partyCode}`);
    });

    socket.on("leave-party", ({ partyCode }) => {
        socket.leave(partyCode);
        socket.partyCode = null;
        RoomManager.removeUser(partyCode, socket.user.id);
        io.to(partyCode).emit("online-users", RoomManager.getUsers(partyCode));
        socket.to(partyCode).emit("user-left", {
            id: socket.user.id,
            username: socket.user.username,
            email: socket.user.email
        });
        console.log(`[Room] ${socket.user.username} left ${partyCode}`);
    });

    // Host transfers control to another user
    socket.on("transfer-host", ({ partyCode, newHostId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        const newHost = RoomManager.transferHostTo(partyCode, newHostId);
        if (!newHost) return;
        io.to(partyCode).emit("host-changed", { hostId: newHost.id, username: newHost.username });
        io.to(partyCode).emit("notification", {
            type: "host-changed",
            message: `${newHost.username} is now the host`
        });
    });

    // Host kicks a user
    socket.on("kick-user", ({ partyCode, userId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        if (userId === socket.user.id) return;

        const targetSocketId = RoomManager.getUserSocket(partyCode, userId);
        if (!targetSocketId) return;

        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
            targetSocket.emit("kicked", { message: "You have been removed from the room by the host." });
            targetSocket.leave(partyCode);
        }

        RoomManager.removeUser(partyCode, userId);
        io.to(partyCode).emit("online-users", RoomManager.getUsers(partyCode));
        io.to(partyCode).emit("notification", { type: "user-kicked", message: "A user was removed by the host" });
    });

    // Host bans a user (kick + flag in room state)
    socket.on("ban-user", ({ partyCode, userId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        if (userId === socket.user.id) return;

        const targetSocketId = RoomManager.getUserSocket(partyCode, userId);
        RoomManager.banUser(partyCode, userId);

        if (targetSocketId) {
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
                targetSocket.emit("kicked", { message: "You have been banned from this room." });
                targetSocket.leave(partyCode);
            }
        }

        RoomManager.removeUser(partyCode, userId);
        io.to(partyCode).emit("online-users", RoomManager.getUsers(partyCode));
        io.to(partyCode).emit("notification", { type: "user-banned", message: "A user was banned by the host" });
    });

    // Host mutes a user in chat
    socket.on("mute-user", ({ partyCode, userId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.muteUser(partyCode, userId);
        const targetSocketId = RoomManager.getUserSocket(partyCode, userId);
        if (targetSocketId) {
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) targetSocket.emit("muted", { message: "You have been muted by the host." });
        }
        io.to(partyCode).emit("notification", { type: "user-muted", message: "A user was muted" });
    });

    // Host unmutes a user
    socket.on("unmute-user", ({ partyCode, userId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.unmuteUser(partyCode, userId);
        const targetSocketId = RoomManager.getUserSocket(partyCode, userId);
        if (targetSocketId) {
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) targetSocket.emit("unmuted", { message: "You have been unmuted." });
        }
    });

    // Promote to moderator
    socket.on("promote-moderator", ({ partyCode, userId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.addModerator(partyCode, userId);
        const user = RoomManager.getUser(partyCode, userId);
        io.to(partyCode).emit("moderator-assigned", { userId, username: user?.username });
        io.to(partyCode).emit("notification", { type: "moderator-assigned", message: `${user?.username || "A user"} is now a moderator` });
    });

    // Remove moderator
    socket.on("remove-moderator", ({ partyCode, userId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.removeModerator(partyCode, userId);
        io.to(partyCode).emit("moderator-removed", { userId });
    });

    // Host locks/unlocks the room
    socket.on("toggle-lock", ({ partyCode }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        const room = RoomManager.getRoom(partyCode);
        if (!room) return;
        RoomManager.setLocked(partyCode, !room.locked);
        io.to(partyCode).emit("room-locked", { locked: room.locked });
        io.to(partyCode).emit("notification", {
            type: "room-locked",
            message: room.locked ? "Room is now locked" : "Room is now unlocked"
        });
    });

    // Any member of the room (not just the host) is allowed to add videos
    // to the shared queue — we still check they're actually in the room,
    // not just anyone guessing a partyCode.
    const isRoomMember = (partyCode) => !!RoomManager.getUser(partyCode, socket.user.id);

    socket.on("playlist-update", ({ partyCode, playlist }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.setPlaylist(partyCode, playlist);
        socket.to(partyCode).emit("playlist-updated", { playlist });
    });

    socket.on("playlist-add", ({ partyCode, video }) => {
        if (!isRoomMember(partyCode)) return;
        RoomManager.addToPlaylist(partyCode, video);
        io.to(partyCode).emit("playlist-updated", { playlist: RoomManager.getPlaylist(partyCode) });
        io.to(partyCode).emit("notification", { type: "playlist-add", message: `"${video.title}" added to queue by ${socket.user.username}` });
    });

    socket.on("playlist-remove", ({ partyCode, videoId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.removeFromPlaylist(partyCode, videoId);
        io.to(partyCode).emit("playlist-updated", { playlist: RoomManager.getPlaylist(partyCode) });
    });

    socket.on("playlist-reorder", ({ partyCode, playlist }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.reorderPlaylist(partyCode, playlist);
        socket.to(partyCode).emit("playlist-updated", { playlist });
    });

    socket.on("playlist-clear", ({ partyCode }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.setPlaylist(partyCode, []);
        io.to(partyCode).emit("playlist-updated", { playlist: [] });
        io.to(partyCode).emit("notification", { type: "playlist-clear", message: "Playlist cleared" });
    });

    socket.on("playlist-shuffle", ({ partyCode }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        const playlist = RoomManager.getPlaylist(partyCode);
        const shuffled = [...playlist].sort(() => Math.random() - 0.5);
        RoomManager.setPlaylist(partyCode, shuffled);
        io.to(partyCode).emit("playlist-updated", { playlist: shuffled });
        io.to(partyCode).emit("notification", { type: "playlist-shuffle", message: "Playlist shuffled" });
    });
};
