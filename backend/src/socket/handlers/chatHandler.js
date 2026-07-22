const ChatService = require("../../services/ChatService");
const PartyService = require("../../services/PartyService");
const RoomManager = require("../../services/RoomManager");

const MAX_MESSAGE_LENGTH = 500;

module.exports = (io, socket) => {
    socket.on("send-message", async ({ partyCode, message }) => {
        try {
            if (!partyCode || !message || !message.trim()) return;

            // Block muted users
            if (RoomManager.isMuted(partyCode, socket.user.id)) {
                socket.emit("chat-error", { message: "You are muted in this room." });
                return;
            }

            const isHost = RoomManager.isHost(partyCode, socket.user.id);
            const { chatEnabled, allowLinks } = RoomManager.getSettings(partyCode);

            // Chat disabled — host can still post, everyone else is blocked.
            if (chatEnabled === false && !isHost) {
                socket.emit("chat-error", { message: "Chat has been disabled by the host." });
                return;
            }

            const sanitized = message.trim().slice(0, MAX_MESSAGE_LENGTH);

            // Links disabled — block non-host messages that contain a URL.
            if (allowLinks === false && !isHost && /(https?:\/\/|www\.)\S+/i.test(sanitized)) {
                socket.emit("chat-error", { message: "Links are not allowed in this room." });
                return;
            }

            const party = await PartyService.getPartyByCode(partyCode);
            const saved = await ChatService.saveMessage({
                partyId: party.id,
                userId: socket.user.id,
                message: sanitized
            });

            io.to(partyCode).emit("receive-message", {
                id: saved.id,
                partyId: party.id,
                userId: socket.user.id,
                username: socket.user.username,
                message: saved.message,
                createdAt: saved.created_at
            });
        } catch (err) {
            socket.emit("chat-error", { message: err.message });
        }
    });
};
