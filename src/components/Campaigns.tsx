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
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '../api/leadsApi';
import { CampaignData } from '../interfaces/interfaces';

const COST_PER_UNIT = 2; // USD por interacción (mock)

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 🔑 WALLET (luego se conecta a Stripe)
  const [walletBalance, setWalletBalance] = useState<number>(2500);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<CampaignData | null>(null);
  const [formData, setFormData] = useState<Partial<CampaignData>>({
    name: '',
    description: '',
    budget: 0,
    status: 'Active',
    spend: 0,
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  // ⏱️ Simulación de gasto real
  useEffect(() => {
    const interval = setInterval(() => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.status !== 'Active') return c;
          if ((c.spend || 0) >= c.budget) return { ...c, status: 'Completed' };

          return {
            ...c,
            spend: Math.min((c.spend || 0) + COST_PER_UNIT, c.budget),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await fetchCampaigns();
      setCampaigns(
        data.map((c) => ({ ...c, spend: c.spend || 0 }))
      );
    } catch {
      setError('Error loading campaigns');
    } finally {
      setLoading(false);
    }
  };

  const openNewCampaign = () => {
    setCurrentCampaign(null);
    setFormData({
      name: '',
      description: '',
      budget: 0,
      spend: 0,
      status: 'Active',
    });
    setOpenDialog(true);
  };

  const openEditCampaign = (campaign: CampaignData) => {
    setCurrentCampaign(campaign);
    setFormData(campaign);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) return setError('Campaign name required');
    if (!formData.budget || formData.budget <= 0)
      return setError('Budget must be greater than 0');

    const assignedBudget = campaigns
      .filter((c) => c.id !== currentCampaign?.id)
      .reduce((sum, c) => sum + c.budget, 0);

    if (assignedBudget + formData.budget > walletBalance) {
      return setError('Insufficient wallet balance');
    }

    try {
      if (currentCampaign) {
        await updateCampaign(currentCampaign.id!, formData);
        setSuccess('Campaign updated');
      } else {
        await createCampaign(formData as CampaignData);
        setSuccess('Campaign created');
      }
      setOpenDialog(false);
      loadCampaigns();
    } catch {
      setError('Failed to save campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this campaign?')) return;
    await deleteCampaign(id);
    setSuccess('Campaign deleted');
    loadCampaigns();
  };

  const totalAllocated = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const remainingWallet = walletBalance - totalAllocated;

  return (
    <Box sx={{ p: 3 }}>
      {/* WALLET */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <WalletIcon color="success" />
          <Box>
            <Typography variant="subtitle2">Available Balance</Typography>
            <Typography variant="h4" color="success.main">
              ${remainingWallet.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Campaigns</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNewCampaign}>
          New Campaign
        </Button>
      </Box>

      {/* LIST */}
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((c) => {
            const percent = (c.spend / c.budget) * 100;

            return (
              <Grid item xs={12} md={4} key={c.id}>
                <Paper sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">{c.name}</Typography>
                    <Box>
                      <IconButton onClick={() => openEditCampaign(c)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(c.id!)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {c.description}
                  </Typography>

                  <Typography variant="subtitle2">Budget</Typography>
                  <Typography variant="h6">${c.budget}</Typography>

                  <LinearProgress
                    value={percent}
                    variant="determinate"
                    sx={{ my: 1 }}
                  />

                  <Typography variant="caption">
                    ${c.spend} spent · ${c.budget - c.spend} remaining
                  </Typography>

                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Button size="small" startIcon={<BarChartIcon />}>
                      Performance
                    </Button>
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor:
                          c.status === 'Active'
                            ? 'success.main'
                            : c.status === 'Paused'
                            ? 'warning.main'
                            : 'info.main',
                        color: 'white',
                        px: 1,
                        borderRadius: 1,
                      }}
                    >
                      {c.status}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* DIALOG */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>
          {currentCampaign ? 'Edit Campaign' : 'New Campaign'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            sx={{ mt: 2 }}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Description"
            sx={{ mt: 2 }}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <TextField
            fullWidth
            type="number"
            label="Budget"
            sx={{ mt: 2 }}
            value={formData.budget}
            onChange={(e) =>
              setFormData({ ...formData, budget: Number(e.target.value) })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* FEEDBACK */}
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Campaigns;
