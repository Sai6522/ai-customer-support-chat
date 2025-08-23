import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
} from '@mui/material';
import {
  AccountCircle,
  AdminPanelSettings,
  Chat,
  Logout,
  Person,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import ThemeSwitcher from './ThemeSwitcher';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/chat')}
        >
          {process.env.REACT_APP_APP_NAME || 'AI Customer Support'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Chat Button */}
          <Button
            color="inherit"
            startIcon={<Chat />}
            onClick={() => navigate('/chat')}
            sx={{
              backgroundColor: location.pathname === '/chat' ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            Chat
          </Button>

          {isAuthenticated ? (
            <>
              {/* Admin Button */}
              {isAdmin() && (
                <Button
                  color="inherit"
                  startIcon={<AdminPanelSettings />}
                  onClick={() => navigate('/admin')}
                  sx={{
                    backgroundColor: location.pathname.startsWith('/admin') ? 'rgba(255,255,255,0.1)' : 'transparent',
                  }}
                >
                  Admin
                </Button>
              )}

              {/* Theme Switcher */}
              <ThemeSwitcher size="medium" />

              {/* User Menu */}
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="primary-search-account-menu"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={isMenuOpen}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: { minWidth: 200 },
                }}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user?.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleNavigation('/profile')}>
                  <Person sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                {isAdmin() && (
                  <MenuItem onClick={() => handleNavigation('/admin')}>
                    <AdminPanelSettings sx={{ mr: 1 }} />
                    Admin Dashboard
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              {/* Theme Switcher for non-authenticated users */}
              <ThemeSwitcher size="medium" />
              
              <Button
                color="inherit"
                startIcon={<AccountCircle />}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
