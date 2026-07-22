const ChatService = require("../services/ChatService");

exports.getHistory = async (req, res) => {
    try {
        const { partyId } = req.params;
        const messages = await ChatService.getMessages(partyId);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        await ChatService.deleteMessage(messageId, userId);
        res.json({ message: "Message deleted" });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

exports.getUserHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await ChatService.getUserWatchHistory(userId);
        res.json({ history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};