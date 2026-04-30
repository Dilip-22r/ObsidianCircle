const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const firestoreService = require('../services/firestore');
const requireAuth = require('../middleware/requireAuth');

// POST /messages - Send a new message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { receiverId, text, replyTo, image } = req.body;
    const senderId = req.user.uid;

    // Validate required fields
    if (!receiverId || (!text && !image)) {
      return res.status(400).json({ error: 'Receiver ID and either text or image are required' });
    }

    // Check if user can message the receiver
    const canMessage = await Message.canMessage(senderId, receiverId);
    if (!canMessage.canMessage) {
      return res.status(403).json({ error: 'Cannot message this user', reason: canMessage.reason });
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text: text || '',
      replyTo,
      image: image || ''
    });

    // Get sender and receiver profiles for notification
    const [senderProfile, receiverProfile] = await Promise.all([
      firestoreService.getProfileByUserId(senderId),
      firestoreService.getProfileByUserId(receiverId)
    ]);

    // Emit real-time message via socket
    const { sendToUser } = require('../services/socketService');
    const messageData = message.toJSON();
    
    // Add profile information to message data
    messageData.senderProfile = senderProfile;
    messageData.receiverProfile = receiverProfile;

    // Send to receiver if online
    sendToUser(receiverId, 'newMessage', messageData);

    res.status(201).json(messageData);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /messages/:userId - Get messages between current user and specified user
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.uid;
    const otherUserId = req.params.userId;
    const limit = parseInt(req.query.limit) || 50;

    // Get messages between users
    const messages = await Message.getBetweenUsers(currentUserId, otherUserId, limit);

    // Get user profiles
    const [currentUserProfile, otherUserProfile] = await Promise.all([
      firestoreService.getProfileByUserId(currentUserId),
      firestoreService.getProfileByUserId(otherUserId)
    ]);

    // Add profile information to messages
    const messagesWithProfiles = await Promise.all(
      messages.map(async (message) => {
        const messageData = message.toJSON();
        
        // Add sender/receiver profiles
        if (message.sender === currentUserId) {
          messageData.senderProfile = currentUserProfile;
          messageData.receiverProfile = otherUserProfile;
        } else {
          messageData.senderProfile = otherUserProfile;
          messageData.receiverProfile = currentUserProfile;
        }

        // Add reply to message details if exists
        if (message.replyTo) {
          const replyMessage = await Message.getById(message.replyTo);
          if (replyMessage) {
            messageData.replyToMessage = replyMessage.toJSON();
          }
        }

        return messageData;
      })
    );

    res.json(messagesWithProfiles);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// GET /messages/conversations - Get user's conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.uid;

    // Get conversations
    const conversations = await Message.getConversations(currentUserId);

    // Add partner profile information
    const conversationsWithProfiles = await Promise.all(
      conversations.map(async (conversation) => {
        const partnerProfile = await firestoreService.getProfileByUserId(conversation.partnerId);
        
        return {
          ...conversation,
          partner: partnerProfile ? {
            id: partnerProfile.id,
            user_id: partnerProfile.user_id,
            name: partnerProfile.name,
            email: partnerProfile.email || '',
            photo: partnerProfile.photo || '',
            skills: partnerProfile.skills || [],
            role: partnerProfile.tags?.[0] || 'user'
          } : null,
          unreadCount: conversation.unreadCount || 0
        };
      })
    );

    // Filter out conversations without valid partners and sort
    const validConversations = conversationsWithProfiles
      .filter(conv => conv.partner !== null)
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json(validConversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// PUT /messages/:messageId/status - Update message status
router.put('/:messageId/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const messageId = req.params.messageId;
    const currentUserId = req.user.uid;

    // Validate status
    if (!['sent', 'delivered', 'seen'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get message
    const message = await Message.getById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only receiver can update status to 'seen'
    if (status === 'seen' && message.receiver !== currentUserId) {
      return res.status(403).json({ error: 'Only receiver can mark message as seen' });
    }

    // Update status
    const updatedMessage = await Message.updateStatus(messageId, status);

    // Emit real-time status update
    const { sendToUser } = require('../services/socketService');
    
    if (status === 'seen') {
      sendToUser(message.sender, 'message_seen', { 
        messageId, 
        partnerId: currentUserId 
      });
    } else if (status === 'delivered') {
      sendToUser(message.sender, 'message_delivered', { messageId });
    }

    res.json(updatedMessage.toJSON());
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// DELETE /messages/:messageId - Delete message for everyone
router.delete('/:messageId', requireAuth, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const currentUserId = req.user.uid;

    // Get message
    const message = await Message.getById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete for everyone
    if (message.sender !== currentUserId) {
      return res.status(403).json({ error: 'Only sender can delete message for everyone' });
    }

    // Delete message
    await Message.deleteForEveryone(messageId);

    // Emit real-time deletion
    const { sendToUser } = require('../services/socketService');
    sendToUser(message.receiver, 'message_deleted', { messageId, deleteType: 'everyone' });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// DELETE /messages/:messageId/for-me - Hide message for current user
router.delete('/:messageId/for-me', requireAuth, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const currentUserId = req.user.uid;

    // Get message
    const message = await Message.getById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // User must be sender or receiver
    if (message.sender !== currentUserId && message.receiver !== currentUserId) {
      return res.status(403).json({ error: 'You are not part of this conversation' });
    }

    // Hide message for user
    await Message.hideForUser(messageId, currentUserId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error hiding message:', error);
    res.status(500).json({ error: 'Failed to hide message' });
  }
});

// DELETE /messages/clear/:userId - Clear conversation with user
router.delete('/clear/:userId', requireAuth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user.uid;

    // Clear conversation
    await Message.clearConversation(currentUserId, otherUserId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ error: 'Failed to clear conversation' });
  }
});

// GET /messages/can-message/:userId - Check if user can message another user
router.get('/can-message/:userId', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.uid;
    const otherUserId = req.params.userId;

    const canMessage = await Message.canMessage(currentUserId, otherUserId);

    res.json(canMessage);
  } catch (error) {
    console.error('Error checking messaging permission:', error);
    res.status(500).json({ error: 'Failed to check messaging permission' });
  }
});

// PUT /messages/mark-seen/:userId - Mark all messages from user as seen
router.put('/mark-seen/:userId', requireAuth, async (req, res) => {
  try {
    const senderId = req.params.userId;
    const receiverId = req.user.uid;

    // Mark messages as seen
    const updatedCount = await Message.markAsSeen(senderId, receiverId);

    // Emit real-time update
    const { sendToUser } = require('../services/socketService');
    sendToUser(senderId, 'message_seen', { partnerId: receiverId });

    res.json({ updatedCount });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ error: 'Failed to mark messages as seen' });
  }
});

module.exports = router;
