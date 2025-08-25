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

// Enhanced function to detect company-related queries
const isCompanyDataQuery = (message) => {
  const companyKeywords = [
    'company', 'location', 'address', 'office', 'headquarters', 'branch',
    'data management', 'policy', 'procedure', 'privacy', 'terms',
    'about us', 'contact', 'phone', 'email', 'support',
    'business hours', 'working hours', 'schedule',
    'services', 'products', 'offerings',
    'team', 'staff', 'employees', 'management',
    'history', 'founded', 'established',
    'mission', 'vision', 'values',
    'security', 'compliance', 'certification',
    'billing', 'payment', 'pricing', 'subscription',
    'documentation', 'guide', 'manual', 'help'
  ];
  
  const messageLower = message.toLowerCase();
  return companyKeywords.some(keyword => messageLower.includes(keyword));
};

// Enhanced function to get comprehensive company data
const getCompanyDataContext = async (message) => {
  try {
    const FAQ = require('../models/FAQ');
    const CompanyData = require('../models/CompanyData');
    const User = require('../models/User');
    const Conversation = require('../models/Conversation');

    // Get all relevant company information
    const [faqs, companyData, userStats, conversationStats] = await Promise.all([
      FAQ.find({ isActive: true }).sort({ priority: -1, accessCount: -1 }).limit(10),
      CompanyData.find({ isActive: true }).sort({ priority: -1, accessCount: -1 }).limit(10),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
            regularUsers: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } }
          }
        }
      ]),
      Conversation.aggregate([
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            totalMessages: { $sum: { $size: '$messages' } },
            avgRating: { $avg: '$rating' }
          }
        }
      ])
    ]);

    // Build comprehensive context
    let context = [];

    // Add company information
    context.push({
      title: 'Company Information',
      content: `
Company Name: AI Customer Support Platform
Type: AI-Powered Customer Support Solution
Services: 24/7 AI Chat Support, Document Management, FAQ System, User Management
Technology: React, Node.js, MongoDB, Google Gemini AI
Support: Available 24/7 through this chat interface
Contact: support@company.com | 1-800-SUPPORT
Business Hours: Live agents available Monday-Friday 9 AM - 6 PM EST
Security: Enterprise-grade encryption, GDPR compliant, SOC 2 certified
      `
    });

    // Add system statistics
    const stats = {
      users: userStats[0] || { totalUsers: 0, adminUsers: 0, regularUsers: 0 },
      conversations: conversationStats[0] || { totalConversations: 0, totalMessages: 0, avgRating: 0 }
    };

    context.push({
      title: 'System Statistics',
      content: `
Total Users: ${stats.users.totalUsers}
Admin Users: ${stats.users.adminUsers}
Regular Users: ${stats.users.regularUsers}
Total Conversations: ${stats.conversations.totalConversations}
Total Messages: ${stats.conversations.totalMessages}
Average Rating: ${stats.conversations.avgRating ? stats.conversations.avgRating.toFixed(2) : 'N/A'}
      `
    });

    // Add FAQs
    faqs.forEach(faq => {
      context.push({
        title: `FAQ: ${faq.question}`,
        content: faq.answer
      });
    });

    // Add company documents
    companyData.forEach(data => {
      context.push({
        title: data.title,
        content: data.content
      });
    });

    return context;
  } catch (error) {
    console.error('Error getting company data context:', error);
    return [];
  }
};

// Generate AI response
const generateResponse = async (messages, context = null, isEnhanced = false) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.sender !== 'user') {
      throw new Error('No user message found');
    }

    // Prepare the conversation context
    let conversationContext = SYSTEM_PROMPT + '\n\n';

    // PRIORITY 1: Use the specific context passed from chat route (this contains sorted FAQs/company data)
    if (context && context.length > 0) {
      console.log('🔍 DEBUG: Using priority context from chat route:', context.length, 'items');
      const contextContent = context.map((item, index) => 
        `${index + 1}. ${item.title}: ${item.content}`
      ).join('\n\n');
      
      conversationContext += `CRITICAL INSTRUCTIONS: You MUST use the information below in the EXACT ORDER provided. The information is sorted by priority - ALWAYS use the FIRST item that answers the user's question. DO NOT combine or mix information from multiple sources.\n\n`;
      conversationContext += `PRIORITY-ORDERED INFORMATION:\n${contextContent}\n\n`;
      conversationContext += `STRICT RULE: If the user asks about something mentioned in item #1, use ONLY item #1. Ignore all other items. If item #1 doesn't answer the question, then check item #2, and so on.\n\n`;
      conversationContext += `EXAMPLE: If user asks "Who is the CEO?" and item #1 mentions a CEO, use ONLY that information. Do not look at other items.\n\n`;
    }
    // PRIORITY 2: If no specific context, use enhanced company context
    else if (isCompanyDataQuery(latestMessage.content) || isEnhanced) {
      console.log('🔍 DEBUG: Using enhanced company context');
      const companyContext = await getCompanyDataContext(latestMessage.content);
      if (companyContext.length > 0) {
        const contextContent = companyContext.map(item => 
          `${item.title || item.question}: ${item.content || item.answer}`
        ).join('\n\n');
        
        conversationContext += `Here is company information that may help answer the user's question:\n\n${contextContent}\n\n`;
      }
    }

    // Add conversation history
    conversationContext += 'Conversation History:\n';
    messages.forEach(msg => {
      conversationContext += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });

    const prompt = `${conversationContext}\n\nPlease respond to the user's latest message: "${latestMessage.content}"\n\nRemember: If specific information was provided above, use ONLY that information. Do not supplement with general knowledge.`;

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
        contextUsed: context ? context.length : 0,
        isCompanyQuery: isCompanyDataQuery(latestMessage.content) || isEnhanced,
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
  isCompanyDataQuery,
  getCompanyDataContext,
};
