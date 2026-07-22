const supabase = require("../config/supabase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password)
            return res.status(400).json({ message: "Username, email and password are required" });
        if (username.trim().length < 2 || username.trim().length > 30)
            return res.status(400).json({ message: "Username must be 2-30 characters" });
        if (password.length < 6)
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ message: "Invalid email address" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from("users")
            .insert([{
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword
            }])
            .select("id, username, email")
            .single();

        if (error) {
            if (error.code === "23505")
                return res.status(400).json({ message: "Email or username already in use" });
            return res.status(400).json({ message: "Registration failed" });
        }

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email.trim().toLowerCase())
            .maybeSingle();

        if (error || !data)
            return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, data.password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid email or password" });

        const token = jwt.sign(
            { id: data.id, username: data.username, email: data.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: data.id, username: data.username, email: data.email }
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("id, username, email, created_at")
            .eq("id", req.user.id)
            .maybeSingle();

        if (error || !data)
            return res.status(404).json({ message: "User not found" });

        res.json({ user: data });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Persist profile edits (currently just display name / username) so they
// survive a refresh instead of being silently overwritten by the next
// getMe() call once the session is restored.
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username } = req.body;

        if (username !== undefined) {
            if (username.trim().length < 2 || username.trim().length > 30)
                return res.status(400).json({ message: "Username must be 2-30 characters" });
        }

        const updates = {};
        if (username !== undefined) updates.username = username.trim();

        if (Object.keys(updates).length === 0)
            return res.status(400).json({ message: "Nothing to update" });

        const { data, error } = await supabase
            .from("users")
            .update(updates)
            .eq("id", userId)
            .select("id, username, email, created_at")
            .single();

        if (error) {
            if (error.code === "23505")
                return res.status(400).json({ message: "That username is already taken" });
            return res.status(400).json({ message: "Failed to update profile" });
        }

        res.json({ message: "Profile updated", user: data });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Real, queryable profile stats — no more hardcoded placeholder numbers.
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [hostedRes, joinedRes, messagesRes] = await Promise.all([
            supabase.from("parties").select("id", { count: "exact", head: true }).eq("host_id", userId),
            supabase.from("party_members").select("id", { count: "exact", head: true }).eq("user_id", userId),
            supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", userId),
        ]);

        res.json({
            partiesHosted: hostedRes.count || 0,
            partiesJoined: joinedRes.count || 0,
            messagesSent: messagesRes.count || 0,
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
