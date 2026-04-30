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

    // Handle marking messages as seen
    socket.on("mark_seen", async ({ viewerId, partnerId }) => {
      // Security: Ensure the socket taking the action actually belongs to the viewer
      if (String(userId) !== String(viewerId)) {
        console.warn(`[SECURITY] Socket ${socket.id} attempted to mark messages seen for user ${viewerId}`);
        return;
      }

      try {
        const updatedCount = await Message.markAsSeen(partnerId, viewerId);
        
        if (updatedCount > 0) {
          const partnerSocketId = getReceiverSocketId(partnerId);
          if (partnerSocketId) {
            io.to(partnerSocketId).emit("message_seen", { partnerId: viewerId });
          }
        }
      } catch (err) {
        console.error("mark_seen error:", err.message);
      }
    });

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

    // Handle new message
    socket.on("send_message", async (messageData) => {
      try {
        const message = await Message.create({
          sender: messageData.sender,
          receiver: messageData.receiver,
          text: messageData.text,
          replyTo: messageData.replyTo,
          image: messageData.image
        });

        // Get sender and receiver socket IDs
        const senderSocketId = getReceiverSocketId(messageData.sender);
        const receiverSocketId = getReceiverSocketId(messageData.receiver);

        // Send to receiver if online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", message.toJSON());
        }

        // Send confirmation to sender
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_sent", message.toJSON());
        }

        // Update message status to delivered
        if (receiverSocketId) {
          await Message.updateStatus(message.id, 'delivered');
          io.to(receiverSocketId).emit("message_delivered", { messageId: message.id });
        }

      } catch (err) {
        console.error("send_message error:", err.message);
        const senderSocketId = getReceiverSocketId(messageData.sender);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_error", { error: "Failed to send message" });
        }
      }
    });

    // Handle message deletion
    socket.on("delete_message", async ({ messageId, deleteType, userId: requesterId }) => {
      // Security check
      if (String(userId) !== String(requesterId)) {
        console.warn(`[SECURITY] Socket ${socket.id} attempted to delete message for user ${requesterId}`);
        return;
      }

      try {
        const message = await Message.getById(messageId);
        if (!message) return;

        if (deleteType === "everyone") {
          // Only sender can delete for everyone
          if (message.sender !== requesterId) {
            return;
          }
          await Message.deleteForEveryone(messageId);
          
          // Notify both users
          const senderSocketId = getReceiverSocketId(message.sender);
          const receiverSocketId = getReceiverSocketId(message.receiver);
          
          if (senderSocketId) {
            io.to(senderSocketId).emit("message_deleted", { messageId, deleteType: "everyone" });
          }
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("message_deleted", { messageId, deleteType: "everyone" });
          }
        } else if (deleteType === "me") {
          await Message.hideForUser(messageId, requesterId);
          
          // Only notify the requesting user
          const userSocketId = getReceiverSocketId(requesterId);
          if (userSocketId) {
            io.to(userSocketId).emit("message_deleted", { messageId, deleteType: "me" });
          }
        }
      } catch (err) {
        console.error("delete_message error:", err.message);
      }
    });

    // Handle conversation clearing
    socket.on("clear_conversation", async ({ partnerId, userId: requesterId }) => {
      // Security check
      if (String(userId) !== String(requesterId)) {
        console.warn(`[SECURITY] Socket ${socket.id} attempted to clear conversation for user ${requesterId}`);
        return;
      }

      try {
        await Message.clearConversation(requesterId, partnerId);
        
        // Notify the user who cleared the conversation
        const userSocketId = getReceiverSocketId(requesterId);
        if (userSocketId) {
          io.to(userSocketId).emit("conversation_cleared", { partnerId });
        }
      } catch (err) {
        console.error("clear_conversation error:", err.message);
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
