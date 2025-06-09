import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  AccountCircle as AccountCircleIcon,
  SupportAgent as SupportAgentIcon,
} from '@mui/icons-material';
import { fetchConversations, sendMessage, subscribeToConversations } from '../api/leadsApi';
import { Conversation, Message } from '../interfaces/interfaces';

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToConversations((payload) => {
      console.log('Real-time update received:', payload);
      loadConversations(); // Reload conversations when new data arrives
    });

    return () => {
      unsubscribe(); // Cleanup subscription on component unmount
    };
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await fetchConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    const message = {
      senderId: 'bot' as const,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      const sentMessage = await sendMessage(selectedConversation.leadId, message);
      
      // Update the conversation in the UI
      setSelectedConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, sentMessage],
          lastMessage: newMessage,
          updatedAt: new Date().toISOString(),
        };
      });
      
      setNewMessage('');
      
      // Refresh conversations to get the latest data
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'primary';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      default: return 'default';
    }
  };

  const filteredConversations = conversations.filter(conv => 
    statusFilter === 'all' || conv.status === statusFilter
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={loadConversations} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 100px)' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Conversations
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {filteredConversations.map((conversation) => (
                <ListItem
                  key={conversation.id}
                  button
                  selected={selectedConversation?.id === conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  divider
                >
                  <ListItemAvatar>
                    <Avatar>
                      <AccountCircleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {conversation.leadName}
                        <Chip
                          label={conversation.status}
                          color={getStatusColor(conversation.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={conversation.lastMessage}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">
                    {selectedConversation.leadName}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  {selectedConversation.messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.senderId === 'bot' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          maxWidth: '70%',
                          flexDirection: message.senderId === 'bot' ? 'row-reverse' : 'row',
                        }}
                      >
                        <Avatar sx={{ mx: 1 }}>
                          {message.senderId === 'bot' ? <SupportAgentIcon /> : <AccountCircleIcon />}
                        </Avatar>
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: message.senderId === 'bot' ? 'primary.main' : 'grey.100',
                            color: message.senderId === 'bot' ? 'white' : 'text.primary',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body1">{message.content}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start chatting
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Conversations