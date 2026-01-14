const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'New Counselling Session'
  },
  counsellingType: {
    type: String,
    enum: ['biblical', 'general'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  summary: String,
  goals: [String],
  moodTracking: [{
    date: Date,
    mood: {
      type: String,
      enum: ['very-bad', 'bad', 'neutral', 'good', 'very-good']
    },
    notes: String
  }],
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false
  },
  lastMessageAt: Date
}, {
  timestamps: true
});

// Index for better performance
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
