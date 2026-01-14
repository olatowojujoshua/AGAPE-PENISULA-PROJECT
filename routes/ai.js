const express = require('express');
const { getAIResponse, testConnection } = require('../services/aiService');

const router = express.Router();

// Test OpenAI connection
router.get('/test-connection', async (req, res) => {
    try {
        const result = await testConnection();
        res.json({
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test OpenAI connection',
            error: error.message
        });
    }
});

// Simple chat endpoint for testing
router.post('/test-chat', async (req, res) => {
    try {
        const { message, userId = 'test-user' } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const aiResponse = await getAIResponse(message, userId);

        res.json({
            success: true,
            data: {
                userMessage: message,
                aiResponse: aiResponse,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Test chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get AI response',
            error: error.message
        });
    }
});

// Get AI service status
router.get('/status', (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.AI_MODEL || 'gpt-3.5-turbo';

    res.json({
        success: true,
        data: {
            apiKeyConfigured: !!apiKey && apiKey !== 'your-openai-api-key',
            apiKeyLength: apiKey ? apiKey.length : 0,
            model: model,
            service: 'OpenAI ChatGPT',
            status: apiKey && apiKey !== 'your-openai-api-key' ? 'ready' : 'needs-configuration'
        }
    });
});

module.exports = router;
