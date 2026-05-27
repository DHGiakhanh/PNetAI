const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const db = require("../models");

// Track active online users: Map<userId (string) -> Set of socketIds (string)>
const onlineUsers = new Map();
let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
    },
  });

  // Authentication Middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Check if token starts with Bearer
      const tokenString = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

      jwt.verify(tokenString, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error("Authentication error: Invalid token"));
        }
        socket.userId = decoded.userId;
        socket.role = decoded.role;
        next();
      });
    } catch (error) {
      next(new Error("Authentication error: Internal validation failure"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId.toString();
    
    // Add socket to user's active sockets set
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // If it's the first connection for this user, broadcast that they are online
    if (onlineUsers.get(userId).size === 1) {
      io.emit("user_status_change", { userId, status: "online" });
    }

    // Join a conversation room
    socket.on("join_conversation", async (conversationId) => {
      try {
        if (!conversationId) return;

        // Verify if user is actually a participant of the conversation
        const conversation = await db.Conversation.findById(conversationId);
        if (conversation && conversation.participants.map(p => p.toString()).includes(userId)) {
          socket.join(conversationId.toString());
        }
      } catch (err) {
        console.error("Socket error joining room: ", err);
      }
    });

    // Leave a conversation room
    socket.on("leave_conversation", (conversationId) => {
      if (conversationId) {
        socket.leave(conversationId.toString());
      }
    });

    // Typing Indicators
    socket.on("typing", (conversationId) => {
      if (conversationId) {
        socket.to(conversationId.toString()).emit("user_typing_status", {
          conversationId,
          userId,
          isTyping: true,
        });
      }
    });

    socket.on("stop_typing", (conversationId) => {
      if (conversationId) {
        socket.to(conversationId.toString()).emit("user_typing_status", {
          conversationId,
          userId,
          isTyping: false,
        });
      }
    });

    // Manual status query (to check if specific users are online)
    socket.on("get_users_status", (userIds) => {
      if (Array.isArray(userIds)) {
        const statuses = {};
        userIds.forEach((id) => {
          statuses[id] = onlineUsers.has(id.toString()) ? "online" : "offline";
        });
        socket.emit("users_status", statuses);
      }
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast that the user went offline
          io.emit("user_status_change", { userId, status: "offline" });
        }
      }
    });
  });

  return io;
};

// Send real-time events to all sockets of a specific user
const emitToUser = (userId, eventName, data) => {
  if (io && onlineUsers.has(userId.toString())) {
    const socketIds = onlineUsers.get(userId.toString());
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(eventName, data);
    });
    return true;
  }
  return false;
};

// Emit real-time events to a conversation room
const emitToConversation = (conversationId, eventName, data) => {
  if (io) {
    io.to(conversationId.toString()).emit(eventName, data);
    return true;
  }
  return false;
};

// Helper to check if a user is currently online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

module.exports = {
  initSocket,
  emitToUser,
  emitToConversation,
  isUserOnline,
};
