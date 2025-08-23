const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful customer support assistant. Your role is to:

1. Provide accurate and helpful information to customers
2. Be polite, professional, and empathetic
3. Ask clarifying questions when needed
4. Escalate complex issues to human agents when appropriate
5. Use the provided company information and FAQs to answer questions
6. Keep responses concise but comprehensive
7. Always maintain a friendly and supportive tone

If you don't know the answer to a question, be honest about it and suggest alternative ways to help the customer.`;

// Generate AI response
const generateResponse = async (messages, context = null) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prepare the conversation context
    let conversationContext = SYSTEM_PROMPT + '\n\n';

    // Add context if provided (FAQ or company data)
    if (context && context.length > 0) {
      const contextContent = context.map(item => 
        `${item.title || item.question}: ${item.content || item.answer}`
      ).join('\n\n');
      
      conversationContext += `Here is relevant company information that may help answer the user's question:\n\n${contextContent}\n\n`;
    }

    // Add conversation history
    conversationContext += 'Conversation History:\n';
    messages.forEach(msg => {
      conversationContext += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.sender !== 'user') {
      throw new Error('No user message found');
    }

    const prompt = `${conversationContext}\n\nPlease respond to the user's latest message: "${latestMessage.content}"`;

    const startTime = Date.now();

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const responseTime = Date.now() - startTime;

    return {
      content: text,
      metadata: {
        model: 'gemini-1.5-flash',
        tokens: response.usageMetadata?.totalTokenCount || 0,
        responseTime,
      },
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Handle specific Gemini errors
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key');
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    } else if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
      throw new Error('Gemini API rate limit exceeded. Please try again later.');
    }
    
    throw new Error('Failed to generate AI response');
  }
};

// Generate a summary of the conversation
const generateConversationSummary = async (messages) => {
  try {
    if (messages.length === 0) {
      return 'Empty conversation';
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const conversationText = messages.map(msg => 
      `${msg.sender}: ${msg.content}`
    ).join('\n');

    const prompt = `Summarize the following customer support conversation in 1-2 sentences, focusing on the main issue and resolution:\n\n${conversationText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return 'Conversation summary unavailable';
  }
};

// Extract keywords from text for better search
const extractKeywords = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Extract 3-5 relevant keywords from the following text. Return only the keywords separated by commas:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const keywords = response.text();

    return keywords
      .split(',')
      .map(keyword => keyword.trim().toLowerCase())
      .filter(keyword => keyword.length > 2);
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
};

// Check if Gemini API is configured and working
const checkAPIHealth = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        status: 'error',
        message: 'Gemini API key not configured',
      };
    }

    // Make a simple API call to test connectivity
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    
    if (response.text()) {
      return {
        status: 'healthy',
        message: 'Gemini API is working correctly',
        model: 'gemini-1.5-flash',
      };
    } else {
      throw new Error('No response from Gemini API');
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
};

module.exports = {
  generateResponse,
  generateConversationSummary,
  extractKeywords,
  checkAPIHealth,
};
