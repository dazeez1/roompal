const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const RoommateProfile = require('../models/RoommateProfile');
const { authenticateSocket } = require('../services/socketService');

// Store online users: { userId: socketId }
const onlineUsers = new Map();

/**
 * Initialize Socket.io handler
 * @param {Object} io - Socket.io server instance
 */
const initializeSocket = (io) => {
  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const user = await authenticateSocket(token);
      
      if (!user) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Attach user to socket
      socket.userId = user.userId;
      socket.user = user;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Handle connection
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    console.log(`✅ User connected: ${user.fullName} (${userId})`);

    // Add user to online list
    onlineUsers.set(userId, socket.id);

    // Notify user's contacts that they're online
    socket.broadcast.emit('user_online', {
      userId,
      fullName: user.fullName,
    });

    // Join user's personal room
    socket.join(`user_${userId}`);

    // Handle send_message event
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;

        // Validate input
        if (!receiverId || !content || content.trim().length === 0) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        if (content.length > 5000) {
          socket.emit('error', { message: 'Message too long (max 5000 characters)' });
          return;
        }

        // Prevent self-messaging
        if (userId === receiverId) {
          socket.emit('error', { message: 'Cannot send message to yourself' });
          return;
        }

        // Verify receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('error', { message: 'Receiver not found' });
          return;
        }

        // Find or create conversation
        const conversation = await Conversation.findOrCreateConversation(userId, receiverId);

        // Create message
        const message = await Message.create({
          sender: userId,
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

        // Emit to sender (confirmation)
        socket.emit('message_sent', {
          message,
          conversation: {
            _id: conversation._id,
            participants: conversation.participants,
          },
        });

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', {
            message,
            conversation: {
              _id: conversation._id,
              participants: conversation.participants,
            },
          });
        }

        // Also emit to receiver's room (in case they're connected via multiple tabs)
        io.to(`user_${receiverId}`).emit('new_message', {
          message,
          conversation: {
            _id: conversation._id,
            participants: conversation.participants,
          },
        });
      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message_read event
    socket.on('message_read', async (data) => {
      try {
        const { messageId } = data;

        if (!messageId) {
          socket.emit('error', { message: 'Message ID required' });
          return;
        }

        // Find message
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Verify user is the receiver
        if (message.receiver.toString() !== userId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Mark as read
        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        // Notify sender that message was read
        const senderSocketId = onlineUsers.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_read_receipt', {
            messageId: message._id,
            readAt: message.readAt,
          });
        }

        // Also emit to sender's room
        io.to(`user_${message.sender}`).emit('message_read_receipt', {
          messageId: message._id,
          readAt: message.readAt,
        });
      } catch (error) {
        console.error('Error handling message_read:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user_typing', {
            userId,
            fullName: user.fullName,
          });
        }
      }
    });

    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user_stopped_typing', {
            userId,
          });
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${user.fullName} (${userId})`);

      // Remove from online list
      onlineUsers.delete(userId);

      // Notify contacts that user is offline
      socket.broadcast.emit('user_offline', {
        userId,
      });
    });
  });

  return io;
};

/**
 * Get online users
 * @returns {Array} - Array of online user IDs
 */
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean} - True if user is online
 */
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

module.exports = {
  initializeSocket,
  getOnlineUsers,
  isUserOnline,
};
