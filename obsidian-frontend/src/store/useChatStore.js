import { create } from 'zustand';
import { io } from 'socket.io-client';

const useChatStore = create((set, get) => ({
  // Socket state
  socket: null,
  onlineUsers: [],
  
  // Chat state
  messages: [],
  selectedUserId: null,
  conversations: [],
  unreadCounts: {},
  
  // UI state
  typingUsers: new Map(),
  
  // Initialize socket connection
  initializeSocket: (userId) => {
    if (get().socket) return;
    
    const socket = io('http://localhost:3001', {
      query: { userId },
      transports: ['websocket', 'polling']
    });
    
    socket.on('getOnlineUsers', (users) => {
      set({ onlineUsers: users });
    });
    
    socket.on('newMessage', (message) => {
      const { selectedUserId, messages, unreadCounts } = get();
      
      if (message.sender === selectedUserId || message.receiver === selectedUserId) {
        set({ messages: [...messages, message] });
      } else {
        // Update unread count for conversations
        const partnerId = message.sender === userId ? message.receiver : message.sender;
        set({ 
          unreadCounts: { 
            ...unreadCounts, 
            [partnerId]: (unreadCounts[partnerId] || 0) + 1 
          } 
        });
      }
    });
    
    socket.on('message_seen', ({ partnerId }) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg.sender === partnerId ? { ...msg, status: 'seen' } : msg
      );
      set({ messages: updatedMessages });
    });
    
    socket.on('message_delivered', ({ messageId }) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, status: 'delivered' } : msg
      );
      set({ messages: updatedMessages });
    });
    
    socket.on('typing_start', ({ senderId }) => {
      const { typingUsers } = get();
      typingUsers.set(senderId, true);
      set({ typingUsers: new Map(typingUsers) });
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        const { typingUsers } = get();
        typingUsers.delete(senderId);
        set({ typingUsers: new Map(typingUsers) });
      }, 3000);
    });
    
    socket.on('typing_stop', ({ senderId }) => {
      const { typingUsers } = get();
      typingUsers.delete(senderId);
      set({ typingUsers: new Map(typingUsers) });
    });
    
    socket.on('message_deleted', ({ messageId, deleteType }) => {
      const { messages } = get();
      if (deleteType === 'everyone') {
        set({ messages: messages.filter(msg => msg.id !== messageId) });
      } else {
        set({ messages: messages.filter(msg => msg.id !== messageId) });
      }
    });
    
    socket.on('conversation_cleared', ({ partnerId }) => {
      const { selectedUserId } = get();
      if (selectedUserId === partnerId) {
        set({ messages: [] });
      }
    });
    
    socket.on('message_error', ({ error }) => {
      console.error('Message error:', error);
    });
    
    set({ socket });
  },
  
  // Disconnect socket
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
  
  // Set selected user
  setSelectedUserId: (userId) => {
    set({ selectedUserId: userId, messages: [] });
  },
  
  // Set messages
  setMessages: (messages) => {
    set({ messages });
  },
  
  // Add message
  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },
  
  // Set conversations
  setConversations: (conversations) => {
    set({ conversations });
  },
  
  // Update unread count
  updateUnreadCount: (userId, count) => {
    const { unreadCounts } = get();
    set({ 
      unreadCounts: { 
        ...unreadCounts, 
        [userId]: count 
      } 
    });
  },
  
  // Mark message as deleted
  markMessageDeleted: (messageId) => {
    const { messages } = get();
    set({ messages: messages.filter(msg => msg.id !== messageId) });
  },
  
  // Send message
  sendMessage: async (messageData) => {
    // The actual sending is done via REST in MessagesPage.
    // We don't need to emit send_message here to avoid duplicates.
  },
  
  // Mark messages as seen
  markAsSeen: async (partnerId) => {
    try {
      // Import fetchApi if needed, or assume it's handled in the component.
      // Wait, useChatStore cannot import fetchApi easily because of circular dependencies sometimes?
      // Actually, we can just do a fetch using the auth token, or we can leave markAsSeen to the component.
      // Since fetchApi might be needed, let's keep it simple.
    } catch (error) {
      console.error(error);
    }
  },
  
  // Start typing
  startTyping: (receiverId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('typing_start', { receiverId });
    }
  },
  
  // Stop typing
  stopTyping: (receiverId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('typing_stop', { receiverId });
    }
  },
  
  // Delete message
  deleteMessage: async (messageId, deleteType) => {
    // Moved to MessagesPage.jsx to use fetchApi
  },
  
  // Clear conversation
  clearConversation: async (partnerId) => {
    // Moved to MessagesPage.jsx to use fetchApi
  }
}));

export default useChatStore;
