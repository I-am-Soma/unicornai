import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import supabase from '../utils/supabaseClient';

interface Client {
  id: string;
  nombre: string;
  prompt_inicial: string;
  lista_servicios: string;
  numero_whatsapp: string;
  created_at: string;
  tipo_respuesta?: 'texto' | 'voz';
}

const ClientsConfig: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingClient?.nombre || !editingClient?.numero_whatsapp) {
      setError('Name and WhatsApp number are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .upsert({
          id: editingClient.id,
          nombre: editingClient.nombre,
          prompt_inicial: editingClient.prompt_inicial || '',
          lista_servicios: editingClient.lista_servicios || '',
          numero_whatsapp: editingClient.numero_whatsapp,
          tipo_respuesta: editingClient.tipo_respuesta || 'texto',
          created_at: editingClient.id ? undefined : new Date().toISOString(),
        });

      if (error) throw error;

      setSuccess(editingClient.id ? 'Client updated successfully' : 'Client created successfully');
      setOpenDialog(false);
      setEditingClient(null);
      await loadClients();
    } catch (err: any) {
      console.error('Error saving client:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;

    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
      setSuccess('Client deleted successfully');
      await loadClients();
    } catch (err: any) {
      console.error('Error deleting client:', err);
      setError(err.message);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'nombre',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'prompt_inicial',
      headerName: 'Initial Prompt',
      flex: 2,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value || ''}>
          <Typography noWrap>{params.value}</Typography>
        </Tooltip>
      ),
    },
    {
      field: 'lista_servicios',
      headerName: 'Services',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value || ''}>
          <Typography noWrap>{params.value?.split('\n').length || 0} services</Typography>
        </Tooltip>
      ),
    },
    {
      field: 'numero_whatsapp',
      headerName: 'WhatsApp',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'tipo_respuesta',
      headerName: 'Tipo de Respuesta',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setEditingClient({ ...params.row });
                setOpenDialog(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(params.row.id)} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Client Configuration</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingClient({ nombre: '', prompt_inicial: '', lista_servicios: '', numero_whatsapp: '', tipo_respuesta: 'texto' });
            setOpenDialog(true);
          }}
        >
          New Client
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={clients}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          autoHeight
          loading={loading}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditingClient(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingClient?.id ? 'Edit Client' : 'New Client'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={editingClient?.nombre || ''}
              onChange={(e) => setEditingClient({ ...editingClient, nombre: e.target.value })}
              required
            />
            <TextField
              label="Initial Prompt"
              fullWidth
              multiline
              rows={4}
              value={editingClient?.prompt_inicial || ''}
              onChange={(e) => setEditingClient({ ...editingClient, prompt_inicial: e.target.value })}
              helperText="Define el comportamiento inicial de la IA"
            />
            <TextField
              label="Lista de Servicios"
              fullWidth
              multiline
              rows={4}
              value={editingClient?.lista_servicios || ''}
              onChange={(e) => setEditingClient({ ...editingClient, lista_servicios: e.target.value })}
              helperText="Escribe un servicio por línea, sin formato especial"
            />
            <TextField
              label="WhatsApp Number"
              fullWidth
              value={editingClient?.numero_whatsapp || ''}
              onChange={(e) => setEditingClient({ ...editingClient, numero_whatsapp: e.target.value })}
              required
              helperText="Incluye lada (por ejemplo, +1234567890)"
            />
            <FormControl fullWidth>
              <InputLabel id="tipo-respuesta-label">Tipo de Respuesta</InputLabel>
              <Select
                labelId="tipo-respuesta-label"
                value={editingClient?.tipo_respuesta || 'texto'}
                onChange={(e) =>
                  setEditingClient({
                    ...editingClient,
                    tipo_respuesta: e.target.value as 'texto' | 'voz',
                  })
                }
              >
                <MenuItem value="texto">Texto</MenuItem>
                <MenuItem value="voz">Voz</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setEditingClient(null);
            }}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientsConfig;
