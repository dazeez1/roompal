const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const RoommateProfile = require('../models/RoommateProfile');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

/**
 * Get all conversations for the authenticated user
 * @route GET /api/messages/conversations
 * @access Private
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'fullName email')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: userId,
          isRead: false,
        });

        // Get the other participant (not the current user)
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );

        // Get profile image from roommate profile if available
        if (otherParticipant) {
          console.log(`🔍 Looking for profile image for user: ${otherParticipant.fullName} (ID: ${otherParticipant._id})`);
          const roommateProfile = await RoommateProfile.findOne({
            user: otherParticipant._id,
          }).select('profileImage user').lean();

          console.log(`🔍 RoommateProfile query result:`, roommateProfile ? {
            hasProfile: true,
            profileImage: roommateProfile.profileImage,
            userId: roommateProfile.user
          } : { hasProfile: false });

          if (roommateProfile && roommateProfile.profileImage) {
            otherParticipant.profileImage = roommateProfile.profileImage;
            console.log(`✅ Found profile image for ${otherParticipant.fullName}:`, roommateProfile.profileImage);
          } else {
            console.log(`⚠️ No profile image found for ${otherParticipant.fullName}`);
            // Try to find the profile to see if it exists at all
            const profileCheck = await RoommateProfile.findOne({
              user: otherParticipant._id,
            }).lean();
            console.log(`🔍 Profile exists check:`, profileCheck ? 'Profile exists but no image' : 'No profile found');
          }
        }

        return {
          ...conv,
          otherParticipant,
          unreadCount,
        };
      })
    );

    sendSuccessResponse(res, 200, 'Conversations retrieved successfully', {
      conversations: conversationsWithUnread,
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    sendErrorResponse(res, 500, 'Server error', error.message);
  }
};

/**
 * Get messages for a specific conversation
 * @route GET /api/messages/:conversationId
 * @access Private
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is a participant in this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return sendErrorResponse(res, 404, 'Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      return sendErrorResponse(res, 403, 'You are not authorized to view this conversation');
    }

    // Get messages
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'fullName email')
      .populate('receiver', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Add profile images from roommate profiles
    const messagesWithProfiles = await Promise.all(
      messages.map(async (msg) => {
        // Get sender profile image
        if (msg.sender) {
          console.log(`🔍 Looking for sender profile image: ${msg.sender.fullName} (ID: ${msg.sender._id})`);
          const senderProfile = await RoommateProfile.findOne({
            user: msg.sender._id,
          }).select('profileImage user').lean();
          console.log(`🔍 Sender profile result:`, senderProfile ? {
            hasProfile: true,
            profileImage: senderProfile.profileImage,
            userId: senderProfile.user
          } : { hasProfile: false });
          if (senderProfile && senderProfile.profileImage) {
            msg.sender.profileImage = senderProfile.profileImage;
            console.log(`✅ Added sender profile image:`, senderProfile.profileImage);
          } else {
            console.log(`⚠️ No profile image for sender ${msg.sender.fullName}`);
          }
        }

        // Get receiver profile image
        if (msg.receiver) {
          console.log(`🔍 Looking for receiver profile image: ${msg.receiver.fullName} (ID: ${msg.receiver._id})`);
          const receiverProfile = await RoommateProfile.findOne({
            user: msg.receiver._id,
          }).select('profileImage user').lean();
          console.log(`🔍 Receiver profile result:`, receiverProfile ? {
            hasProfile: true,
            profileImage: receiverProfile.profileImage,
            userId: receiverProfile.user
          } : { hasProfile: false });
          if (receiverProfile && receiverProfile.profileImage) {
            msg.receiver.profileImage = receiverProfile.profileImage;
            console.log(`✅ Added receiver profile image:`, receiverProfile.profileImage);
          } else {
            console.log(`⚠️ No profile image for receiver ${msg.receiver.fullName}`);
          }
        }

        return msg;
      })
    );

    // Get total count
    const total = await Message.countDocuments({ conversation: conversationId });

    // Reverse to show oldest first
    messagesWithProfiles.reverse();

    sendSuccessResponse(res, 200, 'Messages retrieved successfully', {
      messages: messagesWithProfiles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    sendErrorResponse(res, 500, 'Server error', error.message);
  }
};

/**
 * Send a message (REST endpoint - Socket.io will also handle this)
 * @route POST /api/messages
 * @access Private
 */
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { receiverId, content } = req.body;
    const senderId = req.user.userId;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return sendErrorResponse(res, 404, 'Receiver not found');
    }

    // Prevent self-messaging
    if (senderId.toString() === receiverId.toString()) {
      return sendErrorResponse(res, 400, 'Cannot send message to yourself');
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreateConversation(senderId, receiverId);

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      conversation: conversation._id,
      content: content.trim(),
    });

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate message
    await message.populate('sender', 'fullName email');
    await message.populate('receiver', 'fullName email');

    // Add profile images from roommate profiles
    const senderProfile = await RoommateProfile.findOne({
      user: message.sender._id,
    }).select('profileImage').lean();
    if (senderProfile && senderProfile.profileImage) {
      message.sender.profileImage = senderProfile.profileImage;
    }

    const receiverProfile = await RoommateProfile.findOne({
      user: message.receiver._id,
    }).select('profileImage').lean();
    if (receiverProfile && receiverProfile.profileImage) {
      message.receiver.profileImage = receiverProfile.profileImage;
    }

    sendSuccessResponse(res, 201, 'Message sent successfully', {
      message,
      conversation: {
        _id: conversation._id,
        participants: conversation.participants,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    sendErrorResponse(res, 500, 'Server error', error.message);
  }
};

/**
 * Mark message as read
 * @route PUT /api/messages/:id/read
 * @access Private
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find message
    const message = await Message.findById(id);
    if (!message) {
      return sendErrorResponse(res, 404, 'Message not found');
    }

    // Verify user is the receiver
    if (message.receiver.toString() !== userId.toString()) {
      return sendErrorResponse(res, 403, 'You are not authorized to mark this message as read');
    }

    // Mark as read
    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    sendSuccessResponse(res, 200, 'Message marked as read', {
      message,
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    sendErrorResponse(res, 500, 'Server error', error.message);
  }
};

/**
 * Get unread message count
 * @route GET /api/messages/unread/count
 * @access Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false,
    });

    sendSuccessResponse(res, 200, 'Unread count retrieved successfully', {
      unreadCount,
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    sendErrorResponse(res, 500, 'Server error', error.message);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
