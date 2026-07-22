const roomHandler = require("./handlers/roomHandler");
const chatHandler = require("./handlers/chatHandler");
const typingHandler = require("./handlers/typingHandler");
const videoHandler = require("./handlers/videoHandler");
const syncHandler = require("./handlers/syncHandler");
const RoomManager = require("../services/RoomManager");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log(`[Socket] ${socket.user.username} connected (${socket.id})`);

        roomHandler(io, socket);
        chatHandler(io, socket);
        typingHandler(io, socket);
        videoHandler(io, socket);
        syncHandler(io, socket);

        socket.on("disconnect", () => {
            const info = RoomManager.getRoomBySocket(socket.id);
            if (!info) return;

            const { room, user } = info;
            const wasHost = RoomManager.isHost(room.partyCode, user.id);

            RoomManager.removeUser(room.partyCode, user.id);

            if (wasHost) {
                const newHost = RoomManager.transferHost(room.partyCode);
                if (newHost) {
                    io.to(room.partyCode).emit("host-changed", {
                        hostId: newHost.id,
                        username: newHost.username,
                    });
                    io.to(room.partyCode).emit("notification", {
                        type: "host-changed",
                        message: `Host left. ${newHost.username} is now the host`
                    });
                }
            }

            io.to(room.partyCode).emit("online-users", RoomManager.getUsers(room.partyCode));
            socket.to(room.partyCode).emit("user-left", {
                id: user.id,
                username: user.username,
                email: user.email
            });

            console.log(`[Socket] ${user.username} disconnected`);
        });
    });
};
