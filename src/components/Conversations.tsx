import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { fetchConversations } from '../api/leadsApi';

interface Conversation {
  id: string;
  lead_phone: string;
  last_message: string;
  agent_name: string;
  status: string;
  created_at: string;
  origen: string;
}

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchConversations();
      console.log('✅ Conversations loaded:', data);
      setConversations(data || []);
    } catch (err) {
      console.error('❌ Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Conversations
      </Typography>

      {conversations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No conversations found. Activate leads to start conversations.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Agent</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Message</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Source</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conversations.map((conv) => (
                <TableRow key={conv.id} hover>
                  <TableCell>{conv.lead_phone}</TableCell>
                  <TableCell>{conv.agent_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={conv.status}
                      size="small"
                      color={conv.status === 'New' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{conv.last_message || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={conv.origen} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {new Date(conv.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Conversations;
