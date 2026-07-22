const jwt = require("jsonwebtoken");
const supabase = require("../../config/supabase");

module.exports = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication failed"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data, error } = await supabase
            .from("users")
            .select("id, username, email")
            .eq("id", decoded.id)
            .maybeSingle();

        if (error || !data) return next(new Error("User not found"));

        socket.user = { id: data.id, username: data.username, email: data.email };
        next();
    } catch (err) {
        next(new Error("Invalid token"));
    }
};
