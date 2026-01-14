const axios = require('axios');
const User = require('../models/User');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    this.baseURL = 'https://api.openai.com/v1';
    
    // Validate API key
    if (!this.apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
      console.log('Please add your OpenAI API key to .env file');
    }
  }

  async getAIResponse(message, userId) {
    try {
      // Check if API key is available
      if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
        return this.getFallbackResponse(userId, 'api-key-missing');
      }

      // Get user context for personalized responses
      const user = await User.findById(userId);
      const counsellingType = user?.counsellingType || 'general';
      const userType = user?.userType || 'student';

      // Create system prompt based on counselling type
      const systemPrompt = this.getSystemPrompt(counsellingType, userType);

      console.log(`🤖 Sending request to OpenAI for user ${userId}`);

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log(`✅ Received OpenAI response for user ${userId}`);
      
      return aiResponse;

    } catch (error) {
      console.error('❌ OpenAI API Error:', error.response?.data || error.message);
      
      // Handle specific OpenAI errors
      if (error.response?.status === 401) {
        return this.getFallbackResponse(userId, 'invalid-api-key');
      } else if (error.response?.status === 429) {
        return this.getFallbackResponse(userId, 'rate-limit');
      } else if (error.response?.status === 402) {
        return this.getFallbackResponse(userId, 'insufficient-credits');
      } else {
        return this.getFallbackResponse(userId, 'general-error');
      }
    }
  }

  getSystemPrompt(counsellingType, userType) {
    const basePrompt = `You are a compassionate and professional AI counsellor for Agape Peninsula Counselling. You provide support for mental health and emotional wellbeing.`;

    if (counsellingType === 'biblical') {
      return `${basePrompt} 

      SPECIALIZATION: Biblical & Christian Counselling
      - Incorporate scripture and biblical wisdom when appropriate
      - Provide faith-based guidance and encouragement
      - Reference Christian values and principles
      - Be respectful of user's faith journey
      - Use biblical references naturally, not forced
      - Focus on hope, forgiveness, and spiritual growth
      
      USER TYPE: ${userType === 'student' ? 'Student (likely dealing with academic stress, life transitions)' : 'Professional (likely dealing with career stress, work-life balance)'}
      
      GUIDELINES:
      - Always maintain professional boundaries
      - Encourage prayer and scripture reading
      - Suggest connecting with a church community
      - Provide practical advice alongside spiritual guidance
      - Be warm, empathetic, and encouraging
      - Never give medical advice - always suggest professional help when needed`;
    } else {
      return `${basePrompt}

      SPECIALIZATION: General Mental Health Counselling
      - Use evidence-based therapeutic approaches
      - Provide practical coping strategies
      - Focus on emotional regulation and stress management
      - Be inclusive and respectful of all backgrounds
      - Use CBT and mindfulness techniques
      - Emphasize self-care and healthy boundaries
      
      USER TYPE: ${userType === 'student' ? 'Student (likely dealing with academic stress, life transitions)' : 'Professional (likely dealing with career stress, work-life balance)'}
      
      GUIDELINES:
      - Always maintain professional boundaries
      - Use active listening and validation
      - Provide evidence-based strategies
      - Encourage healthy coping mechanisms
      - Be warm, empathetic, and non-judgmental
      - Never give medical advice - always suggest professional help when needed`;
    }
  }

  getFallbackResponse(userId, errorType) {
    const user = User.findById(userId);
    const counsellingType = user?.counsellingType || 'general';

    const fallbackResponses = {
      'api-key-missing': counsellingType === 'biblical' 
        ? "I'm here to support you on your journey. 'Trust in the Lord with all your heart and lean not on your own understanding.' (Proverbs 3:5). Please note: To provide you with the best AI-powered guidance, we need to configure our OpenAI connection. In the meantime, how can I support you with prayer and encouragement?"
        : "I'm here to support you through this conversation. Please note: To provide you with the best AI-powered guidance, we need to configure our OpenAI connection. In the meantime, I'm here to listen and provide general support. What would you like to share today?",
      
      'invalid-api-key': counsellingType === 'biblical'
        ? "I'm having trouble connecting to my AI guidance system right now. Let's rely on faith and wisdom. 'The Lord is my strength and my shield; my heart trusts in him.' (Psalm 28:7). Please share what's on your heart, and I'll do my best to support you."
        : "I'm experiencing technical difficulties with my AI connection right now. However, I'm still here to listen and provide support. Please share what's on your mind, and I'll do my best to help you work through it.",
      
      'rate-limit': counsellingType === 'biblical'
        ? "Many people are seeking guidance right now - that's wonderful! 'Be still, and know that I am God.' (Psalm 46:10). Let's take a moment to breathe. What's one thing you'd like to focus on in this moment?"
        : "I'm experiencing high demand right now, but you're important to me. Let's take a mindful moment together. Take a deep breath... What's one thing that's been on your mind lately?",
      
      'insufficient-credits': counsellingType === 'biblical'
        ? "I need to take a brief moment to reset. 'Cast all your anxiety on him because he cares for you.' (1 Peter 5:7). While I reconnect, what's one area where you'd like to experience God's peace?"
        : "I need to take a brief moment to reset. While I reconnect, let's focus on something positive. What's one small thing that brought you comfort or joy recently?",
      
      'general-error': counsellingType === 'biblical'
        ? "I'm experiencing a temporary connection issue. 'God is our refuge and strength, an ever-present help in trouble.' (Psalm 46:1). I'm still here with you. What would you like to share while I reconnect?"
        : "I'm experiencing a temporary connection issue, but I'm still here with you. Sometimes technology has its moments, just like we do. What would you like to share while I reconnect?"
    };

    return fallbackResponses[errorType] || fallbackResponses['general-error'];
  }

  async getSentimentAnalysis(text) {
    try {
      if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
        return 'neutral';
      }

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'Analyze sentiment of following text and respond with only one word: positive, neutral, or negative.' 
          },
          { role: 'user', content: text }
        ],
        max_tokens: 10,
        temperature: 0
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      return response.data.choices[0].message.content.toLowerCase().trim();

    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return 'neutral';
    }
  }

  async generateSessionSummary(messages) {
    try {
      if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
        return 'Session completed successfully. User engaged in meaningful discussion about their concerns.';
      }

      const messageTexts = messages.map(msg => `${msg.sender}: ${msg.message}`).join('\n');

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'Summarize following counselling session in 2-3 sentences, focusing on key themes, progress made, and any action items. Be compassionate and professional.' 
          },
          { role: 'user', content: messageTexts }
        ],
        max_tokens: 150,
        temperature: 0.5
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('Session Summary Error:', error);
      return 'Session completed successfully. User engaged in meaningful discussion about their concerns.';
    }
  }

  // Test OpenAI connection
  async testConnection() {
    try {
      if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
        return { success: false, error: 'API key not configured' };
      }

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          { role: 'user', content: 'Hello, can you respond with just "OK"?' }
        ],
        max_tokens: 10,
        temperature: 0
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return { success: true, message: 'OpenAI connection working' };

    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }
}

module.exports = new AIService();
