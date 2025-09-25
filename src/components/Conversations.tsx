import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, TextField, Button, Chip, Grid, IconButton, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Alert
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
  const [modoRespuesta, setModoRespuesta] = useState<'text' | 'audio'>('text');
  const [clientId, setClientId] = useState<string | null>(null);

  // 🔑 Obtener client_id real del usuario autenticado
  useEffect(() => {
    const fetchClientId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_data');
      if (error) {
        console.error('❌ Error fetching client_id:', error);
        return;
      }

      if (data && data[0]?.client_id) {
        console.log('✅ Client ID obtenido del RPC:', data[0].client_id);
        setClientId(data[0].client_id);

        // Opcional: cache en localStorage
        localStorage.setItem('unicorn_client_id', data[0].client_id);
      }
    };

    fetchClientId();
  }, []);

  // 📥 Cargar conversaciones
  useEffect(() => {
    if (!clientId) return; // esperar clientId
    loadConversations();

    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel) };
  }, [clientId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('conversations')
        .select('id, lead_phone, last_message, agent_name, created_at, status, origen, procesar, client_id')
        .order('created_at', { ascending: true });

      if (clientId) query = query.eq('client_id', clientId);

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      const grouped = (data || []).reduce((acc: any, curr: any) => {
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

  // 📤 Enviar mensaje
  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !clientId) return;

    try {
      const insertRow: any = {
        lead_phone: selectedConversation.leadId,
        last_message: newMessage,
        agent_name: 'bot',
        created_at: new Date().toISOString(),
        status: 'In Progress',
        origen: 'unicorn',
        procesar: false,
        modo_respuesta: modoRespuesta,
        client_id: clientId, // ✅ usar clientId real
      };

      const { error: sendError } = await supabase.from('conversations').insert([insertRow]);
      if (sendError) throw sendError;

      setNewMessage('');
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error al enviar el mensaje');
    }
  };

  // 🔄 Cambiar estado conversación
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedConversation || !clientId) return;

    try {
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ status: newStatus })
        .eq('id', selectedConversation.id)
        .eq('client_id', clientId);

      if (updateError) throw updateError;

      setSelectedConversation((prev: any) => ({ ...prev, status: newStatus }));
      await loadConversations();
    } catch (error) {
      console.error('Error updating status:', error);
      setError('No se pudo actualizar el estado');
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
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={loadConversations} variant="contained">Intentar nuevamente</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 100px)' }}>
      {/* Tu renderizado original de la UI aquí... */}
    </Box>
  );
};

export default Conversations;
