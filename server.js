const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agape-peninsula', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  socket.on('join-chat', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined chat room`);
  });

  socket.on('send-message', async (data) => {
    const { userId, message, sessionId } = data;
    
    try {
      // Save message to database
      const ChatMessage = require('./models/ChatMessage');
      const chatMessage = new ChatMessage({
        userId,
        sessionId,
        message,
        sender: 'user',
        timestamp: new Date()
      });
      await chatMessage.save();

      // Get AI response
      const { getAIResponse } = require('./services/aiService');
      const aiResponse = await getAIResponse(message, userId);

      // Save AI response to database
      const aiMessage = new ChatMessage({
        userId,
        sessionId,
        message: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      });
      await aiMessage.save();

      // Send AI response back to user
      io.to(userId).emit('ai-response', {
        message: aiResponse,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Chat error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: '✅ Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8000'}`);
});
