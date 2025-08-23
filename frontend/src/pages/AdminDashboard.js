import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Dashboard,
  QuestionAnswer,
  Business,
  Chat,
  People,
  Add,
  Edit,
  Delete,
  Upload,
  Visibility,
  HealthAndSafety,
} from '@mui/icons-material';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [conversations, setConversations] = useState([]); // Used in Conversations tab
  // eslint-disable-next-line no-unused-vars
  const [users, setUsers] = useState([]); // Used in Users tab
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [faqDialog, setFaqDialog] = useState({ open: false, mode: 'create', data: null });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [conversationDialog, setConversationDialog] = useState(false);
  const [userDialog, setUserDialog] = useState({ open: false, mode: 'create', data: null });
  const [selectedItem, setSelectedItem] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);

  // Form states
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: '',
    tags: '',
    priority: 0,
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: '',
    tags: '',
    priority: 0,
    file: null,
  });

  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    content: '',
    tags: '',
    priority: 0,
  });

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    role: 'user',
    isActive: true,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    switch (currentTab) {
      case 1:
        loadFAQs();
        break;
      case 2:
        loadCompanyData();
        break;
      case 3:
        loadConversations();
        break;
      case 4:
        loadUsers();
        break;
      case 5:
        loadSystemHealth();
        break;
      default:
        break;
    }
  }, [currentTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      const response = await adminAPI.getFAQs();
      setFaqs(response.data.data.faqs);
    } catch (error) {
      toast.error('Failed to load FAQs');
    }
  };

  const loadCompanyData = async () => {
    try {
      const response = await adminAPI.getCompanyData();
      setCompanyData(response.data.data.companyData);
    } catch (error) {
      toast.error('Failed to load company data');
    }
  };

  const loadConversations = async () => {
    try {
      const response = await adminAPI.getConversations();
      setConversations(response.data.data.conversations);
    } catch (error) {
      toast.error('Failed to load conversations');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.data.users);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      setSystemHealth(response.data.data);
    } catch (error) {
      toast.error('Failed to load system health');
    }
  };

  // Document management handlers
  const handleViewDocument = async (document) => {
    try {
      // Fetch fresh data from server instead of using cached data
      const response = await adminAPI.getCompanyDataById(document._id);
      const freshDocument = response.data.data.companyData;
      setSelectedItem(freshDocument);
      setViewDialog(true);
    } catch (error) {
      console.error('View document error:', error);
      // Fallback to cached data if API fails
      setSelectedItem(document);
      setViewDialog(true);
    }
  };

  const handleEditDocument = (document) => {
    setSelectedItem(document);
    setEditForm({
      title: document.title,
      category: document.category,
      content: document.content || '',
      tags: document.tags?.join(', ') || '',
      priority: document.priority || 0,
    });
    setEditDialog(true);
  };

  const handleEditDocumentSubmit = async () => {
    try {
      console.log('Editing document:', selectedItem._id, editForm); // Debug log
      
      const response = await adminAPI.updateCompanyData(selectedItem._id, {
        ...editForm,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      });
      
      console.log('Edit response:', response); // Debug log
      
      toast.success('Document updated successfully');
      setEditDialog(false);
      
      // Refresh the company data list
      await loadCompanyData();
      
      // If view dialog is open, refresh the viewed document
      if (viewDialog) {
        const updatedResponse = await adminAPI.getCompanyDataById(selectedItem._id);
        setSelectedItem(updatedResponse.data.data.companyData);
      }
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update document';
      toast.error(errorMessage);
    }
  };

  // Conversation handlers
  const handleViewConversation = async (conversation) => {
    try {
      setSelectedItem(conversation);
      const response = await adminAPI.getConversationMessages(conversation._id);
      console.log('Conversation response:', response.data); // Debug log
      
      // The backend returns { success: true, data: { conversation: {...} } }
      const conversationData = response.data.data.conversation;
      setConversationMessages(conversationData?.messages || []);
      setConversationDialog(true);
    } catch (error) {
      toast.error('Failed to load conversation messages');
      console.error('Conversation error:', error);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      try {
        await adminAPI.deleteConversation(conversationId);
        toast.success('Conversation deleted successfully');
        loadConversations();
      } catch (error) {
        toast.error('Failed to delete conversation');
        console.error('Delete conversation error:', error);
      }
    }
  };

  // User management handlers
  const handleEditUser = (user) => {
    setUserForm({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setUserDialog({ open: true, mode: 'edit', data: user });
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(userId);
        toast.success('User deleted successfully');
        loadUsers();
      } catch (error) {
        toast.error('Failed to delete user');
        console.error('Delete user error:', error);
      }
    }
  };

  const handleUserSubmit = async () => {
    try {
      if (userDialog.mode === 'edit') {
        await adminAPI.updateUser(userDialog.data._id, userForm);
        toast.success('User updated successfully');
      } else {
        await adminAPI.createUser(userForm);
        toast.success('User created successfully');
      }
      
      setUserDialog({ open: false, mode: 'create', data: null });
      setUserForm({ username: '', email: '', role: 'user', isActive: true });
      loadUsers();
    } catch (error) {
      toast.error(`Failed to ${userDialog.mode} user`);
      console.error('User operation error:', error);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await adminAPI.deleteCompanyData(documentId);
        toast.success('Document deleted successfully');
        loadCompanyData();
      } catch (error) {
        toast.error('Failed to delete document');
        console.error('Delete error:', error);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleFAQSubmit = async () => {
    try {
      if (faqDialog.mode === 'create') {
        await adminAPI.createFAQ({
          ...faqForm,
          tags: faqForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        });
        toast.success('FAQ created successfully');
      } else {
        await adminAPI.updateFAQ(faqDialog.data._id, {
          ...faqForm,
          tags: faqForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        });
        toast.success('FAQ updated successfully');
      }
      
      setFaqDialog({ open: false, mode: 'create', data: null });
      setFaqForm({ question: '', answer: '', category: '', tags: '', priority: 0 });
      loadFAQs();
    } catch (error) {
      toast.error('Failed to save FAQ');
    }
  };

  const handleFAQDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await adminAPI.deleteFAQ(id);
        toast.success('FAQ deleted successfully');
        loadFAQs();
      } catch (error) {
        toast.error('Failed to delete FAQ');
      }
    }
  };

  const handleUploadSubmit = async () => {
    try {
      console.log('Upload form data:', uploadForm); // Debug log
      
      if (!uploadForm.file) {
        toast.error('Please select a file to upload');
        return;
      }
      
      if (!uploadForm.title || !uploadForm.category) {
        toast.error('Title and category are required');
        return;
      }

      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('category', uploadForm.category);
      formData.append('tags', uploadForm.tags);
      formData.append('priority', uploadForm.priority);
      formData.append('file', uploadForm.file);

      console.log('Uploading file:', uploadForm.file.name); // Debug log
      
      const response = await adminAPI.uploadCompanyData(formData);
      console.log('Upload response:', response); // Debug log
      
      toast.success('File uploaded successfully');
      setUploadDialog(false);
      setUploadForm({ title: '', category: '', tags: '', priority: 0, file: null });
      loadCompanyData();
    } catch (error) {
      console.error('Upload error:', error); // Debug log
      const errorMessage = error.response?.data?.message || 'Failed to upload file';
      toast.error(errorMessage);
    }
  };

  const openFAQDialog = (mode, data = null) => {
    if (mode === 'edit' && data) {
      setFaqForm({
        question: data.question,
        answer: data.answer,
        category: data.category,
        tags: data.tags.join(', '),
        priority: data.priority,
      });
    } else {
      setFaqForm({ question: '', answer: '', category: '', tags: '', priority: 0 });
    }
    setFaqDialog({ open: true, mode, data });
  };

  if (loading && !dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading admin dashboard..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Dashboard />} label="Overview" />
          <Tab icon={<QuestionAnswer />} label="FAQs" />
          <Tab icon={<Business />} label="Company Data" />
          <Tab icon={<Chat />} label="Conversations" />
          <Tab icon={<People />} label="Users" />
          <Tab icon={<HealthAndSafety />} label="System Health" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {currentTab === 0 && dashboardData && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {dashboardData.overview.totalUsers}
                </Typography>
                <Typography variant="body2" color="success.main">
                  +{dashboardData.overview.newUsers} this month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Conversations
                </Typography>
                <Typography variant="h4">
                  {dashboardData.overview.totalConversations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active FAQs
                </Typography>
                <Typography variant="h4">
                  {dashboardData.overview.totalFAQs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Company Documents
                </Typography>
                <Typography variant="h4">
                  {dashboardData.overview.totalCompanyData}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Conversations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Conversations
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Messages</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.recentConversations.map((conversation) => (
                        <TableRow key={conversation._id}>
                          <TableCell>{conversation.title}</TableCell>
                          <TableCell>{conversation.userId?.username || 'Anonymous'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={conversation.status} 
                              size="small"
                              color={conversation.status === 'active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{conversation.messageCount}</TableCell>
                          <TableCell>
                            {new Date(conversation.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* FAQs Tab */}
      {currentTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">FAQ Management</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openFAQDialog('create')}
            >
              Add FAQ
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq._id}>
                    <TableCell>{faq.question}</TableCell>
                    <TableCell>{faq.category}</TableCell>
                    <TableCell>{faq.priority}</TableCell>
                    <TableCell>{faq.viewCount}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => openFAQDialog('edit', faq)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleFAQDelete(faq._id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Company Data Tab */}
      {currentTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Company Data Management</Typography>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setUploadDialog(true)}
            >
              Upload Document
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companyData.map((data) => (
                  <TableRow key={data._id}>
                    <TableCell>{data.title}</TableCell>
                    <TableCell>{data.category}</TableCell>
                    <TableCell>{data.type}</TableCell>
                    <TableCell>{data.fileSizeFormatted || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(data.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewDocument(data)} title="View Document">
                        <Visibility />
                      </IconButton>
                      <IconButton onClick={() => handleEditDocument(data)} title="Edit Document">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteDocument(data._id)} title="Delete Document" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Conversations Tab */}
      {currentTab === 3 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Conversations Management
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Session ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Messages</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No conversations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  conversations.map((conversation) => (
                    <TableRow key={conversation._id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conversation.title || 'New Conversation'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {conversation.sessionId?.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {conversation.userId ? (
                          <Chip label={conversation.userId.username || 'Unknown'} size="small" />
                        ) : (
                          <Chip label="Anonymous" variant="outlined" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={conversation.messageCount || 0} 
                          color="primary" 
                          variant="outlined" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={conversation.status || 'active'} 
                          color={conversation.status === 'closed' ? 'default' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          title="View Conversation"
                          onClick={() => handleViewConversation(conversation)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          title="Delete Conversation" 
                          color="error"
                          onClick={() => handleDeleteConversation(conversation._id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Users Tab */}
      {currentTab === 4 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Users Management
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {user.username}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Inactive'} 
                          color={user.isActive ? 'success' : 'error'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? 
                          new Date(user.lastLogin).toLocaleDateString() : 
                          'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          title="Edit User"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          title="Delete User" 
                          color="error"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* System Health Tab */}
      {currentTab === 5 && systemHealth && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Database Status
                </Typography>
                <Chip
                  label={systemHealth.database.status}
                  color={systemHealth.database.status === 'healthy' ? 'success' : 'error'}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {systemHealth.database.message}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI Service Status
                </Typography>
                <Chip
                  label={systemHealth.aiService.status}
                  color={systemHealth.aiService.status === 'healthy' ? 'success' : 'error'}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {systemHealth.aiService.message}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Server Status
                </Typography>
                <Chip
                  label={systemHealth.server.status}
                  color="success"
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Uptime: {Math.floor(systemHealth.server.uptime / 3600)}h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* FAQ Dialog */}
      <Dialog open={faqDialog.open} onClose={() => setFaqDialog({ open: false, mode: 'create', data: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          {faqDialog.mode === 'create' ? 'Create FAQ' : 'Edit FAQ'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Question"
            value={faqForm.question}
            onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Answer"
            value={faqForm.answer}
            onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
          />
          <TextField
            fullWidth
            label="Category"
            value={faqForm.category}
            onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Tags (comma separated)"
            value={faqForm.tags}
            onChange={(e) => setFaqForm({ ...faqForm, tags: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Priority"
            type="number"
            value={faqForm.priority}
            onChange={(e) => setFaqForm({ ...faqForm, priority: parseInt(e.target.value) })}
            margin="normal"
            inputProps={{ min: 0, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFaqDialog({ open: false, mode: 'create', data: null })}>
            Cancel
          </Button>
          <Button onClick={handleFAQSubmit} variant="contained">
            {faqDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Company Document</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={uploadForm.title}
            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Category"
            value={uploadForm.category}
            onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Tags (comma separated)"
            value={uploadForm.tags}
            onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Priority"
            type="number"
            value={uploadForm.priority}
            onChange={(e) => setUploadForm({ ...uploadForm, priority: parseInt(e.target.value) })}
            margin="normal"
            inputProps={{ min: 0, max: 10 }}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2 }}
          >
            Choose File
            <input
              type="file"
              hidden
              accept=".txt,.pdf,.doc,.docx,.json,.csv"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  // Validate file size (5MB limit)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('File size must be less than 5MB');
                    e.target.value = '';
                    return;
                  }
                  
                  // Validate file type
                  const allowedTypes = [
                    'text/plain',
                    'application/pdf', 
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/json',
                    'text/csv'
                  ];
                  
                  if (!allowedTypes.includes(file.type)) {
                    toast.error('File type not supported. Please use: TXT, PDF, DOC, DOCX, JSON, or CSV');
                    e.target.value = '';
                    return;
                  }
                  
                  setUploadForm({ ...uploadForm, file });
                }
              }}
            />
          </Button>
          {uploadForm.file && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight="medium">
                Selected File:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Name: {uploadForm.file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {(uploadForm.file.size / 1024).toFixed(1)} KB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type: {uploadForm.file.type}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleUploadSubmit} variant="contained" disabled={!uploadForm.file}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>View Document</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedItem.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category: {selectedItem.category} | Type: {selectedItem.type}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Created: {new Date(selectedItem.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                {selectedItem.content || 'No content available'}
              </Typography>
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tags:
                  </Typography>
                  {selectedItem.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Category"
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Content"
            value={editForm.content}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            margin="normal"
            multiline
            rows={6}
          />
          <TextField
            fullWidth
            label="Tags (comma separated)"
            value={editForm.tags}
            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Priority"
            type="number"
            value={editForm.priority}
            onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
            margin="normal"
            inputProps={{ min: 0, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditDocumentSubmit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conversation View Dialog */}
      <Dialog open={conversationDialog} onClose={() => setConversationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Conversation Details
          {selectedItem && (
            <Typography variant="subtitle2" color="text.secondary">
              Session: {selectedItem.sessionId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {conversationMessages.length === 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary" align="center">
                  No messages found in this conversation
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1, display: 'block' }}>
                  Debug: Messages array length: {conversationMessages.length}
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Found {conversationMessages.length} messages
                </Typography>
                {conversationMessages.map((message, index) => (
                  <Box
                    key={message._id || index}
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: message.sender === 'user' 
                        ? 'primary.light' 
                        : 'background.paper',
                      borderRadius: 2,
                      borderLeft: 4,
                      borderLeftColor: message.sender === 'user' ? 'primary.main' : 'grey.400',
                      border: message.sender !== 'user' ? 1 : 0,
                      borderColor: message.sender !== 'user' ? 'divider' : 'transparent',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {message.sender === 'user' ? 'User' : 'AI Assistant'}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {new Date(message.timestamp).toLocaleString()}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    {message.metadata && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Response time: {message.metadata.responseTime}ms | Tokens: {message.metadata.tokens} | Model: {message.metadata.model}
                      </Typography>
                    )}
                  </Box>
                ))}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConversationDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={userDialog.open} onClose={() => setUserDialog({ open: false, mode: 'create', data: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {userDialog.mode === 'edit' ? 'Edit User' : 'Create User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            margin="normal"
            required
            disabled={userDialog.mode === 'edit'}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Role"
            select
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </TextField>
          <TextField
            fullWidth
            label="Status"
            select
            value={userForm.isActive}
            onChange={(e) => setUserForm({ ...userForm, isActive: e.target.value === 'true' })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog({ open: false, mode: 'create', data: null })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUserSubmit}>
            {userDialog.mode === 'edit' ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
