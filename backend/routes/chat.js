const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const FAQ = require('../models/FAQ');
const CompanyData = require('../models/CompanyData');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { generateResponse, generateConversationSummary, isCompanyDataQuery } = require('../utils/geminiService');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// @route   POST /api/chat/message
// @desc    Send a message and get AI response
// @access  Private/Public (with optional auth)
router.post('/message', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      conversation = new Conversation({
        userId: userId,
        sessionId: sessionId,
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
    });

    // Search for relevant context (FAQ and company data)
    const [faqs, companyData] = await Promise.all([
      FAQ.search(message, 3),
      CompanyData.search(message, 3),
    ]);

    // Create context with priority information
    const contextItems = [
      ...faqs.map(faq => ({ 
        title: faq.question, 
        content: faq.answer, 
        priority: faq.priority,
        source: 'FAQ'
      })),
      ...companyData.map(data => ({ 
        title: data.title, 
        content: data.content, 
        priority: data.priority,
        source: 'CompanyData'
      })),
    ];

    // Sort context by priority (highest first) and take top items
    const sortedContext = contextItems
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6); // Limit to top 6 items

    // Convert back to the format expected by AI
    const context = sortedContext.map(item => ({
      title: item.title,
      content: item.content
    }));

    // Debug logging
    console.log('🔍 DEBUG: Search query:', message);
    console.log('🔍 DEBUG: FAQs found:', faqs.length);
    console.log('🔍 DEBUG: Company data found:', companyData.length);
    console.log('🔍 DEBUG: Context items before sorting:', contextItems.length);
    console.log('🔍 DEBUG: Context items after sorting:', sortedContext.length);
    console.log('🔍 DEBUG: Final context sent to AI:');
    context.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title}: ${item.content ? item.content.substring(0, 100) + '...' : 'No content'}`);
    });

    // Check if this is a company-related query for enhanced response
    const isCompanyQuery = isCompanyDataQuery(message);

    // Generate AI response with enhanced context for company queries
    const aiResponse = await generateResponse(conversation.messages, context, isCompanyQuery);

    // Add bot message
    conversation.messages.push({
      content: aiResponse.content,
      sender: 'bot',
      timestamp: new Date(),
      metadata: aiResponse.metadata,
    });

    // Save conversation
    await conversation.save();

    // Increment access count for used FAQs and company data
    await Promise.all([
      ...faqs.map(faq => faq.incrementView()),
      ...companyData.map(data => data.incrementAccess()),
    ]);

    res.json({
      success: true,
      data: {
        message: aiResponse.content,
        sessionId: sessionId,
        conversationId: conversation._id,
        metadata: aiResponse.metadata,
        contextUsed: context.length > 0,
      },
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message,
    });
  }
});

// @route   GET /api/chat/history/:sessionId
// @desc    Get chat history for a session
// @access  Private/Public (with optional auth)
router.get('/history/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return res.json({
        success: true,
        data: {
          messages: [],
          sessionId,
          conversationId: null,
        },
      });
    }

    // Paginate messages
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const messages = conversation.messages.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        messages,
        sessionId,
        conversationId: conversation._id,
        totalMessages: conversation.messages.length,
        currentPage: parseInt(page),
        totalPages: Math.ceil(conversation.messages.length / limit),
      },
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
    });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, page = 1, status = 'all' } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (status !== 'all') {
      query.status = status;
    }

    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId title status messageCount lastMessageAt createdAt');

    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalConversations: total,
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
    });
  }
});

// @route   PUT /api/chat/conversation/:id/close
// @desc    Close a conversation
// @access  Private
router.put('/conversation/:id/close', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    await conversation.close();

    res.json({
      success: true,
      message: 'Conversation closed successfully',
      data: {
        conversationId: conversation._id,
        status: conversation.status,
      },
    });
  } catch (error) {
    console.error('Close conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close conversation',
    });
  }
});

// @route   POST /api/chat/conversation/:id/rating
// @desc    Rate a conversation
// @access  Private
router.post('/conversation/:id/rating', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    conversation.rating = rating;
    if (feedback) {
      conversation.feedback = feedback.trim();
    }

    await conversation.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        conversationId: conversation._id,
        rating: conversation.rating,
        feedback: conversation.feedback,
      },
    });
  } catch (error) {
    console.error('Rate conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
    });
  }
});

// @route   GET /api/chat/download/:sessionId
// @desc    Download chat history as text file
// @access  Private/Public (with optional auth)
router.get('/download/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = 'txt' } = req.query;

    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    let content = '';
    let filename = '';
    let contentType = '';

    if (format === 'txt') {
      // Generate text format
      content = `Chat Conversation - ${conversation.title}\n`;
      content += `Session ID: ${sessionId}\n`;
      content += `Date: ${conversation.createdAt.toLocaleString()}\n`;
      content += `Messages: ${conversation.messages.length}\n`;
      content += '\n' + '='.repeat(50) + '\n\n';

      conversation.messages.forEach((msg, index) => {
        const timestamp = msg.timestamp.toLocaleString();
        const sender = msg.sender === 'user' ? 'You' : 'Support Agent';
        content += `[${timestamp}] ${sender}:\n${msg.content}\n\n`;
      });

      filename = `chat-${sessionId}-${Date.now()}.txt`;
      contentType = 'text/plain';
    } else if (format === 'json') {
      // Generate JSON format
      const exportData = {
        sessionId,
        title: conversation.title,
        createdAt: conversation.createdAt,
        messages: conversation.messages.map(msg => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
        })),
        messageCount: conversation.messages.length,
        exportedAt: new Date(),
      };

      content = JSON.stringify(exportData, null, 2);
      filename = `chat-${sessionId}-${Date.now()}.json`;
      contentType = 'application/json';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported format. Use txt or json.',
      });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    console.error('Download chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download chat history',
    });
  }
});

// @route   GET /api/chat/stats
// @desc    Get chat statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalConversations,
      activeConversations,
      totalMessages,
      avgRating,
    ] = await Promise.all([
      Conversation.countDocuments({ userId }),
      Conversation.countDocuments({ userId, status: 'active' }),
      Conversation.aggregate([
        { $match: { userId } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } },
      ]),
      Conversation.aggregate([
        { $match: { userId, rating: { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalConversations,
        activeConversations,
        totalMessages: totalMessages[0]?.total || 0,
        averageRating: avgRating[0]?.avgRating || 0,
      },
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat statistics',
    });
  }
});

// @route   POST /api/chat/session
// @desc    Create a new chat session
// @access  Public
router.post('/session', (req, res) => {
  try {
    const sessionId = uuidv4();
    
    res.json({
      success: true,
      data: {
        sessionId,
        message: 'New chat session created',
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
    });
  }
});

// Import chat download utilities
const { generateChatTXT, generateChatHTML } = require('../utils/chatDownload');

// @route   GET /api/chat/download/:sessionId/txt
// @desc    Download chat history as TXT file
// @access  Private
router.get('/download/:sessionId/txt', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({
      sessionId,
      userId: req.user._id,
    }).populate('userId', 'username email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    const txtContent = generateChatTXT(conversation, req.user);
    const fileName = `chat_${sessionId}_${Date.now()}.txt`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', Buffer.byteLength(txtContent, 'utf8'));

    res.send(txtContent);
  } catch (error) {
    console.error('Download chat TXT error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download chat as TXT',
    });
  }
});

// @route   GET /api/chat/download/:sessionId/html
// @desc    Get chat history as HTML for PDF conversion
// @access  Private
router.get('/download/:sessionId/html', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({
      sessionId,
      userId: req.user._id,
    }).populate('userId', 'username email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    const htmlContent = generateChatHTML(conversation, req.user);

    res.json({
      success: true,
      data: {
        htmlContent,
        fileName: `chat_${sessionId}_${Date.now()}.pdf`,
        title: conversation.title,
      },
    });
  } catch (error) {
    console.error('Get chat HTML error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat HTML',
    });
  }
});

// @route   GET /api/chat/sessions
// @desc    Get all chat sessions for the user
// @access  Private
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      userId: req.user._id,
    })
      .sort({ lastMessageAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId title status lastMessageAt createdAt')
      .lean();

    // Add message count
    const conversationsWithCount = conversations.map(conv => ({
      ...conv,
      messageCount: conv.messages ? conv.messages.length : 0,
    }));

    const total = await Conversation.countDocuments({
      userId: req.user._id,
    });

    res.json({
      success: true,
      data: {
        conversations: conversationsWithCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalConversations: total,
      },
    });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat sessions',
    });
  }
});

module.exports = router;
