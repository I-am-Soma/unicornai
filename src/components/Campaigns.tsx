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
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  AccountBalanceWallet as WalletIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import supabase from '../utils/supabaseClient';
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '../api/leadsApi';
import { CampaignData } from '../interfaces/interfaces';

const Campaigns: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 💰 Wallet
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [openTopup, setOpenTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(50);
  const [walletLoading, setWalletLoading] = useState(false);

  // 📝 Campaign dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<CampaignData | null>(null);
  const [formData, setFormData] = useState<Partial<CampaignData>>({
    name: '',
    description: '',
    budget: 0,
    status: 'Active',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadWallet(), loadCampaigns()]);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setWalletBalance(Number(data.balance));
    }
  };

  const loadCampaigns = async () => {
    const data = await fetchCampaigns();
    setCampaigns(
      data.map((c) => ({
        ...c,
        spend: c.spend || 0,
      }))
    );
  };

  // 💳 Stripe Top-up
  const handleTopup = async () => {
    if (topupAmount < 5) {
      setError('Minimum top-up is $5');
      return;
    }

    setWalletLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-topup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ amount: topupAmount }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Stripe error');

      window.location.href = json.url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWalletLoading(false);
    }
  };

  // 📝 Campaign CRUD
  const openNewCampaign = () => {
    setCurrentCampaign(null);
    setFormData({ name: '', description: '', budget: 0, status: 'Active' });
    setOpenDialog(true);
  };

  const openEditCampaign = (c: CampaignData) => {
    setCurrentCampaign(c);
    setFormData(c);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.budget || formData.budget <= 0) {
      setError('Invalid campaign data');
      return;
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
    if (!confirm('Delete campaign?')) return;
    await deleteCampaign(id);
    setSuccess('Campaign deleted');
    loadCampaigns();
  };

  const toggleCampaign = async (c: CampaignData) => {
    await updateCampaign(c.id!, {
      status: c.status === 'Active' ? 'Paused' : 'Active',
    });
    loadCampaigns();
  };

  const totalSpent = campaigns.reduce((s, c) => s + (c.spend || 0), 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={isMobile ? 2 : 3}>
      {/* WALLET */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle2">Wallet Balance</Typography>
            <Typography variant="h3">${walletBalance.toFixed(2)}</Typography>
            <Typography variant="caption">
              Total spent: ${totalSpent.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} textAlign={isMobile ? 'center' : 'right'}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenTopup(true)}
              fullWidth={isMobile}
            >
              Add Funds
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Campaigns</Typography>
        <Box>
          <IconButton onClick={loadAll}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNewCampaign}>
            New Campaign
          </Button>
        </Box>
      </Box>

      {/* LIST */}
      <Grid container spacing={3}>
        {campaigns.map((c) => {
          const percent = (c.spend / c.budget) * 100;

          return (
            <Grid item xs={12} md={4} key={c.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">{c.name}</Typography>
                    <Chip label={c.status} />
                  </Box>

                  {c.description && (
                    <Typography variant="body2" color="text.secondary">
                      {c.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2">
                    Budget: ${c.budget.toFixed(2)}
                  </Typography>

                  <LinearProgress value={percent} variant="determinate" sx={{ my: 1 }} />

                  <Typography variant="caption">
                    ${c.spend.toFixed(2)} spent
                  </Typography>

                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button size="small" onClick={() => toggleCampaign(c)}>
                      {c.status === 'Active' ? <PauseIcon /> : <PlayIcon />}
                    </Button>
                    <Button size="small" onClick={() => openEditCampaign(c)}>
                      <EditIcon />
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(c.id!)}>
                      <DeleteIcon />
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* TOPUP */}
      <Dialog open={openTopup} onClose={() => setOpenTopup(false)}>
        <DialogTitle>Add Funds</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Amount"
            value={topupAmount}
            onChange={(e) => setTopupAmount(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTopup(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTopup} disabled={walletLoading}>
            Add ${topupAmount}
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
