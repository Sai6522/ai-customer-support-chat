import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Save theme preference to localStorage and update body attribute
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Create Material-UI theme
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#90caf9' : '#1976d2',
        light: isDarkMode ? '#bbdefb' : '#42a5f5',
        dark: isDarkMode ? '#64b5f6' : '#1565c0',
      },
      secondary: {
        main: isDarkMode ? '#f48fb1' : '#dc004e',
        light: isDarkMode ? '#ffc1e3' : '#ff5983',
        dark: isDarkMode ? '#f06292' : '#9a0036',
      },
      background: {
        default: isDarkMode ? '#121212' : '#fafafa',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
        secondary: isDarkMode ? '#b0b0b0' : '#666666',
      },
      success: {
        main: isDarkMode ? '#4caf50' : '#2e7d32',
        light: isDarkMode ? '#81c784' : '#4caf50',
        dark: isDarkMode ? '#388e3c' : '#1b5e20',
      },
      error: {
        main: isDarkMode ? '#f44336' : '#d32f2f',
        light: isDarkMode ? '#e57373' : '#f44336',
        dark: isDarkMode ? '#d32f2f' : '#c62828',
      },
      warning: {
        main: isDarkMode ? '#ff9800' : '#ed6c02',
        light: isDarkMode ? '#ffb74d' : '#ff9800',
        dark: isDarkMode ? '#f57c00' : '#e65100',
      },
      info: {
        main: isDarkMode ? '#2196f3' : '#0288d1',
        light: isDarkMode ? '#64b5f6' : '#2196f3',
        dark: isDarkMode ? '#1976d2' : '#01579b',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 600,
        color: isDarkMode ? '#ffffff' : '#000000',
      },
      h2: {
        fontWeight: 600,
        color: isDarkMode ? '#ffffff' : '#000000',
      },
      h3: {
        fontWeight: 600,
        color: isDarkMode ? '#ffffff' : '#000000',
      },
      h4: {
        fontWeight: 600,
        color: isDarkMode ? '#ffffff' : '#000000',
      },
      h5: {
        fontWeight: 600,
        color: isDarkMode ? '#ffffff' : '#000000',
      },
      h6: {
        fontWeight: 600,
        color: isDarkMode ? '#ffffff' : '#000000',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#1976d2',
            color: isDarkMode ? '#ffffff' : '#ffffff',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
            borderRadius: 12,
            boxShadow: isDarkMode 
              ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
          contained: {
            boxShadow: isDarkMode 
              ? '0 2px 4px rgba(0, 0, 0, 0.4)' 
              : '0 2px 4px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              boxShadow: isDarkMode 
                ? '0 4px 8px rgba(0, 0, 0, 0.5)' 
                : '0 4px 8px rgba(0, 0, 0, 0.3)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
              '& fieldset': {
                borderColor: isDarkMode ? '#555555' : '#cccccc',
              },
              '&:hover fieldset': {
                borderColor: isDarkMode ? '#777777' : '#999999',
              },
              '&.Mui-focused fieldset': {
                borderColor: isDarkMode ? '#90caf9' : '#1976d2',
              },
            },
            '& .MuiInputLabel-root': {
              color: isDarkMode ? '#b0b0b0' : '#666666',
            },
            '& .MuiOutlinedInput-input': {
              color: isDarkMode ? '#ffffff' : '#000000',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#3d3d3d' : '#e0e0e0',
            color: isDarkMode ? '#ffffff' : '#000000',
          },
          colorPrimary: {
            backgroundColor: isDarkMode ? '#1976d2' : '#1976d2',
            color: '#ffffff',
          },
          colorSecondary: {
            backgroundColor: isDarkMode ? '#f48fb1' : '#dc004e',
            color: '#ffffff',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDarkMode ? '1px solid #444444' : '1px solid #e0e0e0',
            color: isDarkMode ? '#ffffff' : '#000000',
          },
          head: {
            backgroundColor: isDarkMode ? '#3d3d3d' : '#f5f5f5',
            fontWeight: 600,
          },
        },
      },
    },
  });

  const value = {
    isDarkMode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default CustomThemeProvider;
