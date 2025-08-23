import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import { Person, Lock, Save, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load fresh user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await authAPI.getProfile();
        const userData = response.data.data.user;
        setUserDetails(userData);
        setProfileData({
          username: userData.username || '',
          email: userData.email || '',
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to context user data
        if (user) {
          setUserDetails(user);
          setProfileData({
            username: user.username || '',
            email: user.email || '',
          });
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        toast.success('Profile updated successfully!');
        // Refresh user data
        const response = await authAPI.getProfile();
        setUserDetails(response.data.data.user);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentUser = userDetails || user;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AccountCircle sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Profile Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account information and security settings
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Account Information - Move to top */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} />
                Account Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Role
                  </Typography>
                  <Chip 
                    label={currentUser?.role || 'N/A'} 
                    color={currentUser?.role === 'admin' ? 'primary' : 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Member Since
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(currentUser?.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Login
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDateTime(currentUser?.lastLogin)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Account Status
                  </Typography>
                  <Chip 
                    label={currentUser?.isActive !== false ? 'Active' : 'Inactive'}
                    color={currentUser?.isActive !== false ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    User ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {currentUser?.id || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(currentUser?.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Profile Information
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleProfileSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  margin="normal"
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  sx={{ mt: 2 }}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lock sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Change Password
                </Typography>
              </Box>

              <Box component="form" onSubmit={handlePasswordSubmit}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Lock />}
                  sx={{ mt: 2 }}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
