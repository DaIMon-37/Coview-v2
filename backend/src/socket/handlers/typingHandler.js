const RoomManager = require("../../services/RoomManager");

module.exports = (io, socket) => {

    socket.on("typing-start", ({ partyCode }) => {
        RoomManager.setTyping(partyCode, socket.user.id);
        // Emit usernames array (what frontend expects)
        const typingUsers = RoomManager.getTypingUsers(partyCode).map(u => u.username);
        io.to(partyCode).emit("typing-users", typingUsers);
    });

    socket.on("typing-stop", ({ partyCode }) => {
        RoomManager.removeTyping(partyCode, socket.user.id);
        const typingUsers = RoomManager.getTypingUsers(partyCode).map(u => u.username);
        io.to(partyCode).emit("typing-users", typingUsers);
    });

};