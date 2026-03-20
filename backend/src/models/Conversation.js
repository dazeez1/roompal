const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Method to find or create conversation between two users
conversationSchema.statics.findOrCreateConversation = async function (user1Id, user2Id) {
  // Convert to ObjectIds if strings
  const mongoose = require('mongoose');
  const user1 = mongoose.Types.ObjectId.isValid(user1Id) ? new mongoose.Types.ObjectId(user1Id) : user1Id;
  const user2 = mongoose.Types.ObjectId.isValid(user2Id) ? new mongoose.Types.ObjectId(user2Id) : user2Id;
  
  // Find existing conversation
  let conversation = await this.findOne({
    participants: { $all: [user1, user2], $size: 2 },
  }).populate('participants', 'fullName email');

  if (!conversation) {
    // Create new conversation
    conversation = await this.create({
      participants: [user1, user2],
    });
    await conversation.populate('participants', 'fullName email');
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
