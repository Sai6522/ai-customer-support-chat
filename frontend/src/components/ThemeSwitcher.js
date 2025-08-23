import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSwitcher = ({ size = 'medium', showLabel = false }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
        <IconButton
          onClick={toggleTheme}
          color="inherit"
          size={size}
          sx={{
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {isDarkMode ? (
            <Brightness7 sx={{ color: '#ffd700' }} className="theme-switcher-icon" />
          ) : (
            <Brightness4 sx={{ color: '#666666' }} className="theme-switcher-icon" />
          )}
        </IconButton>
      </Tooltip>
      {showLabel && (
        <Box
          component="span"
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
            display: { xs: 'none', sm: 'inline' },
          }}
        >
          {isDarkMode ? 'Dark' : 'Light'}
        </Box>
      )}
    </Box>
  );
};

export default ThemeSwitcher;
