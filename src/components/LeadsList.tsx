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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Checkbox,
  Card,
  CardContent,
  CardActions,
  Drawer,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { fetchLeads, createLead, updateLead, deleteLead } from '../api/leadsApi';
import { Lead } from '../interfaces/interfaces';
import { exportLeadsToPDF } from '../utils/pdfExport';
import { exportLeadsToCSV } from '../utils/csvExport';
import axios from 'axios';
import supabase from '../utils/supabaseClient';

// --- Si true, delegamos inserciones a Make (webhook) y evitamos insertar localmente para no duplicar ---
const USE_MAKE_FOR_IMPORTS = true;

// 👉 Webhooks de Make (escenarios separados para cada fuente)
const GOOGLE_MAPS_WEBHOOK = 'https://hook.us2.make.com/qn218ny6kp3xhlb1ca52mmgp5ld6o4ig';
const YELLOW_PAGES_WEBHOOK = 'https://hook.us2.make.com/wkkedv0x6sgwp1ofl8pav3oasrr5pf1z';
const YELP_WEBHOOK = 'https://hook.us2.make.com/9fa58cm8r5pfbh50wrke72isks9kbgpn';
const FACEBOOK_WEBHOOK = 'https://hook.us2.make.com/mp1k8nped3fn323nta754hh8us3w2abb';
const GOOGLEMAPS_APIF_WEBHOOK = 'https://hook.us2.make.com/6ez34wmbj9fksv7dvksphg996z8qau3d';

const LeadsList: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'New',
    priority: 'Medium',
    notes: '',
  });
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);

  // --- Helpers robustos para IDs de autenticación ---
  const getAuthIds = () => {
    const client_id = localStorage.getItem('unicorn_client_id') || undefined;
    let user_id = localStorage.getItem('unicorn_user_id') || undefined;
    if (!user_id) {
      try {
        const u = JSON.parse(localStorage.getItem('unicorn_user') || 'null');
        if (u?.id) user_id = u.id;
      } catch {}
    }

    // 🔍 DEBUG: Ver qué tenemos en localStorage
    console.log('🔍 DEBUG client_id (UUID):', client_id, typeof client_id);
    console.log('🔍 DEBUG user_id:', user_id, typeof user_id);

    // NO convertir client_id - mantener como UUID string
    return { client_id, user_id };
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await fetchLeads();
      setLeads(data);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadLeads();
      setSuccess('Leads refreshed successfully');
    } catch {
      setError('Failed to refresh leads');
    } finally {
      setRefreshing(false);
    }
  };

  // Buscar e importar leads (Google Maps / Yellow Pages) enviando client_id y user_id al WEBHOOK
  const handleSearch = async () => {
    if (!businessType && !location) {
      setError('Please enter business type or location');
      return;
    }

    const { client_id, user_id } = getAuthIds();
    if (!client_id || !user_id) {
      setError('Auth context missing. Please sign in again.');
      return;
    }

    try {
      setLoading(true);

      // Payload que Make recibirá (tu escenario puede consumirlo directo)
      const searchPayload = {
        business_type: businessType,
        location,
        maxItems: 20,
        client_id, // <- multiusuario
        user_id,   // <- multiusuario
      };

      // 🔍 DEBUG: Ver payload de búsqueda
      console.log('🔍 DEBUG searchPayload:', searchPayload);

      const calls: Promise<any>[] = [];
      if (selectedSource === 'all' || selectedSource === 'Google Maps') {
        calls.push(axios.post(GOOGLE_MAPS_WEBHOOK, searchPayload));
      }
      if (selectedSource === 'all' || selectedSource === 'Yellow Pages') {
        calls.push(axios.post(YELLOW_PAGES_WEBHOOK, searchPayload));
      }

      await Promise.allSettled(calls);

      // Si Make inserta, aquí solo refrescamos tabla tras un breve delay para que termine el escenario
      if (USE_MAKE_FOR_IMPORTS) {
        setSuccess('Import requested. We\'ll refresh the list shortly.');
        setTimeout(() => loadLeads(), 2500);
      }
    } catch (err) {
      console.error('Error searching leads:', err);
      setError('Failed to search and import leads');
    } finally {
      setLoading(false);
    }
  };

  // Normaliza teléfonos
  const normalizePhone = (rawPhone: string): string => {
    const cleanedDigits = rawPhone.replace(/\D/g, '');
    if (rawPhone.startsWith('+') && cleanedDigits.length >= 10 && cleanedDigits.length <= 15) {
      return rawPhone;
    }
    return `+${cleanedDigits}`;
  };

 // Activar leads seleccionados → inserta en conversations con client_id y user_id
const handleActivateSelected = async () => {
  if (selectedLeads.length === 0) {
    setError('No leads selected');
    return;
  }

  try {
    setLoading(true);
    
    // 1. Obtener sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('No active session. Please log in again.');
      return;
    }

    // 2. Obtener client_id de la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('client_id, id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData?.client_id) {
      console.error('❌ Error obteniendo client_id:', userError);
      setError('Could not get client_id. Please try logging out and back in.');
      return;
    }

    const client_id = userData.client_id;
    const user_id = userData.id;

    console.log('✅ IDs obtenidos de la DB:', { client_id, user_id });

    // Actualizar localStorage con los valores correctos
    localStorage.setItem('unicorn_client_id', client_id);
    localStorage.setItem('unicorn_user_id', user_id);

    let successCount = 0;
    let errorCount = 0;
    const errorDetails: string[] = [];

    for (const leadId of selectedLeads) {
      const lead = leads.find(l => String(l.id) === String(leadId));
      
      if (!lead) { 
        errorCount++; 
        errorDetails.push(`Lead ${leadId} not found`); 
        continue; 
      }
      
      if (!lead.phone) { 
        errorCount++; 
        errorDetails.push(`Lead ${lead.name} has no phone`); 
        console.log(`❌ Lead sin teléfono: ${lead.name}`);
        continue; 
      }

      const normalizedPhone = normalizePhone(lead.phone);
      const whatsappFormattedPhone = `whatsapp:${normalizedPhone}`;

      const conversationData = {
        lead_phone: whatsappFormattedPhone,
        last_message: '',
        agent_name: 'Unicorn AI',
        status: 'New',
        created_at: new Date().toISOString(),
        origen: 'unicorn',
        procesar: false,
        client_id: client_id,  // ← Valor correcto de la DB
        user_id: user_id,      // ← Valor correcto de la DB
      };

      console.log('📤 Insertando conversación:');
      console.log('   Lead:', lead.name);
      console.log('   Phone:', whatsappFormattedPhone);
      console.log('   client_id:', client_id);
      console.log('   user_id:', user_id);

      try {
        const { data, error } = await supabase
          .from('conversations')
          .insert([conversationData])
          .select();
          
        if (error) { 
          console.error('❌ Supabase error:', error);
          errorCount++; 
          errorDetails.push(`${lead.name}: ${error.message}`); 
          continue; 
        }
        
        if (!data || data.length === 0) { 
          errorCount++; 
          errorDetails.push(`${lead.name}: No data returned from insert`); 
          continue; 
        }
        
        successCount++;
        console.log('✅ Conversación creada para:', lead.name);
      } catch (insertError) {
        console.error('❌ Insert error:', insertError);
        errorCount++;
        errorDetails.push(`${lead.name}: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
      }
    }

    setSelectedLeads([]);
    
    if (successCount > 0) {
      setSuccess(`Successfully activated ${successCount} leads${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
    }
    
    if (errorCount > 0) { 
      console.error('❌ Activation errors:', errorDetails); 
      setError(`Failed to activate ${errorCount} leads. Check console for details.`); 
    }
  } catch (err) {
    console.error('❌ Error activating leads:', err);
    setError(`Failed to activate leads: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
};

  // Dialog open/close
  const handleOpenDialog = (lead: Lead | null = null) => {
    if (lead) {
      setFormData({ ...lead, status: lead.status || 'New', priority: lead.priority || 'Medium' });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: selectedSource === 'all' ? 'Google Maps' : selectedSource,
        status: 'New',
        priority: 'Medium',
        notes: '',
      });
    }
    setOpenDialog(true);
  };
  const handleCloseDialog = () => { setOpenDialog(false); setError(null); };

  // Crear/Actualizar lead (manual) con client_id y user_id
  const handleSubmit = async () => {
    if (!formData.name)  { setError('Name is required.');  return; }
    if (!formData.email) { setError('Email is required.'); return; }
    if (!formData.phone) { setError('Phone is required.'); return; }

    const { client_id, user_id } = getAuthIds();
    if (!client_id || !user_id) {
      setError('Auth context missing. Please sign in again.');
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: formData.source || 'Manual',
        status: formData.status || 'New',
        priority: formData.priority || 'Medium',
        notes: formData.notes || '',
        created_at: new Date().toISOString(),
        client_id, // <- multiusuario
        user_id,   // <- multiusuario
      };

      // 🔍 DEBUG: Ver payload de leads
      console.log('🔍 DEBUG leads payload:', payload);
      console.log('🔍 DEBUG client_id en leads:', payload.client_id, typeof payload.client_id);

      if (formData.id) {
        const { error } = await supabase.from('Leads').update(payload).eq('id', formData.id);
        if (error) {
          console.error('🔍 DEBUG Update error:', error);
          throw error;
        }
        setSuccess('Lead updated successfully');
      } else {
        const { error } = await supabase.from('Leads').insert([payload]);
        if (error) {
          console.error('🔍 DEBUG Insert error:', error);
          throw error;
        }
        setSuccess('Lead created successfully');
      }

      handleCloseDialog();
      await loadLeads();
    } catch (err) {
      console.error('Error saving lead:', err);
      setError('Failed to save lead');
    }
  };

  // Delete
  const handleDeleteLead = async (id: string) => {
    try {
      await deleteLead(id);
      setSuccess('Lead deleted successfully');
      await loadLeads();
      if (selectedLeadDetails && selectedLeadDetails.id === id) {
        setOpenDrawer(false);
        setSelectedLeadDetails(null);
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      setError('Failed to delete lead');
    }
  };

  // Exports
  const handleExportPDF = () => {
    try { exportLeadsToPDF(filteredLeads, 'leads-export.pdf'); setSuccess('Leads exported to PDF successfully'); }
    catch { setError('Failed to export PDF'); }
  };
  const handleExportCSV = () => {
    try { exportLeadsToCSV(filteredLeads, 'leads-export.csv'); setSuccess('Leads exported to CSV successfully'); }
    catch { setError('Failed to export CSV'); }
  };

  // UI helpers
  const handleViewDetails = (lead: Lead) => { setSelectedLeadDetails(lead); setOpenDrawer(true); };
  const handleCloseDrawer = () => { setOpenDrawer(false); setSelectedLeadDetails(null); };
  const handleSendMessage = (phoneNumber: string) => {
    const cleanedForWhatsappUrl = phoneNumber.replace('whatsapp:', '').replace('+', '');
    window.open(`https://wa.me/${cleanedForWhatsappUrl}`, '_blank');
  };

  const getStatusChipProps = (status: string) => {
    let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    let emoji: string;
    switch (status) {
      case 'New': color = 'primary'; emoji = '✨'; break;
      case 'Contacted': color = 'success'; emoji = '📞'; break;
      case 'Pending': color = 'warning'; emoji = '⏳'; break;
      case 'Closed': color = 'default'; emoji = '🔒'; break;
      default: color = 'default'; emoji = '';
    }
    return { color, emoji };
  };

  const getPriorityChipProps = (priority: string) => {
    let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    let emoji: string;
    switch (priority) {
      case 'High': color = 'error'; emoji = '🚨'; break;
      case 'Medium': color = 'warning'; emoji = '⚠️'; break;
      case 'Low': color = 'success'; emoji = '✅'; break;
      default: color = 'default'; emoji = '';
    }
    return { color, emoji };
  };

  // Filtros
  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource;

    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  // Selecciones
  const handleLeadCheckboxChange = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };
  const handleSelectAllLeads = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedLeads(filteredLeads.map(lead => String(lead.id)));
    else setSelectedLeads([]);
  };

  return (
    <Box sx={{ p: 3, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Lead Management</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDF} sx={{ borderRadius: '8px' }}>
            Export PDF
          </Button>
          <Button variant="outlined" startIcon={<CsvIcon />} onClick={handleExportCSV} sx={{ borderRadius: '8px' }}>
            Export CSV
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={refreshing} sx={{ borderRadius: '8px' }}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: '8px' }}>
            New Lead
          </Button>
        </Box>
      </Box>

      {/* Search & Import */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>Search & Import Leads</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Business Type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} variant="outlined" size="medium" sx={{ borderRadius: '8px' }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Location" value={location} onChange={(e) => setLocation(e.target.value)} variant="outlined" size="medium" sx={{ borderRadius: '8px' }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" onClick={handleSearch} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />} sx={{ height: '56px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              Search & Import
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters & bulk actions */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" label="Filter Leads (Name, Phone, Email)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="outlined" sx={{ borderRadius: '8px' }} />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: '8px' }}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Contacted">Contacted</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)} sx={{ borderRadius: '8px' }}>
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Source</InputLabel>
              <Select value={selectedSource} label="Source" onChange={(e) => setSelectedSource(e.target.value)} sx={{ borderRadius: '8px' }}>
                <MenuItem value="all">All Sources</MenuItem>
                <MenuItem value="Google Maps">Google Maps</MenuItem>
                <MenuItem value="Yellow Pages">Yellow Pages</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Checkbox
              onChange={handleSelectAllLeads}
              checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
              indeterminate={selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length}
              sx={{ borderRadius: '4px' }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleActivateSelected}
              disabled={selectedLeads.length === 0 || loading}
              startIcon={<SendIcon />}
              sx={{ borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            >
              Activate Selected ({selectedLeads.length})
            </Button>
          </Grid>
        </Grid>

        {/* Cards */}
        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, width: '100%' }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>Loading leads...</Typography>
            </Box>
          ) : filteredLeads.length === 0 ? (
            <Typography variant="subtitle1" color="text.secondary" sx={{ p: 4 }}>
              No leads found matching your criteria.
            </Typography>
          ) : (
            filteredLeads.slice(0, pageSize).map((lead) => {
              const { color: statusColor, emoji: statusEmoji } = getStatusChipProps(lead.status || 'New');
              const { color: priorityColor, emoji: priorityEmoji } = getPriorityChipProps(lead.priority || 'Medium');

              return (
                <Card
                  key={lead.id}
                  sx={{
                    width: { xs: '100%', sm: 300, md: 320 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 3,
                    borderRadius: '12px',
                    p: 1,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-5px)' },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                        {lead.name}
                      </Typography>
                      <Checkbox
                        checked={selectedLeads.includes(String(lead.id))}
                        onChange={() => handleLeadCheckboxChange(String(lead.id))}
                        sx={{ p: 0 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <a href={`mailto:${lead.email}`} style={{ color: '#1976D2', textDecoration: 'none' }}>
                        {lead.email}
                      </a>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {lead.phone}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${statusEmoji} ${lead.status}`} size="small" color={statusColor} sx={{ borderRadius: '6px' }} />
                      <Chip label={`${priorityEmoji} ${lead.priority}`} size="small" color={priorityColor} sx={{ borderRadius: '6px' }} />
                      <Chip label={lead.source} size="small" variant="outlined" sx={{ borderRadius: '6px' }} />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                    <Button size="small" onClick={() => handleViewDetails(lead)} startIcon={<VisibilityIcon />} sx={{ textTransform: 'none', borderRadius: '8px' }}>
                      View Details
                    </Button>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(lead)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteLead(String(lead.id))} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              );
            })
          )}
        </Box>

        {filteredLeads.length > pageSize && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <FormControl size="small">
              <InputLabel>Results Per Page</InputLabel>
              <Select value={pageSize} label="Results Per Page" onChange={(e) => setPageSize(Number(e.target.value))} sx={{ borderRadius: '8px' }}>
                <MenuItem value={10}>10 per page</MenuItem>
                <MenuItem value={20}>20 per page</MenuItem>
                <MenuItem value={50}>50 per page</MenuItem>
                <MenuItem value={100}>100 per page</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      {/* Dialog New/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{formData.id ? 'Edit Lead' : 'New Lead'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required variant="outlined" sx={{ borderRadius: '8px' }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth required type="email" variant="outlined" sx={{ borderRadius: '8px' }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} fullWidth required variant="outlined" sx={{ borderRadius: '8px' }} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" sx={{ borderRadius: '8px' }}>
                <InputLabel>Source</InputLabel>
                <Select value={formData.source} label="Source" onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
                  <MenuItem value="Google Maps">Google Maps</MenuItem>
                  <MenuItem value="Yellow Pages">Yellow Pages</MenuItem>
                  <MenuItem value="Manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={{ borderRadius: '8px' }}>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="Contacted">Contacted</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={{ borderRadius: '8px' }}>
                <InputLabel>Priority</InputLabel>
                <Select value={formData.priority} label="Priority" onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} fullWidth multiline rows={3} variant="outlined" sx={{ borderRadius: '8px' }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: '8px' }}>
            {formData.id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer Details */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            p: 3,
            borderRadius: '12px 0 0 12px',
            boxShadow: '0 0 15px rgba(0,0,0,0.2)',
          },
        }}
      >
        {selectedLeadDetails && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                Lead Details
              </Typography>
              <IconButton onClick={handleCloseDrawer} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Name:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedLeadDetails.name}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Email:</Typography>
                <Typography variant="body1">
                  <a href={`mailto:${selectedLeadDetails.email}`} style={{ color: '#1976D2', textDecoration: 'none' }}>
                    {selectedLeadDetails.email}
                  </a>
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Phone:</Typography>
                <Typography variant="body1">{selectedLeadDetails.phone}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Source:</Typography>
                <Chip label={selectedLeadDetails.source} size="small" variant="outlined" sx={{ borderRadius: '6px' }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Status:</Typography>
                <Chip
                  label={`${getStatusChipProps(selectedLeadDetails.status || 'New').emoji} ${selectedLeadDetails.status}`}
                  size="small"
                  color={getStatusChipProps(selectedLeadDetails.status || 'New').color}
                  sx={{ borderRadius: '6px' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Priority:</Typography>
                <Chip
                  label={`${getPriorityChipProps(selectedLeadDetails.priority || 'Medium').emoji} ${selectedLeadDetails.priority}`}
                  size="small"
                  color={getPriorityChipProps(selectedLeadDetails.priority || 'Medium').color}
                  sx={{ borderRadius: '6px' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Created At:</Typography>
                <Typography variant="body1">{new Date(selectedLeadDetails.created_at || '').toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Notes:</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedLeadDetails.notes || 'N/A'}</Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => { handleOpenDialog(selectedLeadDetails); handleCloseDrawer(); }}
                sx={{ borderRadius: '8px' }}
              >
                Edit Lead
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => handleSendMessage(selectedLeadDetails.phone || '')}
                disabled={!selectedLeadDetails.phone}
                sx={{ borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
              >
                Send Message
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%', borderRadius: '8px' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ width: '100%', borderRadius: '8px' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadsList;
