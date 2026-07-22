const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const partyRoutes = require("./src/routes/partyRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const socketHandler = require("./src/socket/socketHandler");
const socketAuth = require("./src/socket/middleware/socketAuth");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

// Simple in-memory rate limiter for auth routes
const rateLimitMap = new Map();
const rateLimit = (maxRequests, windowMs) => (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + windowMs;
    }

    entry.count++;
    rateLimitMap.set(key, entry);

    if (entry.count > maxRequests) {
        return res.status(429).json({ message: "Too many requests. Please slow down." });
    }
    next();
};

// ROUTES
app.use("/api/auth", rateLimit(20, 60000), authRoutes);
app.use("/api/party", partyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/search", searchRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: Date.now() }));
app.get("/", (req, res) => res.send("CoView Server Running"));

// Global error handler
app.use((err, req, res, next) => {
    console.error("[Error]", err.message);
    res.status(500).json({ message: "Internal server error" });
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

io.use(socketAuth);
socketHandler(io);
app.set("io", io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`[CoView] Server running on port ${PORT}`);
});
