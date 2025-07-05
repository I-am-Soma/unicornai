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
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  AccountCircle as AccountCircleIcon,
  SupportAgent as SupportAgentIcon,
} from '@mui/icons-material';
import supabase from '../backend/supabaseClient';

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ✅ 1. Estado para controlar el modo
  const [modoRespuesta, setModoRespuesta] = useState<'text' | 'audio'>('text');

  useEffect(() => {
    loadConversations();
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel) };
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('conversations')
        .select('id, lead_phone, last_message, agent_name, created_at, status, origen, procesar')
        .order('created_at', { ascending: true });

      if (supabaseError) throw supabaseError;

      if (!data) {
        setConversations([]);
        return;
      }

      const grouped = data.reduce((acc: any, curr: any) => {
        const leadPhone = curr.lead_phone || 'unknown';
        if (!acc[leadPhone]) {
          acc[leadPhone] = {
            id: curr.id,
            leadId: curr.lead_phone,
            leadName: curr.lead_phone || 'Unknown Contact',
            lastMessage: curr.last_message || '',
            updatedAt: curr.created_at,
            status: curr.status || 'New',
            origen: curr.origen || 'N/A',
            procesar: curr.procesar ?? false,
            messages: [],
          };
        }
        acc[leadPhone].messages.push({
          id: curr.id,
          senderId: curr.agent_name || 'agent',
          content: curr.last_message || '',
          timestamp: curr.created_at,
        });
        acc[leadPhone].lastMessage = curr.last_message || '';
        acc[leadPhone].updatedAt = curr.created_at;
        return acc;
      }, {});

      setConversations(Object.values(grouped));
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('No se pudieron cargar las conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      // ✅ 3. Enviar también modoRespuesta al backend
      const { error: sendError } = await supabase
        .from('conversations')
        .insert([
          {
            lead_phone: selectedConversation.leadId,
            last_message: newMessage,
            agent_name: 'bot',
            created_at: new Date().toISOString(),
            status: 'In Progress',
            origen: 'unicorn',
            procesar: false,
            modo_respuesta: modoRespuesta  // 👈 Campo nuevo
          }
        ]);

      if (sendError) throw sendError;

      setNewMessage('');
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error al enviar el mensaje');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedConversation) return;
    await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('id', selectedConversation.id);
    setSelectedConversation((prev: any) => ({ ...prev, status: newStatus }));
    await loadConversations();
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadConversations} variant="contained">
          Intentar nuevamente
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 100px)' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Conversations</Typography>
              <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {filteredConversations.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No hay conversaciones"
                    secondary="Las conversaciones aparecerán aquí"
                  />
                </ListItem>
              ) : (
                filteredConversations.map((conversation) => (
                  <ListItem
                    key={conversation.id}
                    button
                    selected={selectedConversation?.id === conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    divider
                  >
                    <ListItemAvatar>
                      <Avatar><AccountCircleIcon /></Avatar>
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
                      secondary={conversation.lastMessage || 'No messages'}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{selectedConversation.leadName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Origen: {selectedConversation.origen || 'N/A'}
                    </Typography>
                  </Box>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={selectedConversation.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="New">New</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Resolved">Resolved</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  {selectedConversation.messages.map((message: any) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.senderId === 'bot' || message.senderId === 'Unicorn AI' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          maxWidth: '70%',
                          flexDirection: message.senderId === 'bot' || message.senderId === 'Unicorn AI' ? 'row-reverse' : 'row',
                        }}
                      >
                        <Avatar sx={{ mx: 1 }}>
                          {message.senderId === 'bot' || message.senderId === 'Unicorn AI' ? <SupportAgentIcon /> : <AccountCircleIcon />}
                        </Avatar>
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: message.senderId === 'bot' || message.senderId === 'Unicorn AI' ? 'primary.main' : 'grey.100',
                            color: message.senderId === 'bot' || message.senderId === 'Unicorn AI' ? 'white' : 'text.primary',
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
                  {/* ✅ 2. Selector visual sobre el campo de mensaje */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Modo</InputLabel>
                      <Select
                        value={modoRespuesta}
                        onChange={(e) => setModoRespuesta(e.target.value as 'text' | 'audio')}
                        label="Modo"
                      >
                        <MenuItem value="text">Texto</MenuItem>
                        <MenuItem value="audio">Audio</MenuItem>
                      </Select>
                    </FormControl>

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

export default Conversations;
