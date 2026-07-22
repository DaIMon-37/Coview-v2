const RoomManager = require("./RoomManager");

class VideoService {

    loadVideo(partyCode, provider, source) {

        RoomManager.updateVideo(partyCode, {
            provider,
            url: source,
            currentTime: 0,
            isPlaying: false,
            playbackRate: 1
        });

        return RoomManager.getVideo(partyCode);

    }

    play(partyCode, currentTime) {

        RoomManager.updateVideo(partyCode, {
            isPlaying: true,
            currentTime
        });

        return RoomManager.getVideo(partyCode);

    }

    pause(partyCode, currentTime) {

        RoomManager.updateVideo(partyCode, {
            isPlaying: false,
            currentTime
        });

        return RoomManager.getVideo(partyCode);

    }

    seek(partyCode, currentTime) {

        RoomManager.updateVideo(partyCode, {
            currentTime
        });

        return RoomManager.getVideo(partyCode);

    }

    getState(partyCode) {

        return RoomManager.getVideo(partyCode);

    }

}

module.exports = new VideoService();