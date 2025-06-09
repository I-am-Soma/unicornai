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
  Card, // New import for card view
  CardContent, // New import for card view
  CardActions, // New import for card view
  Drawer, // New import for lateral drawer
  Chip, // New import for status/priority chips
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon, // New icon for 'View Details'
  Close as CloseIcon, // New icon for closing drawer
} from '@mui/icons-material';
import { fetchLeads, createLead, updateLead, deleteLead } from '../api/leadsApi';
import { Lead } from '../interfaces/interfaces';
import { exportLeadsToPDF } from '../utils/pdfExport';
import { exportLeadsToCSV } from '../utils/csvExport';
import axios from 'axios';
import supabase from '../utils/supabaseClient';

const GOOGLE_MAPS_WEBHOOK = 'https://hook.us2.make.com/qn218ny6kp3xhlb1ca52mmgp5ld6o4ig';
const YELLOW_PAGES_WEBHOOK = 'https://hook.us2.make.com/cvd583e1n9yhle4p1ljlot34ajnger7d';

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
  const [pageSize, setPageSize] = useState<number>(10); // Used for number of cards displayed
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
  const [openDrawer, setOpenDrawer] = useState(false); // State for controlling the drawer
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null); // State for lead details in drawer

  useEffect(() => {
    loadLeads();
  }, []);

  /**
   * Loads leads from the API.
   */
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

  /**
   * Handles refreshing the leads list.
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadLeads();
      setSuccess('Leads refreshed successfully');
    } catch (err) {
      setError('Failed to refresh leads');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handles searching and importing leads from external APIs (Google Maps, Yellow Pages).
   */
  const handleSearch = async () => {
    if (!businessType && !location) {
      setError('Please enter business type or location');
      return;
    }

    try {
      setLoading(true);
      let responses: any[] = [];

      const searchPayload = {
        business_type: businessType,
        location: location,
        maxItems: 20
      };

      if (selectedSource === 'all' || selectedSource === 'Google Maps') {
        try {
          const googleResponse = await axios.post(GOOGLE_MAPS_WEBHOOK, searchPayload);
          if (googleResponse.data && googleResponse.data.results) {
            responses = [...responses, ...googleResponse.data.results.map((result: any) => ({
              ...result,
              source: 'Google Maps'
            }))];
          }
        } catch (error) {
          console.error('Error with Google Maps webhook:', error);
        }
      }

      if (selectedSource === 'all' || selectedSource === 'Yellow Pages') {
        try {
          const ypResponse = await axios.post(YELLOW_PAGES_WEBHOOK, searchPayload);
          if (ypResponse.data && ypResponse.data.results) {
            responses = [...responses, ...ypResponse.data.results.map((result: any) => ({
              ...result,
              source: 'Yellow Pages'
            }))];
          }
        } catch (error) {
          console.error('Error with Yellow Pages webhook:', error);
        }
      }

      for (const lead of responses) {
        await createLead({
          name: lead.name || lead.business_name || '',
          email: lead.email || lead.website || '',
          phone: lead.phone || '',
          source: lead.source,
          status: 'New',
          priority: 'Medium',
          notes: `Found via ${lead.source} search: ${businessType} in ${location}`,
        });
      }

      await loadLeads();
      setSuccess(`Successfully imported ${responses.length} leads`);
    } catch (error) {
      console.error('Error searching leads:', error);
      setError('Failed to search and import leads');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Normalizes a phone number to an international format (e.g., +1XXXXXXXXXX, +52XXXXXXXXXX).
   * It cleans non-digits and attempts to prepend country codes if missing,
   * but respects existing international formats.
   * @param rawPhone The raw phone number string.
   * @returns The normalized phone number.
   */
  const normalizePhone = (rawPhone: string): string => {
    const cleanedDigits = rawPhone.replace(/\D/g, ''); // Remove all non-digit characters

    // If the rawPhone already starts with '+' and the cleanedDigits are of a typical international length (10-15 digits),
    // assume it's already correctly formatted internationally.
    if (rawPhone.startsWith('+') && cleanedDigits.length >= 10 && cleanedDigits.length <= 15) {
      return rawPhone; // Respect the existing international format
    }

    // Otherwise, prepend '+' to the cleaned digits. This is a generic internationalization.
    // It will result in formats like "+6562628157" if input is "6562628157"
    // or "+1234567890" if input is "123-456-7890"
    // This logic avoids assuming a fixed country code like +52 for 10-digit numbers.
    return `+${cleanedDigits}`;
  };

  /**
   * Activates selected leads by inserting them into the 'conversations' table in Supabase.
   * Normalizes phone numbers to 'whatsapp:{normalizedPhone}' format.
   */
  const handleActivateSelected = async () => {
    console.log('🚀 Iniciando activación de leads:', selectedLeads);

    if (selectedLeads.length === 0) {
      setError('No leads selected');
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errorDetails: string[] = [];
      // Removed firstWhatsappUrlOpened = false; as we no longer open WhatsApp automatically

      console.log('📋 Leads disponibles:', leads.map(l => ({ id: l.id, name: l.name, phone: l.phone })));

      for (const leadId of selectedLeads) {
        console.log(`🔍 Procesando lead ID: ${leadId} (tipo: ${typeof leadId})`);

        const lead = leads.find(l => String(l.id) === String(leadId));

        if (!lead) {
          console.error(`❌ Lead no encontrado: ${leadId}`);
          errorCount++;
          errorDetails.push(`Lead ${leadId} not found`);
          continue;
        }

        if (!lead.phone) {
          console.error(`❌ Lead sin teléfono: ${lead.name} (${leadId})`);
          errorCount++;
          errorDetails.push(`Lead ${lead.name} has no phone`);
          continue;
        }

        const normalizedPhone = normalizePhone(lead.phone);
        // Prepend "whatsapp:" to the normalized phone number as required by Twilio for WhatsApp
        const whatsappFormattedPhone = `whatsapp:${normalizedPhone}`;
        console.log(`✅ Lead encontrado: ${lead.name}, teléfono normalizado: ${normalizedPhone}, formato WhatsApp para Twilio: ${whatsappFormattedPhone}`);

        const conversationData = {
          lead_phone: whatsappFormattedPhone, // Use the whatsapp: prefixed format for Twilio
          last_message: "Hola, soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
          agent_name: "Unicorn AI",
          status: "New",
          created_at: new Date().toISOString(),
          origen: "unicorn",
          // Removed 'canal_preferido' field as it's not needed if Twilio relies on 'lead_phone' format
          procesar: false
        };

        console.log('📤 Insertando en conversations:', conversationData);

        try {
          const { data, error } = await supabase
            .from('conversations')
            .insert([conversationData])
            .select(); // Selects the inserted data

          if (error) {
            console.error(`❌ Error de Supabase para lead ${leadId}:`, error);
            errorCount++;
            errorDetails.push(`${lead.name}: ${error.message}`);
            continue;
          }

          if (!data || data.length === 0) {
            console.error(`❌ No se insertaron datos para lead ${leadId}`);
            errorCount++;
            errorDetails.push(`${lead.name}: No data returned from insert`);
            continue;
          }

          console.log(`✅ Conversación creada exitosamente para ${lead.name}:`, data[0]);
          successCount++;

          // Removed the line that opens WhatsApp automatically
          // if (!firstWhatsappUrlOpened) {
          //   const whatsappUrl = `https://wa.me/${normalizedPhone.replace('+', '')}`;
          //   window.open(whatsappUrl, '_blank');
          //   firstWhatsappUrlOpened = true;
          // }

        } catch (insertError) {
          console.error(`❌ Excepción al insertar lead ${leadId}:`, insertError);
          errorCount++;
          errorDetails.push(`${lead.name}: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
        }
      }

      setSelectedLeads([]); // Clear selection after activation

      if (successCount > 0) {
        setSuccess(`Successfully activated ${successCount} leads${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      }

      if (errorCount > 0) {
        console.error('❌ Errores detallados:', errorDetails);
        setError(`Failed to activate ${errorCount} leads. Check console for details.`);
      }

      console.log(`📊 Resumen: ${successCount} exitosos, ${errorCount} fallidos`);

    } catch (error) {
      console.error('❌ Error general activando leads:', error);
      setError(`Failed to activate leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the lead creation/edit dialog.
   * When editing, it precargues the lead's data including status and priority.
   * @param lead The lead object to edit, or null for a new lead.
   */
  const handleOpenDialog = (lead: Lead | null = null) => {
    if (lead) {
      setFormData({
        ...lead,
        // Ensure status and priority are set from the lead object, with fallbacks
        status: lead.status || 'New',
        priority: lead.priority || 'Medium',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: selectedSource === 'all' ? 'Google Maps' : selectedSource, // Default source
        status: 'New', // Default status for new leads
        priority: 'Medium', // Default priority for new leads
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  /**
   * Closes the lead creation/edit dialog.
   */
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null); // Clear any previous errors
  };

  /**
   * Handles submitting the lead form (create or update).
   * Includes validation for required fields.
   */
  const handleSubmit = async () => {
    // Validation for required fields
    if (!formData.name) {
      setError('Name is required.');
      return;
    }
    if (!formData.email) {
      setError('Email is required.');
      return;
    }
    if (!formData.phone) {
      setError('Phone is required.');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: formData.source || 'Manual', // Ensure a default if somehow not selected
        status: formData.status || 'New', // Ensure a default if somehow not selected
        priority: formData.priority || 'Medium', // Ensure a default if somehow not selected
        notes: formData.notes || '',
        created_at: new Date().toISOString(),
      };

      if (formData.id) {
        // Update existing lead
        const { error } = await supabase
          .from('Leads')
          .update(payload)
          .eq('id', formData.id);

        if (error) throw error;

        setSuccess('Lead updated successfully');
      } else {
        // Create new lead
        const { error } = await supabase
          .from('Leads')
          .insert([payload]);

        if (error) throw error;

        setSuccess('Lead created successfully');
      }

      handleCloseDialog(); // Close dialog on success
      await loadLeads(); // Reload leads to reflect changes
    } catch (err) {
      console.error('❌ Error saving lead:', err);
      setError('Failed to save lead');
    }
  };

  /**
   * Handles deleting a lead.
   * @param id The ID of the lead to delete.
   */
  const handleDeleteLead = async (id: string) => {
    // In a real application, you would replace this with a custom confirmation dialog
    // For now, proceeding with deletion for demonstration purposes.
    // As per instructions, avoiding window.confirm directly.
    console.log('Attempting to delete lead with ID:', id);

    try {
      await deleteLead(id);
      setSuccess('Lead deleted successfully');
      await loadLeads();
      // Close drawer if the deleted lead was being viewed
      if (selectedLeadDetails && selectedLeadDetails.id === id) {
        setOpenDrawer(false);
        setSelectedLeadDetails(null);
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      setError('Failed to delete lead');
    }
  };

  /**
   * Exports filtered leads to a PDF document.
   */
  const handleExportPDF = () => {
    try {
      exportLeadsToPDF(filteredLeads, 'leads-export.pdf');
      setSuccess('Leads exported to PDF successfully');
    } catch (error) {
      setError('Failed to export PDF');
    }
  };

  /**
   * Exports filtered leads to a CSV file.
   */
  const handleExportCSV = () => {
    try {
      exportLeadsToCSV(filteredLeads, 'leads-export.csv');
      setSuccess('Leads exported to CSV successfully');
    } catch (error) {
      setError('Failed to export CSV');
    }
  };

  /**
   * Opens the lateral drawer to display full details of a selected lead.
   * @param lead The lead object to display.
   */
  const handleViewDetails = (lead: Lead) => {
    setSelectedLeadDetails(lead);
    setOpenDrawer(true);
  };

  /**
   * Closes the lateral drawer.
   */
  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setSelectedLeadDetails(null);
  };

  /**
   * Opens WhatsApp chat with the given phone number.
   * @param phoneNumber The phone number to send a message to.
   */
  const handleSendMessage = (phoneNumber: string) => {
    // Ensure the number is clean for the WhatsApp URL (no "whatsapp:" prefix, no leading "+")
    const cleanedForWhatsappUrl = phoneNumber.replace('whatsapp:', '').replace('+', '');
    const whatsappUrl = `https://wa.me/${cleanedForWhatsappUrl}`;
    window.open(whatsappUrl, '_blank');
  };

  /**
   * Returns Material UI Chip props (color and emoji) based on lead status.
   * @param status The status string.
   * @returns An object with `color` and `emoji` properties.
   */
  const getStatusChipProps = (status: string) => {
    let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    let emoji: string;
    switch (status) {
      case 'New':
        color = 'primary';
        emoji = '✨'; // Sparkles emoji
        break;
      case 'Contacted':
        color = 'success';
        emoji = '📞'; // Phone emoji
        break;
      case 'Pending':
        color = 'warning';
        emoji = '⏳'; // Hourglass emoji
        break;
      case 'Closed':
        color = 'default';
        emoji = '🔒'; // Lock emoji
        break;
      default:
        color = 'default';
        emoji = '';
    }
    return { color, emoji };
  };

  /**
   * Returns Material UI Chip props (color and emoji) based on lead priority.
   * @param priority The priority string.
   * @returns An object with `color` and `emoji` properties.
   */
  const getPriorityChipProps = (priority: string) => {
    let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    let emoji: string;
    switch (priority) {
      case 'High':
        color = 'error';
        emoji = '🚨'; // Siren emoji
        break;
      case 'Medium':
        color = 'warning';
        emoji = '⚠️'; // Warning emoji
        break;
      case 'Low':
        color = 'success';
        emoji = '✅'; // Checkmark emoji
        break;
      default:
        color = 'default';
        emoji = '';
    }
    return { color, emoji };
  };

  /**
   * Filters the leads based on search term, status, priority, and source.
   */
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

  /**
   * Handles individual lead checkbox changes for multi-selection.
   * @param leadId The ID of the lead whose checkbox was changed.
   */
  const handleLeadCheckboxChange = (leadId: string) => {
    setSelectedLeads(prevSelected =>
      prevSelected.includes(leadId)
        ? prevSelected.filter(id => id !== leadId)
        : [...prevSelected, leadId]
    );
  };

  /**
   * Handles the "Select All" checkbox for leads.
   * @param event The change event from the checkbox.
   */
  const handleSelectAllLeads = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedLeads(filteredLeads.map(lead => String(lead.id)));
    } else {
      setSelectedLeads([]);
    }
  };

  return (
    <Box sx={{ p: 3, fontFamily: 'Inter, sans-serif' }}>
      {/* Header and Global Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Lead Management</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
            sx={{ borderRadius: '8px' }}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<CsvIcon />}
            onClick={handleExportCSV}
            sx={{ borderRadius: '8px' }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ borderRadius: '8px' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: '8px' }}
          >
            New Lead
          </Button>
        </Box>
      </Box>

      {/* Search & Import Leads Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>Search & Import Leads</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Business Type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              variant="outlined"
              size="medium"
              sx={{ borderRadius: '8px' }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              variant="outlined"
              size="medium"
              sx={{ borderRadius: '8px' }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ height: '56px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            >
              Search & Import
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Leads List Filters and Actions */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Filter Leads (Name, Phone, Email)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              sx={{ borderRadius: '8px' }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '8px' }}
              >
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
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
                sx={{ borderRadius: '8px' }}
              >
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
              <Select
                value={selectedSource}
                label="Source"
                onChange={(e) => setSelectedSource(e.target.value)}
                sx={{ borderRadius: '8px' }}
              >
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

        {/* Lead Cards Display */}
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
                    width: { xs: '100%', sm: 300, md: 320 }, // Responsive width
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 3,
                    borderRadius: '12px',
                    p: 1,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
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
                    <Button
                      size="small"
                      onClick={() => handleViewDetails(lead)}
                      startIcon={<VisibilityIcon />}
                      sx={{ textTransform: 'none', borderRadius: '8px' }}
                    >
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
        {/* Pagination for cards */}
        {filteredLeads.length > pageSize && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <FormControl size="small">
              <InputLabel>Results Per Page</InputLabel>
              <Select
                value={pageSize}
                label="Results Per Page"
                onChange={(e) => setPageSize(Number(e.target.value))}
                sx={{ borderRadius: '8px' }}
              >
                <MenuItem value={10}>10 per page</MenuItem>
                <MenuItem value={20}>20 per page</MenuItem>
                <MenuItem value={50}>50 per page</MenuItem>
                <MenuItem value={100}>100 per page</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      {/* New/Edit Lead Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{formData.id ? 'Edit Lead' : 'New Lead'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                variant="outlined"
                sx={{ borderRadius: '8px' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                required
                type="email"
                variant="outlined"
                sx={{ borderRadius: '8px' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                required
                variant="outlined"
                sx={{ borderRadius: '8px' }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" sx={{ borderRadius: '8px' }}>
                <InputLabel>Source</InputLabel>
                <Select
                  value={formData.source}
                  label="Source"
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <MenuItem value="Google Maps">Google Maps</MenuItem>
                  <MenuItem value="Yellow Pages">Yellow Pages</MenuItem>
                  <MenuItem value="Manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={{ borderRadius: '8px' }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
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
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                sx={{ borderRadius: '8px' }}
              />
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

      {/* Lead Details Drawer */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 }, // Responsive width for the drawer
            p: 3,
            borderRadius: '12px 0 0 12px', // Rounded corners on the left side
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
                onClick={() => {
                  handleOpenDialog(selectedLeadDetails);
                  handleCloseDrawer();
                }}
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

      {/* Snackbar for error messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%', borderRadius: '8px' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Snackbar for success messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ width: '100%', borderRadius: '8px' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadsList;
