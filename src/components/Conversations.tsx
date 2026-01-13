import React, { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Alert
} from '@mui/material';
import supabase from '../utils/supabaseClient';

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modoRespuesta, setModoRespuesta] = useState<'text' | 'audio'>('text');

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel('public:conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadConversations()
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

      const { data, error } = await supabase
        .from('conversations')
        .select('id, lead_phone, last_message, agent_name, created_at, status, origen, procesar')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, curr: any) => {
        const key = curr.lead_phone || 'unknown';
        if (!acc[key]) {
          acc[key] = {
            id: curr.id,
            leadId: curr.lead_phone,
            lastMessage: curr.last_message,
            updatedAt: curr.created_at,
            status: curr.status,
            messages: [],
          };
        }
        acc[key].messages.push({
          id: curr.id,
          sender: curr.agent_name,
          content: curr.last_message,
          timestamp: curr.created_at,
        });
        acc[key].lastMessage = curr.last_message;
        acc[key].updatedAt = curr.created_at;
        return acc;
      }, {});

      setConversations(Object.values(grouped));
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from('conversations').insert([
        {
          lead_phone: selectedConversation.leadId,
          last_message: newMessage,
          agent_name: 'bot',
          status: 'In Progress',
          origen: 'unicorn',
          procesar: false,
          modo_respuesta: modoRespuesta,
        },
      ]);

      if (error) throw error;

      setNewMessage('');
      await loadConversations();
    } catch (err) {
      console.error(err);
      setError('Error al enviar el mensaje');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* UI intacta */}
    </Box>
  );
};

export default Conversations;
