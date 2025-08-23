# 🤖 AI Customer Support Chat Platform

A comprehensive, full-stack AI-powered customer support chat application built with React, Node.js, MongoDB, and Google Gemini AI.

![AI Customer Support Chat](https://img.shields.io/badge/AI-Customer%20Support-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248)
![Google Gemini](https://img.shields.io/badge/Google-Gemini%20AI-4285F4)

## 🌟 Features

### 🎯 **Core Functionality**
- **AI-Powered Chat**: Intelligent responses using Google Gemini 1.5 Flash
- **Real-time Conversations**: Instant messaging with typing indicators
- **User Authentication**: Secure JWT-based authentication system
- **Session Management**: Persistent chat sessions with history
- **Multi-format Export**: Download chats as TXT or PDF files

### 🛠️ **Admin Dashboard**
- **User Management**: Complete CRUD operations for users
- **Conversation Monitoring**: View and manage all chat conversations
- **Document Management**: Upload and process PDF, TXT, JSON, CSV files
- **FAQ Management**: Create and manage knowledge base
- **System Health**: Real-time monitoring and analytics
- **Dark/Light Theme**: Professional UI with theme switching

### 📄 **Document Processing**
- **PDF Text Extraction**: Full content extraction from PDF files
- **Multiple Formats**: Support for TXT, PDF, JSON, CSV files
- **Metadata Generation**: Automatic keyword and content analysis
- **Search Integration**: Processed content available for AI responses

### 🎨 **User Experience**
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: User preference with smooth transitions
- **Loading States**: Professional loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback for user actions

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **npm** or **yarn**
- **Google Gemini API Key**

### 1. Clone the Repository

```bash
git clone https://github.com/Sai6522/ai-customer-support-chat.git
cd ai-customer-support-chat
```

### 2. Environment Setup

Create `.env` file in the backend directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai-customer-support

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Google Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Start MongoDB

```bash
# Using systemctl (Linux)
sudo systemctl start mongod

# Using brew (macOS)
brew services start mongodb-community

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the Application

#### Option A: Manual Start

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend
cd frontend
npm start
```

#### Option B: Using Scripts

```bash
# Make scripts executable
chmod +x start.sh stop.sh check-status.sh

# Start all services
./start.sh

# Check status
./check-status.sh

# Stop all services
./stop.sh
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Backend API**: http://localhost:5000/api

## 👤 Demo Accounts

### Regular User
- **Username**: `user`
- **Password**: `password123`
- **Access**: Chat interface, profile management

### Administrator
- **Username**: `admin`
- **Password**: `password123`
- **Access**: Full admin dashboard, user management

## 📁 Project Structure

```
ai-customer-support-chat/
├── backend/                    # Node.js backend
│   ├── models/                # MongoDB models
│   │   ├── User.js           # User model
│   │   ├── Conversation.js   # Chat conversation model
│   │   ├── FAQ.js            # FAQ model
│   │   └── CompanyData.js    # Company documents model
│   ├── routes/               # API routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── chat.js          # Chat functionality
│   │   ├── admin.js         # Admin operations
│   │   └── user.js          # User management
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js          # JWT authentication
│   │   ├── upload.js        # File upload handling
│   │   └── errorHandler.js  # Error handling
│   ├── utils/               # Utility functions
│   │   ├── geminiService.js # Google Gemini integration
│   │   ├── fileProcessor.js # File processing utilities
│   │   ├── chatDownload.js  # Chat export utilities
│   │   └── seedData.js      # Database seeding
│   ├── uploads/             # File upload directory
│   ├── downloads/           # Generated file directory
│   └── server.js           # Main server file
├── frontend/                # React frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── ThemeToggle.js
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/       # React contexts
│   │   │   ├── AuthContext.js
│   │   │   ├── ChatContext.js
│   │   │   └── ThemeContext.js
│   │   ├── pages/          # Main pages
│   │   │   ├── ChatPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── ProfilePage.js
│   │   │   └── AdminDashboard.js
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   ├── utils/          # Utility functions
│   │   │   └── chatDownload.js
│   │   └── App.js          # Main app component
├── scripts/                # Utility scripts
│   ├── start.sh           # Start all services
│   ├── stop.sh            # Stop all services
│   └── check-status.sh    # Check service status
├── docker-compose.yml     # Docker configuration
└── README.md             # This file
```

## 🔧 API Documentation

### Authentication Endpoints

```bash
POST /api/auth/register      # Register new user
POST /api/auth/login         # User login
POST /api/auth/demo-login    # Demo account login
GET  /api/auth/me           # Get current user
PUT  /api/auth/profile      # Update user profile
```

### Chat Endpoints

```bash
POST /api/chat/message                    # Send message
GET  /api/chat/sessions                   # Get user's chat sessions
GET  /api/chat/download/:sessionId/txt    # Download chat as TXT
GET  /api/chat/download/:sessionId/html   # Get chat HTML for PDF
```

### Admin Endpoints

```bash
GET    /api/admin/dashboard              # Dashboard statistics
GET    /api/admin/users                  # Get all users
PUT    /api/admin/users/:id              # Update user
DELETE /api/admin/users/:id              # Delete user
GET    /api/admin/conversations          # Get all conversations
DELETE /api/admin/conversation/:id       # Delete conversation
POST   /api/admin/upload-company-data    # Upload documents
GET    /api/admin/company-data           # Get documents
PUT    /api/admin/company-data/:id       # Update document
DELETE /api/admin/company-data/:id       # Delete document
```

## 🛠️ Development

### Running in Development Mode

```bash
# Backend with nodemon
cd backend
npm run dev

# Frontend with hot reload
cd frontend
npm start
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-customer-support
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=AI Customer Support Chat
```

### Code Style

This project follows these conventions:
- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **JSDoc** comments for functions
- **Consistent naming** conventions
- **Error handling** best practices

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build backend
cd backend
docker build -t ai-chat-backend .

# Build frontend
cd frontend
docker build -t ai-chat-frontend .
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Integration Tests

```bash
# Test all endpoints
./scripts/test-api.sh

# Test file uploads
./scripts/test-uploads.sh
```

## 📊 Features Overview

### ✅ **Implemented Features**

#### **Core Chat System**
- ✅ Real-time AI conversations with Google Gemini
- ✅ Message history and session management
- ✅ Typing indicators and loading states
- ✅ Error handling and retry mechanisms

#### **User Management**
- ✅ JWT-based authentication
- ✅ User registration and login
- ✅ Profile management
- ✅ Role-based access control

#### **Admin Dashboard**
- ✅ Complete user management (CRUD)
- ✅ Conversation monitoring and management
- ✅ Document upload and processing
- ✅ FAQ management system
- ✅ System health monitoring

#### **Document Processing**
- ✅ PDF text extraction
- ✅ Multiple file format support
- ✅ Metadata generation
- ✅ Content search integration

#### **Export Functionality**
- ✅ Chat export as TXT files
- ✅ Chat export as PDF files
- ✅ Professional document formatting
- ✅ Metadata inclusion

#### **UI/UX Features**
- ✅ Dark/Light theme switching
- ✅ Responsive design
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Professional styling

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive input sanitization
- **File Upload Security**: File type and size validation
- **CORS Protection**: Configured CORS policies
- **Rate Limiting**: API rate limiting (configurable)
- **Error Handling**: Secure error messages

## 🚀 Performance Optimizations

- **Database Indexing**: Optimized MongoDB queries
- **Lazy Loading**: Component lazy loading
- **Caching**: Response caching where appropriate
- **File Processing**: Efficient file handling
- **Memory Management**: Proper cleanup and garbage collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Add JSDoc comments for functions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent chat responses
- **Material-UI** for beautiful React components
- **MongoDB** for flexible data storage
- **React** for the frontend framework
- **Node.js** for the backend runtime

## 📞 Support

For support, email support@example.com or create an issue in this repository.

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Initial release with full feature set
- ✅ AI-powered chat with Google Gemini
- ✅ Complete admin dashboard
- ✅ Document processing and export
- ✅ Dark/Light theme support
- ✅ Responsive design

---

**Built with ❤️ by [Sai6522](https://github.com/Sai6522)**
