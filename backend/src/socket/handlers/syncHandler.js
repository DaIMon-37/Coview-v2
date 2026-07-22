const SyncService = require("../../services/SyncService");
const RoomManager = require("../../services/RoomManager");

module.exports = (io, socket) => {

    socket.on("ntp-sync", ({ partyCode, clientSendTime }) => {

        socket.emit("ntp-response", {
            clientSendTime,
            serverTime: Date.now()
        });

    });

    socket.on("clock-offset", ({ partyCode, offset }) => {

        RoomManager.setClockOffset(
            partyCode,
            socket.user.id,
            offset
        );

    });

    socket.on("sync-request", ({ partyCode, currentTime, version }) => {

        const correction = SyncService.getCorrection({
            partyCode,
            currentTime,
            version
        });

        if (!correction) return;

        socket.emit("sync-response", correction);

    });

};