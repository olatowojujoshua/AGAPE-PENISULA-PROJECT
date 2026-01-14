const axios = require('axios');
const User = require('../models/User');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    this.baseURL = 'https://api.openai.com/v1';
  }

  async getAIResponse(message, userId) {
    try {
      // Get user context for personalized responses
      const user = await User.findById(userId);
      const counsellingType = user?.counsellingType || 'general';
      const userType = user?.userType || 'student';

      // Create system prompt based on counselling type
      const systemPrompt = this.getSystemPrompt(counsellingType, userType);

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
        }
      });

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      
      // Fallback responses
      if (counsellingType === 'biblical') {
        return "I understand you're seeking guidance. Remember that 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.' (Psalm 34:18). Would you like to share more about what's weighing on your heart today?";
      } else {
        return "I'm here to support you. It takes courage to reach out, and I'm glad you did. Could you tell me more about what you're experiencing so I can better understand how to help?";
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
      - Be respectful of the user's faith journey
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

  async getSentimentAnalysis(text) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'Analyze the sentiment of the following text and respond with only one word: positive, neutral, or negative.' 
          },
          { role: 'user', content: text }
        ],
        max_tokens: 10,
        temperature: 0
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content.toLowerCase().trim();

    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return 'neutral';
    }
  }

  async generateSessionSummary(messages) {
    try {
      const messageTexts = messages.map(msg => `${msg.sender}: ${msg.message}`).join('\n');

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'Summarize the following counselling session in 2-3 sentences, focusing on key themes, progress made, and any action items. Be compassionate and professional.' 
          },
          { role: 'user', content: messageTexts }
        ],
        max_tokens: 150,
        temperature: 0.5
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('Session Summary Error:', error);
      return 'Session completed successfully. User engaged in meaningful discussion about their concerns.';
    }
  }
}

module.exports = new AIService();
