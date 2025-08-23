const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add context if provided (FAQ or company data)
    if (context && context.length > 0) {
      const contextContent = context.map(item => 
        `${item.title || item.question}: ${item.content || item.answer}`
      ).join('\n\n');
      
      openaiMessages.push({
        role: 'system',
        content: `Here is relevant company information that may help answer the user's question:\n\n${contextContent}`,
      });
    }

    // Add conversation history
    messages.forEach(msg => {
      openaiMessages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    });

    const startTime = Date.now();

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const responseTime = Date.now() - startTime;

    return {
      content: completion.choices[0].message.content,
      metadata: {
        model: completion.model,
        tokens: completion.usage.total_tokens,
        responseTime,
      },
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key');
    } else if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.status === 500) {
      throw new Error('OpenAI API server error. Please try again later.');
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

    const conversationText = messages.map(msg => 
      `${msg.sender}: ${msg.content}`
    ).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Summarize the following customer support conversation in 1-2 sentences, focusing on the main issue and resolution.',
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return 'Conversation summary unavailable';
  }
};

// Extract keywords from text for better search
const extractKeywords = async (text) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Extract 3-5 relevant keywords from the following text. Return only the keywords separated by commas.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    return completion.choices[0].message.content
      .split(',')
      .map(keyword => keyword.trim().toLowerCase())
      .filter(keyword => keyword.length > 2);
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
};

// Check if OpenAI API is configured and working
const checkAPIHealth = async () => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        status: 'error',
        message: 'OpenAI API key not configured',
      };
    }

    // Make a simple API call to test connectivity
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    return {
      status: 'healthy',
      message: 'OpenAI API is working correctly',
      model: completion.model,
    };
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
