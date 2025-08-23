import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/theme.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { CustomThemeProvider, useTheme } from './contexts/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// App content component (needs to be inside AuthProvider and ThemeProvider)
const AppContent = () => {
  const { loading } = useAuth();
  const { isDarkMode } = useTheme();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/chat" 
              element={
                <ChatProvider>
                  <ChatPage />
                </ChatProvider>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Box>
        
        {/* Theme-aware Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDarkMode ? "dark" : "light"}
          toastStyle={{
            backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
          }}
        />
      </Box>
    </Router>
  );
};

// Main App component
const App = () => {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </CustomThemeProvider>
  );
};

export default App;
