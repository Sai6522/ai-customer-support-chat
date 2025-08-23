/**
 * AI Customer Support Chat Platform - Backend Server
 * 
 * Main server file that initializes the Express application,
 * connects to MongoDB, and sets up all middleware and routes.
 * 
 * Features:
 * - JWT-based authentication
 * - Google Gemini AI integration
 * - File upload and processing
 * - Real-time chat functionality
 * - Admin dashboard APIs
 * - Security middleware (helmet, rate limiting)
 * 
 * @author Sai6522
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database connection and routes
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express application
const app = express();

// Connect to MongoDB database
connectDB();

/**
 * Security Middleware Configuration
 */

// Helmet - sets various HTTP headers for security
app.use(helmet());

/**
 * Rate Limiting Configuration
 * Prevents abuse by limiting the number of requests per IP address
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

/**
 * CORS Configuration
 * Allows frontend application to communicate with backend
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

/**
 * Body Parsing Middleware
 * Parses incoming request bodies in JSON and URL-encoded formats
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Logging Middleware
 * Logs HTTP requests in development mode for debugging
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * Static File Serving
 * Serves uploaded files from the uploads directory
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Health Check Endpoint
 * Simple endpoint to verify server status and connectivity
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AI Customer Support Chat API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes Configuration
 * 
 * /api/auth  - Authentication and user management routes
 * /api/chat  - Chat functionality and AI response routes  
 * /api/admin - Admin dashboard and management routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

/**
 * 404 Handler
 * Handles requests to non-existent API endpoints
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

/**
 * Error Handling Middleware
 * Centralized error handling for all routes
 * Must be the last middleware in the chain
 */
app.use(errorHandler);

/**
 * Server Startup
 * Starts the Express server on the specified port
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
});

// Export the app for testing purposes
module.exports = app;
