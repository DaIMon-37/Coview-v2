const validateSendMessage = (req, res, next) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: 'Message cannot be empty' });
    }
    if (message.trim().length > 1000) {
        return res.status(400).json({ message: 'Message too long (max 1000 characters)' });
    }
    req.body.message = message.trim();
    next();
};

module.exports = { validateSendMessage };
