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
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { fetchCampaigns, createCampaign, updateCampaign, deleteCampaign } from '../api/leadsApi';
import { CampaignData } from '../interfaces/interfaces';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<CampaignData | null>(null);
  const [formData, setFormData] = useState<Partial<CampaignData>>({
    name: '',
    budget: 0,
    description: '',
    status: 'Active',
    clicks: 0,
  });
  const [showPerformance, setShowPerformance] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await fetchCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError('Error loading campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (campaign: CampaignData | null = null) => {
    if (campaign) {
      setCurrentCampaign(campaign);
      setFormData({ ...campaign });
    } else {
      setCurrentCampaign(null);
      setFormData({
        name: '',
        budget: 0,
        description: '',
        status: 'Active',
        clicks: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCampaign(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Please enter a campaign name');
      return;
    }

    if (!formData.budget || formData.budget <= 0) {
      setError('Please set a budget to create a campaign');
      return;
    }

    try {
      if (currentCampaign) {
        await updateCampaign(currentCampaign.id!, formData);
        setSuccessMessage('Campaign updated successfully!');
      } else {
        await createCampaign(formData as CampaignData);
        setSuccessMessage('Campaign created successfully!');
      }
      setShowSuccess(true);
      handleCloseDialog();
      loadCampaigns();
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError('Failed to save campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign(id);
        setSuccessMessage('Campaign deleted successfully!');
        setShowSuccess(true);
        loadCampaigns();
      } catch (err) {
        setError('Failed to delete campaign');
      }
    }
  };

  const handleShowPerformance = (campaign: CampaignData) => {
    setSelectedCampaign(campaign);
    setShowPerformance(true);
  };

  const handleClosePerformance = () => {
    setShowPerformance(false);
    setSelectedCampaign(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Paused': return 'warning';
      case 'Completed': return 'info';
      case 'Planned': return 'default';
      default: return 'default';
    }
  };

  // Calculate budget usage (mock data for now)
  const getBudgetUsage = (campaign: CampaignData) => {
    // Mock calculation - in future this would be based on actual lead costs
    const mockUsedBudget = campaign.clicks * 2; // Assuming $2 per click
    return {
      used: Math.min(mockUsedBudget, campaign.budget),
      available: Math.max(campaign.budget - mockUsedBudget, 0)
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Campaign Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Campaign
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : campaigns.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No campaigns found</Typography>
          <Typography variant="body2" color="text.secondary">Create your first campaign to get started</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} md={6} lg={4} key={campaign.id}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>{campaign.name}</Typography>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(campaign)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteCampaign(campaign.id!)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {campaign.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {campaign.description}
                  </Typography>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Budget</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(campaign.budget)}
                  </Typography>
                  
                  {/* Budget usage indicators */}
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Budget Usage</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(getBudgetUsage(campaign).used)} / {formatCurrency(campaign.budget)}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(getBudgetUsage(campaign).used / campaign.budget) * 100}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="success.main">
                      Available: {formatCurrency(getBudgetUsage(campaign).available)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Button
                    size="small"
                    startIcon={<BarChartIcon />}
                    onClick={() => handleShowPerformance(campaign)}
                  >
                    Performance
                  </Button>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      bgcolor: `${getStatusColor(campaign.status)}.main`,
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    {campaign.status}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentCampaign ? 'Edit Campaign' : 'New Campaign'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Campaign Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder="Enter campaign details (optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                fullWidth
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Paused">Paused</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Planned">Planned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentCampaign ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Performance Dialog */}
      <Dialog open={showPerformance} onClose={handleClosePerformance} maxWidth="md" fullWidth>
        <DialogTitle>
          Campaign Performance: {selectedCampaign?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: ['Clicks', 'Impressions', 'Conversions'],
                    datasets: [{
                      label: 'Performance Metrics',
                      data: [
                        selectedCampaign?.clicks || 0,
                        selectedCampaign?.performance?.impressions || Math.floor(Math.random() * 10000),
                        selectedCampaign?.performance?.conversions || Math.floor(Math.random() * 100)
                      ],
                      backgroundColor: ['#1976D2', '#ec4899', '#8b5cf6']
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePerformance}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Campaigns;
