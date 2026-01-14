const express = require('express');
const { protect, checkSubscription } = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const { getAIResponse, generateSessionSummary } = require('../services/aiService');

const router = express.Router();

// Create new chat session
router.post('/sessions', protect, checkSubscription, async (req, res) => {
  try {
    const { title, counsellingType } = req.body;

    const session = new ChatSession({
      userId: req.user._id,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || 'New Counselling Session',
      counsellingType: counsellingType || req.user.counsellingType
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      data: { session }
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating session'
    });
  }
});

// Get user's chat sessions
router.get('/sessions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await ChatSession.find({ 
      userId: req.user._id,
      isArchived: false 
    })
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await ChatSession.countDocuments({ 
      userId: req.user._id,
      isArchived: false 
    });

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching sessions'
    });
  }
});

// Get specific chat session with messages
router.get('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ 
      sessionId, 
      userId: req.user._id 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const messages = await ChatMessage.find({ 
      sessionId: session._id 
    })
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        session,
        messages
      }
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching session'
    });
  }
});

// Send message and get AI response
router.post('/sessions/:sessionId/message', protect, checkSubscription, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    // Find session
    const session = await ChatSession.findOne({ 
      sessionId, 
      userId: req.user._id 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Save user message
    const userMessage = new ChatMessage({
      userId: req.user._id,
      sessionId: session._id,
      message,
      sender: 'user'
    });
    await userMessage.save();

    // Get AI response
    const aiResponse = await getAIResponse(message, req.user._id);

    // Save AI response
    const aiMessage = new ChatMessage({
      userId: req.user._id,
      sessionId: session._id,
      message: aiResponse,
      sender: 'ai'
    });
    await aiMessage.save();

    // Update session last message time
    session.lastMessageAt = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        userMessage,
        aiMessage
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending message'
    });
  }
});

// End session and generate summary
router.post('/sessions/:sessionId/end', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ 
      sessionId, 
      userId: req.user._id 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get all messages in session
    const messages = await ChatMessage.find({ 
      sessionId: session._id 
    }).sort({ createdAt: 1 });

    // Generate AI summary
    const summary = await generateSessionSummary(messages);

    // Update session
    session.status = 'completed';
    session.summary = summary;
    await session.save();

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: {
        summary
      }
    });

  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error ending session'
    });
  }
});

// Archive session
router.delete('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ 
      sessionId, 
      userId: req.user._id 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.isArchived = true;
    await session.save();

    res.json({
      success: true,
      message: 'Session archived successfully'
    });

  } catch (error) {
    console.error('Archive session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error archiving session'
    });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reaction', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type } = req.body;

    if (!['helpful', 'insightful', 'confusing'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      r => r.userId.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.type = type;
      existingReaction.timestamp = new Date();
    } else {
      // Add new reaction
      message.reactions.push({
        type,
        userId: req.user._id,
        timestamp: new Date()
      });
    }

    await message.save();

    res.json({
      success: true,
      message: 'Reaction added successfully'
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding reaction'
    });
  }
});

module.exports = router;
