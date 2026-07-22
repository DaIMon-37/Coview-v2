const validateCreateParty = (req, res, next) => {
    const { title, privacy } = req.body;
    if (title && title.trim().length > 100) {
        return res.status(400).json({ message: 'Party title too long (max 100 characters)' });
    }
    if (privacy && !['public', 'private'].includes(privacy)) {
        return res.status(400).json({ message: 'Privacy must be public or private' });
    }
    next();
};

const validateJoinParty = (req, res, next) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: 'Party code is required' });
    }
    if (code.trim().length !== 6) {
        return res.status(400).json({ message: 'Party code must be 6 characters' });
    }
    next();
};

module.exports = { validateCreateParty, validateJoinParty };
