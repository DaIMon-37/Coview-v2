const VideoService = require("../../services/VideoService");
const RoomManager = require("../../services/RoomManager");

module.exports = (io, socket) => {

    // Whether play/pause/seek are controlled by any participant or only the
    // host is driven by the room's "Playback Control" setting (see
    // RoomSettingsPanel) — default to "everyone" if the room hasn't set one.
    // We still validate the user is actually a member of the room (not just
    // anyone guessing a partyCode).
    const isMember = (partyCode) => !!RoomManager.getUser(partyCode, socket.user.id);
    const canControlPlayback = (partyCode) => {
        if (!isMember(partyCode)) return false;
        const { playbackPerm } = RoomManager.getSettings(partyCode);
        if (playbackPerm === "host") return RoomManager.isHost(partyCode, socket.user.id);
        return true;
    };

    socket.on("video-load", ({ partyCode, provider, source }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        const state = VideoService.loadVideo(partyCode, provider, source);
        io.to(partyCode).emit("video-loaded", state);
        io.to(partyCode).emit("notification", { type: "video-changed", message: "Video changed" });
    });

    socket.on("video-play", ({ partyCode, currentTime }) => {
        if (!canControlPlayback(partyCode)) return;
        const state = VideoService.play(partyCode, currentTime);
        io.to(partyCode).emit("video-played", state);
    });

    socket.on("video-pause", ({ partyCode, currentTime }) => {
        if (!canControlPlayback(partyCode)) return;
        const state = VideoService.pause(partyCode, currentTime);
        io.to(partyCode).emit("video-paused", state);
    });

    socket.on("video-seek", ({ partyCode, currentTime }) => {
        if (!canControlPlayback(partyCode)) return;
        const state = VideoService.seek(partyCode, currentTime);
        io.to(partyCode).emit("video-seeked", state);
    });

    socket.on("video-stop", ({ partyCode }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        const state = VideoService.pause(partyCode, 0);
        io.to(partyCode).emit("video-paused", state);
        io.to(partyCode).emit("notification", { type: "video-stopped", message: "Video stopped by host" });
    });

    socket.on("video-speed", ({ partyCode, speed }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        RoomManager.updateVideo(partyCode, { playbackRate: speed });
        io.to(partyCode).emit("video-speed-changed", { speed });
    });

    // Host advances to a specific video (used for "play from queue" and
    // auto-advance when a video ends). If videoId is provided, that item is
    // removed from the playlist; otherwise the first queued item is used.
    socket.on("video-next", ({ partyCode, videoId }) => {
        if (!RoomManager.isHost(partyCode, socket.user.id)) return;
        const playlist = RoomManager.getPlaylist(partyCode);
        if (!playlist || playlist.length === 0) return;

        const next = videoId ? playlist.find(v => v.id === videoId) : playlist[0];
        if (!next) return;

        RoomManager.removeFromPlaylist(partyCode, next.id);

        const state = VideoService.loadVideo(partyCode, next.provider || "custom", next.url);
        io.to(partyCode).emit("video-loaded", state);
        io.to(partyCode).emit("playlist-updated", { playlist: RoomManager.getPlaylist(partyCode) });
        io.to(partyCode).emit("notification", { type: "video-changed", message: `Now playing: ${next.title || "next video"}` });
    });

    socket.on("video-sync-request", ({ partyCode }) => {
        const video = RoomManager.getVideo(partyCode);
        if (!video) return;
        socket.emit("video-sync-response", {
            ...video,
            authoritativeTime: RoomManager.getAuthoritativeTime(partyCode)
        });
    });
};
