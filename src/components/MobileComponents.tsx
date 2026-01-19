// ============================================================================
// EJEMPLO DE IMPLEMENTACIÓN EN LeadsList.tsx
// ============================================================================
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import {
  MobileLayout,
  SwipeableCard,
  TouchButton,
  VoiceInput,
} from './MobileComponents';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  priority: string;
}

const LeadsListMobile: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      status: 'New',
      priority: 'High',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1987654321',
      status: 'Contacted',
      priority: 'Medium',
    },
  ]);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openVoiceDialog, setOpenVoiceDialog] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Handlers
  const handleAddLead = () => {
    setOpenAddDialog(true);
  };

  const handleSaveLead = () => {
    const lead: Lead = {
      id: Date.now().toString(),
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      status: 'New',
      priority: 'Medium',
    };
    setLeads([...leads, lead]);
    setOpenAddDialog(false);
    setNewLead({ name: '', email: '', phone: '', notes: '' });
  };

  const handleDeleteLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleEditLead = (id: string) => {
    console.log('Edit lead:', id);
    // Implementar edición
  };

  const handleVoiceNote = () => {
    setOpenVoiceDialog(true);
  };

  const handleVoiceTranscript = (text: string) => {
    setNewLead({ ...newLead, notes: text });
    setOpenVoiceDialog(false);
    setOpenAddDialog(true);
  };

  const handleAddCampaign = () => {
    console.log('Add campaign');
    // Implementar navegación o diálogo
  };

  return (
    <MobileLayout
      showBottomNav={true}
      showFAB={true}
      onAddLead={handleAddLead}
      onAddCampaign={handleAddCampaign}
      onVoiceNote={handleVoiceNote}
    >
      <Box sx={{ p: isMobile ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            My Leads
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {leads.length} active leads
          </Typography>
        </Box>

        {/* Leads List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {leads.map((lead) => (
            <SwipeableCard
              key={lead.id}
              onDelete={() => handleDeleteLead(lead.id)}
              onEdit={() => handleEditLead(lead.id)}
            >
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  overflow: 'visible',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {lead.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={lead.status}
                          size="small"
                          color={lead.status === 'New' ? 'success' : 'info'}
                          sx={{ height: 24, fontSize: '0.75rem' }}
                        />
                        <Chip
                          label={lead.priority}
                          size="small"
                          color={
                            lead.priority === 'High'
                              ? 'error'
                              : lead.priority === 'Medium'
                              ? 'warning'
                              : 'default'
                          }
                          sx={{ height: 24, fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Contact Info */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {lead.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {lead.phone}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <TouchButton
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={() => console.log('Call', lead.id)}
                      startIcon={<PhoneIcon />}
                    >
                      Call
                    </TouchButton>
                    <TouchButton
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => console.log('Message', lead.id)}
                      startIcon={<EmailIcon />}
                    >
                      Message
                    </TouchButton>
                  </Box>
                </CardContent>
              </Card>
            </SwipeableCard>
          ))}
        </Box>

        {/* Empty State */}
        {leads.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <PersonIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" gutterBottom>
              No leads yet
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Tap the + button to add your first lead
            </Typography>
          </Box>
        )}
      </Box>

      {/* Add Lead Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Lead</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              fullWidth
              required
              InputProps={{
                sx: { minHeight: 44 },
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={newLead.email}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              fullWidth
              InputProps={{
                sx: { minHeight: 44 },
              }}
            />
            <TextField
              label="Phone"
              type="tel"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              fullWidth
              InputProps={{
                sx: { minHeight: 44 },
              }}
            />
            <TextField
              label="Notes"
              value={newLead.notes}
              onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <TouchButton
            variant="outlined"
            onClick={() => setOpenAddDialog(false)}
          >
            Cancel
          </TouchButton>
          <TouchButton
            variant="contained"
            onClick={handleSaveLead}
            disabled={!newLead.name || !newLead.email}
          >
            Save Lead
          </TouchButton>
        </DialogActions>
      </Dialog>

      {/* Voice Note Dialog */}
      <Dialog
        open={openVoiceDialog}
        onClose={() => setOpenVoiceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Voice Note</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Record a voice note to quickly capture lead information
            </Typography>
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              placeholder="Tap the microphone to start recording..."
              language="en-US"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <TouchButton
            variant="outlined"
            onClick={() => setOpenVoiceDialog(false)}
          >
            Cancel
          </TouchButton>
        </DialogActions>
      </Dialog>
    </MobileLayout>
  );
};

export default LeadsListMobile;

// ============================================================================
// EJEMPLO DE INTEGRACIÓN EN App.tsx
// ============================================================================

/*
import { MobileLayout } from './components/MobileComponents';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <OnboardingProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    {/* En DESKTOP: mostrar Sidebar normal */}
                    {/* En MOBILE: usar MobileLayout */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                      <Sidebar />
                      {/* ... resto del layout desktop */}
                    </Box>
                    
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      <MobileLayout
                        showBottomNav={true}
                        showFAB={true}
                        onAddLead={() => console.log('Add lead')}
                      >
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/leads" element={<LeadsListMobile />} />
                          {/* ... otras rutas */}
                        </Routes>
                      </MobileLayout>
                    </Box>
                  </AuthGuard>
                }
              />
            </Routes>
          </OnboardingProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
*/
