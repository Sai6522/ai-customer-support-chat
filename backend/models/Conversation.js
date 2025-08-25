const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'bot'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    responseTime: Number, // Time taken to generate response (for bot messages)
    model: String, // AI model used (for bot messages)
    tokens: Number, // Token count (for bot messages)
  },
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow anonymous conversations
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps before saving
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update lastMessageAt if messages were added
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }
  
  // Auto-generate title from first user message if not set
  if (this.title === 'New Conversation' && this.messages.length > 0) {
    const firstUserMessage = this.messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      this.title = firstUserMessage.content.substring(0, 50) + 
                   (firstUserMessage.content.length > 50 ? '...' : '');
    }
  }
  
  next();
});

// Index for efficient queries
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ sessionId: 1 });
conversationSchema.index({ status: 1, lastMessageAt: -1 });

// Static method to find conversations by user
conversationSchema.statics.findByUser = function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Static method to find active conversations
conversationSchema.statics.findActive = function() {
  return this.find({ status: 'active' })
    .sort({ lastMessageAt: -1 });
};

// Instance method to add message
conversationSchema.methods.addMessage = function(content, sender, metadata = {}) {
  this.messages.push({
    content,
    sender,
    metadata,
    timestamp: new Date(),
  });
  return this.save();
};

// Instance method to close conversation
conversationSchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

// Virtual for message count
conversationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for duration
conversationSchema.virtual('duration').get(function() {
  if (this.messages.length < 2) return 0;
  const firstMessage = this.messages[0];
  const lastMessage = this.messages[this.messages.length - 1];
  return lastMessage.timestamp - firstMessage.timestamp;
});

module.exports = mongoose.model('Conversation', conversationSchema);
