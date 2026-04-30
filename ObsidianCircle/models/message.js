const { db } = require('../config/firebase');

// Message collection reference
const messagesCollection = db.collection('messages');

class Message {
  constructor(data) {
    this.id = data.id;
    this.sender = data.sender;
    this.receiver = data.receiver;
    this.text = data.text;
    this.status = data.status || 'sent';
    this.deleted = data.deleted || false;
    this.hiddenFor = data.hiddenFor || [];
    this.replyTo = data.replyTo || null;
    this.sharedPost = data.sharedPost || null;
    this.image = data.image || '';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  // Create a new message
  static async create(messageData) {
    const message = {
      sender: messageData.sender,
      receiver: messageData.receiver,
      text: messageData.text,
      status: 'sent',
      deleted: false,
      hiddenFor: [],
      replyTo: messageData.replyTo || null,
      sharedPost: messageData.sharedPost || null,
      image: messageData.image || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await messagesCollection.add(message);
    const doc = await docRef.get();
    
    return new Message({
      id: doc.id,
      ...doc.data()
    });
  }

  // Get messages between two users
  static async getBetweenUsers(userId1, userId2, limit = 50) {
    const snapshot = await messagesCollection
      .where('sender', 'in', [userId1, userId2])
      .where('receiver', 'in', [userId1, userId2])
      .where('deleted', '==', false)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Don't include messages hidden for the current user
      if (!data.hiddenFor || !data.hiddenFor.includes(userId1)) {
        messages.push(new Message({
          id: doc.id,
          ...data
        }));
      }
    });

    return messages.reverse(); // Return in chronological order
  }

  // Get conversation list for a user
  static async getConversations(userId) {
    // Get all messages where user is sender or receiver
    const sentSnapshot = await messagesCollection
      .where('sender', '==', userId)
      .where('deleted', '==', false)
      .orderBy('created_at', 'desc')
      .get();

    const receivedSnapshot = await messagesCollection
      .where('receiver', '==', userId)
      .where('deleted', '==', false)
      .orderBy('created_at', 'desc')
      .get();

    const conversations = new Map();

    // Process sent messages
    sentSnapshot.forEach(doc => {
      const data = doc.data();
      const partnerId = data.receiver;
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partnerId,
          lastMessage: data,
          lastMessageTime: data.created_at,
          unreadCount: 0
        });
      }
    });

    // Process received messages
    receivedSnapshot.forEach(doc => {
      const data = doc.data();
      const partnerId = data.sender;
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partnerId,
          lastMessage: data,
          lastMessageTime: data.created_at,
          unreadCount: 0
        });
      } else {
        // Update if this message is newer
        if (data.created_at > conversations.get(partnerId).lastMessageTime) {
          conversations.get(partnerId).lastMessage = data;
          conversations.get(partnerId).lastMessageTime = data.created_at;
        }
      }

      // Count unread messages
      if (data.status !== 'seen') {
        conversations.get(partnerId).unreadCount++;
      }
    });

    // Convert to array and sort by last message time
    return Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  }

  // Update message status
  static async updateStatus(messageId, status) {
    await messagesCollection.doc(messageId).update({
      status,
      updated_at: new Date().toISOString()
    });

    const doc = await messagesCollection.doc(messageId).get();
    return new Message({
      id: doc.id,
      ...doc.data()
    });
  }

  // Mark messages as seen
  static async markAsSeen(senderId, receiverId) {
    const snapshot = await messagesCollection
      .where('sender', '==', senderId)
      .where('receiver', '==', receiverId)
      .where('status', 'in', ['sent', 'delivered'])
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        status: 'seen',
        updated_at: new Date().toISOString()
      });
    });

    await batch.commit();
    return snapshot.size;
  }

  // Delete message for everyone
  static async deleteForEveryone(messageId) {
    await messagesCollection.doc(messageId).update({
      deleted: true,
      updated_at: new Date().toISOString()
    });
  }

  // Hide message for specific user
  static async hideForUser(messageId, userId) {
    const doc = await messagesCollection.doc(messageId).get();
    if (!doc.exists) throw new Error('Message not found');

    const data = doc.data();
    const hiddenFor = data.hiddenFor || [];
    
    if (!hiddenFor.includes(userId)) {
      hiddenFor.push(userId);
      await messagesCollection.doc(messageId).update({
        hiddenFor,
        updated_at: new Date().toISOString()
      });
    }
  }

  // Clear conversation for user
  static async clearConversation(userId1, userId2) {
    const snapshot = await messagesCollection
      .where('sender', 'in', [userId1, userId2])
      .where('receiver', 'in', [userId1, userId2])
      .where('deleted', '==', false)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      const data = doc.data();
      const hiddenFor = data.hiddenFor || [];
      
      if (!hiddenFor.includes(userId1)) {
        hiddenFor.push(userId1);
        batch.update(doc.ref, {
          hiddenFor,
          updated_at: new Date().toISOString()
        });
      }
    });

    await batch.commit();
  }

  // Check if user can message another user
  static async canMessage(senderId, receiverId) {
    // For now, allow all users to message each other
    // In a real app, you might check blocks, privacy settings, etc.
    return { canMessage: true, reason: null };
  }

  // Get message by ID
  static async getById(messageId) {
    const doc = await messagesCollection.doc(messageId).get();
    if (!doc.exists) return null;

    return new Message({
      id: doc.id,
      ...doc.data()
    });
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      sender: this.sender,
      receiver: this.receiver,
      text: this.text,
      status: this.status,
      deleted: this.deleted,
      hiddenFor: this.hiddenFor,
      replyTo: this.replyTo,
      sharedPost: this.sharedPost,
      image: this.image,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Message;
