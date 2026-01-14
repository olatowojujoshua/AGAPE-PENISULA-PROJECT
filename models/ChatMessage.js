const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  metadata: {
    wordCount: Number,
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    topics: [String]
  },
  isRead: {
    type: Boolean,
    default: true
  },
  reactions: [{
    type: {
      type: String,
      enum: ['helpful', 'insightful', 'confusing']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better performance
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ sender: 1 });

// Pre-save middleware to calculate word count
chatMessageSchema.pre('save', function(next) {
  if (this.isModified('message') && this.message) {
    this.metadata = this.metadata || {};
    this.metadata.wordCount = this.message.split(/\s+/).length;
  }
  next();
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
