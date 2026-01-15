import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
  Divider,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Message as MessageIcon,
  Mic as MicIcon,
  TextFields as TextFieldsIcon,
} from '@mui/icons-material';
import supabase from '../utils/supabaseClient';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  leadId: string;
  lastMessage: string;
  updatedAt: string;
  status: string;
  messages: Message[];
}

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modoRespuesta, setModoRespuesta] = useState<'text' | 'audio'>('text');

  useEffect(() => {
    loadConversations();
    
    // Suscripción en tiempo real
    const channel = supabase
      .channel('public:conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          console.log('🔄 Conversations updated - reloading...');
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading conversations...');
      const { data, error } = await supabase
        .from('conversations')
        .select('id, lead_phone, last_message, agent_name, created_at, status, origen, procesar')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Conversations loaded:', data?.length || 0);

      // Agrupar mensajes por lead_phone
      const grouped = (data || []).reduce((acc: any, curr: any) => {
        const key = curr.lead_phone || 'unknown';
        
        if (!acc[key]) {
          acc[key] = {
            id: curr.id,
            leadId: curr.lead_phone,
            lastMessage: curr.last_message || '',
            updatedAt: curr.created_at,
            status: curr.status || 'New',
            messages: [],
          };
        }

        acc[key].messages.push({
          id: curr.id,
          sender: curr.agent_name || 'Unknown',
          content: curr.last_message || '',
          timestamp: curr.created_at,
        });

        // Actualizar último mensaje y fecha
        if (new Date(curr.created_at) > new Date(acc[key].updatedAt)) {
          acc[key].lastMessage = curr.last_message;
          acc[key].updatedAt = curr.created_at;
        }

        return acc;
      }, {});

      const conversationsList = Object.values(grouped) as Conversation[];
      setConversations(conversationsList);
    } catch (err) {
      console.error('❌ Error loading conversations:', err);
      setError('No se pudieron cargar las conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) {
      return;
    }

    try {
      console.log('📤 Sending message:', newMessage);
      
      const { error } = await supabase.from('conversations').insert([
        {
          lead_phone: selectedConversation.leadId,
          last_message: newMessage,
          agent_name: 'bot',
          status: 'In Progress',
          origen: 'unicorn',
          procesar: false,
          modo_respuesta: modoRespuesta,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      console.log('✅ Message sent successfully');
      setNewMessage('');
      await loadConversations();
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError('Error al enviar el mensaje');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => 
    statusFilter === 'all' || conv.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'primary';
      case 'In Progress': return 'warning';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 100px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Conversations
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadConversations}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filteredConversations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MessageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No conversations found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Activate leads to start conversations
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ height: 'calc(100% - 80px)' }}>
          {/* Lista de conversaciones */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: '100%', overflow: 'auto' }} elevation={3}>
              <List>
                {filteredConversations.map((conv) => (
                  <React.Fragment key={conv.id}>
                    <ListItemButton
                      selected={selectedConversation?.id === conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          '&:hover': {
                            bgcolor: 'primary.light',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {conv.leadId}
                            </Typography>
                            <Chip
                              label={conv.status}
                              size="small"
                              color={getStatusColor(conv.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {conv.lastMessage || 'No messages'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(conv.updatedAt).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Panel de chat */}
          <Grid item xs={12} md={8}>
            {selectedConversation ? (
              <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} elevation={3}>
                {/* Header del chat */}
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{selectedConversation.leadId}</Typography>
                      <Chip
                        label={selectedConversation.status}
                        size="small"
                        color={getStatusColor(selectedConversation.status) as any}
                      />
                    </Box>
                    <ToggleButtonGroup
                      value={modoRespuesta}
                      exclusive
                      onChange={(_, val) => val && setModoRespuesta(val)}
                      size="small"
                    >
                      <ToggleButton value="text">
                        <TextFieldsIcon />
                      </ToggleButton>
                      <ToggleButton value="audio">
                        <MicIcon />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Box>

                {/* Mensajes */}
                <Box sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: '#f5f5f5' }}>
                  {selectedConversation.messages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No messages yet
                    </Typography>
                  ) : (
                    selectedConversation.messages.map((msg) => (
                      <Box
                        key={msg.id}
                        sx={{
                          mb: 2,
                          display: 'flex',
                          justifyContent: msg.sender === 'bot' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Card
                          sx={{
                            maxWidth: '70%',
                            bgcolor: msg.sender === 'bot' ? 'primary.main' : 'white',
                            color: msg.sender === 'bot' ? 'white' : 'text.primary',
                          }}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.8 }}>
                              {msg.sender}
                            </Typography>
                            <Typography variant="body2">{msg.content}</Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Input de mensaje */}
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={3}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      endIcon={<SendIcon />}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      Send
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Mode: {modoRespuesta === 'text' ? 'Text' : 'Audio'} | Press Enter to send
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <MessageIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a conversation to start chatting
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Conversations;
