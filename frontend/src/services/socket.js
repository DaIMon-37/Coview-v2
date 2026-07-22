import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (socket) {
    if (socket.connected) return socket;
    // Reconnect with new token if disconnected
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => console.log("[Socket] Connected:", socket.id));
  socket.on("disconnect", (reason) => console.log("[Socket] Disconnected:", reason));
  socket.on("connect_error", (err) => console.error("[Socket] Error:", err.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
