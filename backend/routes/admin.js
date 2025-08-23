const express = require('express');
const FAQ = require('../models/FAQ');
const CompanyData = require('../models/CompanyData');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadSingle, getFileInfo, deleteFile } = require('../middleware/upload');
const { processFile, extractMetadata } = require('../utils/fileProcessor');
const { checkAPIHealth } = require('../utils/geminiService');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalConversations,
      totalFAQs,
      totalCompanyData,
      recentConversations,
      popularFAQs,
    ] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      FAQ.countDocuments({ isActive: true }),
      CompanyData.countDocuments({ isActive: true }),
      Conversation.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'username email')
        .select('title sessionId status messageCount createdAt'),
      FAQ.getPopular(5),
    ]);

    // Get conversation stats by status
    const conversationStats = await Conversation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get user registration stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalConversations,
          totalFAQs,
          totalCompanyData,
          newUsers,
        },
        conversationStats: conversationStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        recentConversations,
        popularFAQs,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
    });
  }
});

// @route   POST /api/admin/faq
// @desc    Create a new FAQ
// @access  Admin
router.post('/faq', async (req, res) => {
  try {
    const { question, answer, category, tags, priority } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({
        success: false,
        message: 'Question, answer, and category are required',
      });
    }

    const faq = new FAQ({
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      tags: tags ? tags.map(tag => tag.trim().toLowerCase()) : [],
      priority: priority || 0,
      createdBy: req.user._id,
    });

    await faq.save();

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: { faq },
    });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ',
    });
  }
});

// @route   GET /api/admin/faqs
// @desc    Get all FAQs with pagination
// @access  Admin
router.get('/faqs', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, status = 'all' } = req.query;

    const query = {};
    if (category) query.category = new RegExp(category, 'i');
    if (status !== 'all') query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const faqs = await FAQ.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    const total = await FAQ.countDocuments(query);

    res.json({
      success: true,
      data: {
        faqs,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalFAQs: total,
      },
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FAQs',
    });
  }
});

// @route   PUT /api/admin/faq/:id
// @desc    Update an FAQ
// @access  Admin
router.put('/faq/:id', async (req, res) => {
  try {
    const faqId = req.params.id;
    const { question, answer, category, tags, priority, isActive } = req.body;

    const faq = await FAQ.findById(faqId);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    // Update fields
    if (question) faq.question = question.trim();
    if (answer) faq.answer = answer.trim();
    if (category) faq.category = category.trim();
    if (tags) faq.tags = tags.map(tag => tag.trim().toLowerCase());
    if (priority !== undefined) faq.priority = priority;
    if (isActive !== undefined) faq.isActive = isActive;
    faq.updatedBy = req.user._id;

    await faq.save();

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: { faq },
    });
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ',
    });
  }
});

// @route   DELETE /api/admin/faq/:id
// @desc    Delete an FAQ
// @access  Admin
router.delete('/faq/:id', async (req, res) => {
  try {
    const faqId = req.params.id;

    const faq = await FAQ.findById(faqId);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    await FAQ.findByIdAndDelete(faqId);

    res.json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ',
    });
  }
});

// @route   POST /api/admin/upload-company-data
// @desc    Upload company data file
// @access  Admin
router.post('/upload-company-data', uploadSingle('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { title, category, tags, priority } = req.body;

    if (!title || !category) {
      // Clean up uploaded file
      deleteFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Title and category are required',
      });
    }

    // Process the uploaded file
    const fileInfo = getFileInfo(req.file);
    const processResult = await processFile(req.file.path, req.file.mimetype);

    if (!processResult.success) {
      // Clean up uploaded file
      deleteFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: processResult.error,
      });
    }

    // Extract metadata
    const metadata = extractMetadata(processResult.content);

    // Create company data record
    const companyData = new CompanyData({
      title: title.trim(),
      content: processResult.content,
      category: category.trim(),
      tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [],
      priority: priority || 0,
      fileName: fileInfo.originalName,
      filePath: fileInfo.filePath,
      fileSize: fileInfo.size,
      mimeType: fileInfo.mimeType,
      createdBy: req.user._id,
    });

    await companyData.save();

    res.status(201).json({
      success: true,
      message: 'Company data uploaded successfully',
      data: {
        companyData,
        metadata,
        processResult: {
          wordCount: processResult.wordCount,
          charCount: processResult.charCount,
        },
      },
    });
  } catch (error) {
    console.error('Upload company data error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload company data',
    });
  }
});

// @route   GET /api/admin/company-data
// @desc    Get all company data with pagination
// @access  Admin
router.get('/company-data', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, type, status = 'all' } = req.query;

    const query = {};
    if (category) query.category = new RegExp(category, 'i');
    if (type) query.type = type;
    if (status !== 'all') query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const companyData = await CompanyData.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .select('-content'); // Exclude content for list view

    const total = await CompanyData.countDocuments(query);

    res.json({
      success: true,
      data: {
        companyData,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error('Get company data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company data',
    });
  }
});

// @route   GET /api/admin/company-data/:id
// @desc    Get specific company data by ID
// @access  Admin
router.get('/company-data/:id', async (req, res) => {
  try {
    const companyData = await CompanyData.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');

    if (!companyData) {
      return res.status(404).json({
        success: false,
        message: 'Company data not found',
      });
    }

    res.json({
      success: true,
      data: { companyData },
    });
  } catch (error) {
    console.error('Get company data by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company data',
    });
  }
});

// @route   PUT /api/admin/company-data/:id
// @desc    Update company data
// @access  Admin
router.put('/company-data/:id', async (req, res) => {
  try {
    const { title, content, category, tags, priority, isActive, type } = req.body;

    const companyData = await CompanyData.findById(req.params.id);

    if (!companyData) {
      return res.status(404).json({
        success: false,
        message: 'Company data not found',
      });
    }

    // Update fields
    if (title) companyData.title = title.trim();
    if (content) companyData.content = content.trim();
    if (category) companyData.category = category.trim();
    if (type) companyData.type = type;
    if (tags) companyData.tags = tags.map(tag => tag.trim().toLowerCase());
    if (priority !== undefined) companyData.priority = priority;
    if (isActive !== undefined) companyData.isActive = isActive;
    companyData.updatedBy = req.user._id;

    await companyData.save();

    res.json({
      success: true,
      message: 'Company data updated successfully',
      data: { companyData },
    });
  } catch (error) {
    console.error('Update company data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company data',
    });
  }
});

// @route   DELETE /api/admin/company-data/:id
// @desc    Delete company data
// @access  Admin
router.delete('/company-data/:id', async (req, res) => {
  try {
    const companyData = await CompanyData.findById(req.params.id);

    if (!companyData) {
      return res.status(404).json({
        success: false,
        message: 'Company data not found',
      });
    }

    // Delete associated file if exists
    if (companyData.filePath) {
      deleteFile(companyData.filePath);
    }

    await CompanyData.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Company data deleted successfully',
    });
  } catch (error) {
    console.error('Delete company data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company data',
    });
  }
});

// @route   GET /api/admin/conversations
// @desc    Get all conversations with pagination
// @access  Admin
router.get('/conversations', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sessionId: { $regex: search, $options: 'i' } },
      ];
    }

    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username email')
      .lean(); // Use lean() for better performance

    // Add message count and format data
    const formattedConversations = conversations.map(conv => ({
      ...conv,
      messageCount: conv.messages ? conv.messages.length : 0,
      title: conv.title || (conv.messages && conv.messages.length > 0 ? 
        conv.messages.find(msg => msg.sender === 'user')?.content?.substring(0, 50) + '...' : 
        'New Conversation')
    }));

    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations: formattedConversations,
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

// @route   GET /api/admin/conversation/:id
// @desc    Get specific conversation details
// @access  Admin
router.get('/conversation/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('userId', 'username email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation',
    });
  }
});

// @route   DELETE /api/admin/conversation/:id
// @desc    Delete conversation
// @access  Admin
router.delete('/conversation/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    await Conversation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status = 'all' } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status !== 'all') query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
    });
  }
});

// @route   PUT /api/admin/user/:id
// @desc    Update user
// @access  Admin
router.put('/user/:id', async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        email, 
        role, 
        isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
});

// @route   DELETE /api/admin/user/:id
// @desc    Delete user
// @access  Admin
router.delete('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user',
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

// @route   POST /api/admin/user
// @desc    Create new user
// @access  Admin
router.post('/user', async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username or email already exists',
      });
    }

    const user = new User({
      username,
      email,
      password: 'defaultPassword123', // Should be changed on first login
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true,
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: { user: userResponse },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
});

// @route   GET /api/admin/system/health
// @desc    Get system health status
// @access  Admin
router.get('/system/health', async (req, res) => {
  try {
    const [dbStatus, aiStatus] = await Promise.all([
      // Check database connection
      new Promise((resolve) => {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          resolve({ status: 'healthy', message: 'Database connected' });
        } else {
          resolve({ status: 'error', message: 'Database disconnected' });
        }
      }),
      // Check AI service
      checkAPIHealth(),
    ]);

    res.json({
      success: true,
      data: {
        database: dbStatus,
        aiService: aiStatus,
        server: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
        },
      },
    });
  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check system health',
    });
  }
});

module.exports = router;
