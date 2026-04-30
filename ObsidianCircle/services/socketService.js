const { Server } = require("socket.io");
const Message = require("../models/message");

let io;
const userSocketMap = {};

// Initialize Socket.IO server
function initializeSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: [
        /localhost:\d+$/,
        /\.vercel\.app$/,
        process.env.ALLOWED_ORIGIN || "http://localhost:5173"
      ].filter(Boolean),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    
    if (userId && userId !== "undefined") {
      userSocketMap[userId] = socket.id;
      console.log(`User ${userId} connected with socket ${socket.id}`);
    }
    
    // Emit online users list to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Handle typing indicators
    socket.on("typing_start", ({ receiverId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing_start", { senderId: userId });
      }
    });

    socket.on("typing_stop", ({ receiverId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing_stop", { senderId: userId });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      if (userId && userId !== "undefined") {
        delete userSocketMap[userId];
        console.log(`User ${userId} disconnected`);
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
}

// Get socket ID for a user
function getReceiverSocketId(userId) {
  return userSocketMap[userId?.toString()];
}

// Get online users list
function getOnlineUsers() {
  return Object.keys(userSocketMap);
}

// Send message to specific user
function sendToUser(userId, event, data) {
  const socketId = getReceiverSocketId(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
}

// Broadcast to all users
function broadcast(event, data) {
  io.emit(event, data);
}

module.exports = {
  initializeSocketIO,
  getReceiverSocketId,
  getOnlineUsers,
  sendToUser,
  broadcast,
  io: () => io
};
