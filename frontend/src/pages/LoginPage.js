import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Login, PersonAdd } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, error, clearError } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/chat';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginMode) {
        // Login
        const result = await login({
          username: formData.username,
          password: formData.password,
        });

        if (result.success) {
          toast.success('Login successful!');
          const from = location.state?.from?.pathname || '/chat';
          navigate(from, { replace: true });
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        const result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        if (result.success) {
          toast.success('Registration successful!');
          navigate('/chat', { replace: true });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setLoading(true);
    try {
      const credentials = {
        username: role,
        password: 'password123',
      };

      const result = await login(credentials, true);

      if (result.success) {
        toast.success(`Demo ${role} login successful!`);
        const from = location.state?.from?.pathname || '/chat';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    clearError();
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            {isLoginMode ? 'Sign In' : 'Sign Up'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleInputChange}
            />

            {!isLoginMode && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
            />

            {!isLoginMode && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={isLoginMode ? <Login /> : <PersonAdd />}
            >
              {loading ? 'Please wait...' : (isLoginMode ? 'Sign In' : 'Sign Up')}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={toggleMode}
              sx={{ mb: 2 }}
            >
              {isLoginMode 
                ? "Don't have an account? Sign Up" 
                : "Already have an account? Sign In"
              }
            </Button>
          </Box>

          <Divider sx={{ width: '100%', my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Typography variant="h6" gutterBottom>
            Demo Login
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  User Demo
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Experience the chat interface
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleDemoLogin('user')}
                  disabled={loading}
                >
                  Login as User
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Admin Demo
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Access admin dashboard
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading}
                >
                  Login as Admin
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
