const RoomManager = require("./RoomManager");

class SyncService {

    // Maximum drift before correction (seconds)
    DRIFT_THRESHOLD = 0.3;

    // Hard seek threshold (seconds)
    HARD_SEEK_THRESHOLD = 1;

    /**
     * Calculate where the video SHOULD be
     * based on last update timestamp.
     */
    getAuthoritativeState(partyCode) {

        const video = RoomManager.getVideo(partyCode);

        if (!video) return null;

        const currentTime = RoomManager.getAuthoritativeTime(partyCode);

        return {
            ...video,
            currentTime
        };

    }

    /**
     * Compare client state with server state.
     */
    calculateDrift(
        partyCode,
        clientCurrentTime
    ) {

        const server =
            this.getAuthoritativeState(partyCode);

        if (!server) return null;

        const drift =
            server.currentTime - clientCurrentTime;

        return {
            drift,
            serverState: server
        };
    }

    /**
     * Decide how client should recover.
     */
    getCorrection({
        partyCode,
        currentTime,
        version
    }) {

        const result =
            this.calculateDrift(
                partyCode,
                currentTime
            );

        if (!result) return null;

        const { drift, serverState } = result;
        if (
            version === serverState.version &&
            Math.abs(drift) < this.DRIFT_THRESHOLD
        ) {
            return null;
        }

        const abs = Math.abs(drift);

        if (abs < this.DRIFT_THRESHOLD) {

            return {
                action: "none",
                drift,
                state: serverState
            };

        }

        if (abs < this.HARD_SEEK_THRESHOLD) {

            return {
                action: "speed",
                drift,
                playbackRate: drift > 0 ? 1.08 : 0.92,
                state: serverState
            };

        }

        return {
            action: "seek",
            drift,
            state: serverState
        };

    }

}

module.exports = new SyncService();