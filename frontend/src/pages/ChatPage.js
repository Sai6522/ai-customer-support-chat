import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Alert,
  Fab,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Refresh,
  Download,
  Star,
  MoreVert,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const ChatPage = () => {
  const { 
    messages, 
    loading, 
    isTyping, 
    error, 
    sendMessage, 
    startNewChat, 
    downloadChat,
    downloadChatTXT,
    downloadChatPDF,
    rateConversation,
    clearError 
  } = useChat();
  const { isAuthenticated } = useAuth();

  const [inputMessage, setInputMessage] = useState('');
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleNewChat = async () => {
    await startNewChat();
    setInputMessage('');
    toast.success('New chat started');
  };

  const handleDownload = async (format) => {
    try {
      if (format === 'txt') {
        await downloadChatTXT();
        toast.success('Chat downloaded as TXT file');
      } else if (format === 'pdf') {
        await downloadChatPDF();
        toast.success('Chat downloaded as PDF file');
      }
    } catch (error) {
      toast.error(`Failed to download chat as ${format.toUpperCase()}`);
    }
    setMenuAnchor(null);
  };

  const handleRateConversation = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const result = await rateConversation(rating, feedback);
    if (result.success) {
      toast.success('Thank you for your feedback!');
      setShowRatingDialog(false);
      setRating(0);
      setFeedback('');
    } else {
      toast.error(result.error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';
    const isError = message.isError;

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
          alignItems: 'flex-start',
        }}
      >
        {!isUser && (
          <Avatar
            sx={{
              bgcolor: isError ? 'error.main' : 'primary.main',
              mr: 1,
              width: 32,
              height: 32,
            }}
          >
            <SmartToy fontSize="small" />
          </Avatar>
        )}

        <Box
          sx={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 2,
              bgcolor: isUser 
                ? 'primary.main' 
                : isError 
                  ? 'error.light' 
                  : 'background.paper',
              color: isUser ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              borderTopRightRadius: isUser ? 0 : 2,
              borderTopLeftRadius: isUser ? 2 : 0,
              border: !isUser && !isError ? 1 : 0,
              borderColor: !isUser && !isError ? 'divider' : 'transparent',
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          </Paper>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, px: 1 }}
          >
            {formatTimestamp(message.timestamp)}
            {message.metadata?.responseTime && (
              <Chip
                label={`${message.metadata.responseTime}ms`}
                size="small"
                sx={{ ml: 1, height: 16, fontSize: '0.7rem' }}
              />
            )}
          </Typography>
        </Box>

        {isUser && (
          <Avatar
            sx={{
              bgcolor: 'secondary.main',
              ml: 1,
              width: 32,
              height: 32,
            }}
          >
            <Person fontSize="small" />
          </Avatar>
        )}
      </Box>
    );
  };

  const TypingIndicator = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        mb: 2,
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        sx={{
          bgcolor: 'primary.main',
          mr: 1,
          width: 32,
          height: 32,
        }}
      >
        <SmartToy fontSize="small" />
      </Avatar>

      <Paper
        elevation={1}
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Agent is typing...
        </Typography>
      </Paper>
    </Box>
  );

  if (loading && messages.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading chat..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', py: 2 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            AI Customer Support
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={handleNewChat}
            >
              New Chat
            </Button>

            {isAuthenticated && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Star />}
                onClick={() => setShowRatingDialog(true)}
                disabled={messages.length === 0}
              >
                Rate
              </Button>
            )}

            <IconButton
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              disabled={messages.length === 0}
            >
              <MoreVert />
            </IconButton>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={() => handleDownload('txt')}>
                <Download sx={{ mr: 1 }} />
                Download as TXT
              </MenuItem>
              <MenuItem onClick={() => handleDownload('pdf')}>
                <Download sx={{ mr: 1 }} />
                Download as PDF
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={clearError}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Messages Container */}
      <Paper 
        elevation={1} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          ref={messagesContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <SmartToy sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Welcome to AI Customer Support
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ask me anything! I'm here to help you with your questions.
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Fab
            size="small"
            color="primary"
            sx={{
              position: 'absolute',
              bottom: 80,
              right: 16,
            }}
            onClick={scrollToBottom}
          >
            <KeyboardArrowDown />
          </Fab>
        )}
      </Paper>

      {/* Input Area */}
      <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{ display: 'flex', gap: 1 }}
        >
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
            variant="outlined"
            size="small"
          />
          <IconButton
            type="submit"
            color="primary"
            disabled={!inputMessage.trim() || isTyping}
            sx={{ alignSelf: 'flex-end' }}
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onClose={() => setShowRatingDialog(false)}>
        <DialogTitle>Rate this conversation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Rating:</Typography>
              <Rating
                value={rating}
                onChange={(event, newValue) => setRating(newValue)}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Feedback (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRatingDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleRateConversation} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatPage;
