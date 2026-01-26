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

const COST_PER_INTERACTION = 0.50; // $0.50 por lead/mensaje

const Campaigns: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 💰 WALLET STATE
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [openTopup, setOpenTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(50);

  // 📝 CAMPAIGN DIALOG
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
    loadData();
  }, []);

  // ⏱️ Simulación de gasto real (cada 5 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.status !== 'Active') return c;
          if ((c.spend || 0) >= c.budget) {
            handlePauseCampaign(c.id!, true);
            return { ...c, status: 'Paused' };
          }

          const newSpend = Math.min(
            (c.spend || 0) + COST_PER_INTERACTION,
            c.budget
          );

          // Decrementar wallet
          if (newSpend > (c.spend || 0)) {
            decrementWallet(COST_PER_INTERACTION, c.id!);
          }

          return { ...c, spend: newSpend };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadWallet(), loadCampaigns()]);
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // 💰 LOAD WALLET
  const loadWallet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setWalletBalance(data?.balance || 0);
    } catch (err) {
      console.error('Error loading wallet:', err);
    }
  };

  // 📊 LOAD CAMPAIGNS
  const loadCampaigns = async () => {
    try {
      const data = await fetchCampaigns();
      setCampaigns(data.map((c) => ({ ...c, spend: c.spend || 0 })));
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
  };

  // 💸 DECREMENT WALLET
  const decrementWallet = async (amount: number, campaignId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Llamar RPC para decrementar
      const { data, error } = await supabase.rpc('decrement_wallet_balance', {
        uid: user.id,
        amount,
      });

      if (error) throw error;

      if (data === false) {
        // Sin fondos suficientes - pausar campaña
        setError('Insufficient funds - campaign paused');
        handlePauseCampaign(campaignId, true);
      }

      // Registrar transacción
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'spend',
        status: 'completed',
        campaign_id: campaignId,
        description: `Campaign spend: ${campaignId}`,
      });

      // Actualizar balance local
      loadWallet();
    } catch (err) {
      console.error('Error decrementing wallet:', err);
    }
  };

  // 💳 TOP-UP WALLET
  const handleTopup = async () => {
    if (topupAmount < 5) {
      setError('Minimum top-up is $5');
      return;
    }

    setWalletLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
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

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      // Redirigir a Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate top-up');
    } finally {
      setWalletLoading(false);
    }
  };

  // 📝 CAMPAIGN CRUD
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

    const totalAllocated = campaigns
      .filter((c) => c.id !== currentCampaign?.id)
      .reduce((sum, c) => sum + c.budget, 0);

    if (totalAllocated + formData.budget > walletBalance) {
      return setError('Insufficient wallet balance for this budget');
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
    } catch (err) {
      setError('Failed to save campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await deleteCampaign(id);
      setSuccess('Campaign deleted');
      loadCampaigns();
    } catch (err) {
      setError('Failed to delete campaign');
    }
  };

  const handlePauseCampaign = async (id: string, pause: boolean) => {
    try {
      await updateCampaign(id, { status: pause ? 'Paused' : 'Active' });
      loadCampaigns();
      setSuccess(pause ? 'Campaign paused' : 'Campaign activated');
    } catch (err) {
      setError('Failed to update campaign status');
    }
  };

  const totalAllocated = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
  const remainingWallet = walletBalance - totalAllocated;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3, pb: isMobile ? 10 : 3 }}>
      {/* 💰 WALLET HEADER */}
      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 2 : 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={2} mb={isMobile ? 2 : 0}>
              <WalletIcon sx={{ fontSize: isMobile ? 40 : 48 }} />
              <Box>
                <Typography variant={isMobile ? 'body2' : 'subtitle2'} sx={{ opacity: 0.9 }}>
                  Available Balance
                </Typography>
                <Typography variant={isMobile ? 'h4' : 'h3'} sx={{ fontWeight: 700 }}>
                  ${walletBalance.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Allocated: ${totalAllocated.toFixed(2)} • Spent: ${totalSpent.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: isMobile ? 'center' : 'right' }}>
            <Button
              variant="contained"
              size={isMobile ? 'large' : 'medium'}
              onClick={() => setOpenTopup(true)}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                minHeight: isMobile ? 56 : 44,
                fontSize: isMobile ? '1.125rem' : '1rem',
                '&:hover': { bgcolor: 'grey.100' },
              }}
              startIcon={<AddIcon />}
              fullWidth={isMobile}
            >
              Add Funds
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 📊 STATS CARDS */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BarChartIcon color="primary" fontSize={isMobile ? 'medium' : 'large'} />
                <Typography variant={isMobile ? 'body2' : 'subtitle2'} color="text.secondary">
                  Active
                </Typography>
              </Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600}>
                {campaigns.filter(c => c.status === 'Active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon color="success" fontSize={isMobile ? 'medium' : 'large'} />
                <Typography variant={isMobile ? 'body2' : 'subtitle2'} color="text.secondary">
                  Total Spent
                </Typography>
              </Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600} color="success.main">
                ${totalSpent.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <MoneyIcon color="warning" fontSize={isMobile ? 'medium' : 'large'} />
                <Typography variant={isMobile ? 'body2' : 'subtitle2'} color="text.secondary">
                  Allocated
                </Typography>
              </Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600} color="warning.main">
                ${totalAllocated.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WalletIcon color="info" fontSize={isMobile ? 'medium' : 'large'} />
                <Typography variant={isMobile ? 'body2' : 'subtitle2'} color="text.secondary">
                  Remaining
                </Typography>
              </Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600} color="info.main">
                ${remainingWallet.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 📋 HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>
          Campaigns ({campaigns.length})
        </Typography>
        <Box display="flex" gap={1}>
          <IconButton onClick={loadData} sx={{ minWidth: 44, minHeight: 44 }}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openNewCampaign}
            size={isMobile ? 'medium' : 'small'}
            sx={{ minHeight: isMobile ? 48 : 36 }}
          >
            {isMobile ? 'New' : 'New Campaign'}
          </Button>
        </Box>
      </Box>

      {/* 📱 CAMPAIGNS LIST */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {campaigns.map((campaign) => {
          const percent = (campaign.spend / campaign.budget) * 100;
          const remaining = campaign.budget - campaign.spend;

          return (
            <Grid item xs={12} md={6} lg={4} key={campaign.id}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flexGrow={1}>
                      <Typography variant={isMobile ? 'h6' : 'h6'} fontWeight={600} mb={0.5}>
                        {campaign.name}
                      </Typography>
                      <Chip
                        label={campaign.status}
                        size="small"
                        color={
                          campaign.status === 'Active'
                            ? 'success'
                            : campaign.status === 'Paused'
                            ? 'warning'
                            : 'default'
                        }
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.813rem' }}
                      />
                    </Box>
                    <Box display="flex" gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => handlePauseCampaign(campaign.id!, campaign.status === 'Active')}
                        sx={{ minWidth: 36, minHeight: 36 }}
                      >
                        {campaign.status === 'Active' ? <PauseIcon /> : <PlayIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openEditCampaign(campaign)}
                        sx={{ minWidth: 36, minHeight: 36 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(campaign.id!)}
                        sx={{ minWidth: 36, minHeight: 36 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Description */}
                  {campaign.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, fontSize: isMobile ? '0.875rem' : '0.875rem' }}
                    >
                      {campaign.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Budget */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Budget
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${campaign.budget.toFixed(2)}
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min(percent, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: percent >= 100 ? 'error.main' : 'success.main',
                        },
                      }}
                    />

                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="caption" color="success.main">
                        ${campaign.spend.toFixed(2)} spent
                      </Typography>
                      <Typography variant="caption" color={remaining < 10 ? 'error.main' : 'text.secondary'}>
                        ${remaining.toFixed(2)} left
                      </Typography>
                    </Box>
                  </Box>

                  {/* Performance */}
                  <Button
                    size="small"
                    startIcon={<BarChartIcon />}
                    fullWidth
                    variant="outlined"
                    sx={{ minHeight: isMobile ? 44 : 36 }}
                  >
                    View Performance
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {campaigns.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <BarChartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={1}>
                No campaigns yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create your first campaign to start reaching customers
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openNewCampaign}>
                Create Campaign
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* 💳 TOP-UP DIALOG */}
      <Dialog open={openTopup} onClose={() => setOpenTopup(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Funds to Wallet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
            Add funds to your advertising wallet. Minimum top-up is $5.
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            label="Amount (USD)"
            value={topupAmount}
            onChange={(e) => setTopupAmount(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              sx: { minHeight: isMobile ? 56 : 48 },
            }}
            sx={{ mt: 2 }}
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[10, 25, 50, 100, 500].map((amount) => (
              <Chip
                key={amount}
                label={`$${amount}`}
                onClick={() => setTopupAmount(amount)}
                color={topupAmount === amount ? 'primary' : 'default'}
                sx={{ minHeight: 36 }}
              />
            ))}
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            You'll be redirected to Stripe Checkout to complete your payment securely.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenTopup(false)} sx={{ minHeight: isMobile ? 48 : 36 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTopup}
            disabled={walletLoading || topupAmount < 5}
            startIcon={walletLoading ? <CircularProgress size={20} /> : <MoneyIcon />}
            sx={{ minHeight: isMobile ? 48 : 36 }}
          >
            {walletLoading ? 'Processing...' : `Add $${topupAmount}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📝 CAMPAIGN DIALOG */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {currentCampaign ? 'Edit Campaign' : 'New Campaign'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Campaign Name"
            sx={{ mt: 2 }}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            InputProps={{ sx: { minHeight: isMobile ? 56 : 48 } }}
          />
          <TextField
            fullWidth
            label="Description"
            sx={{ mt: 2 }}
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            fullWidth
            type="number"
            label="Budget"
            sx={{ mt: 2 }}
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              sx: { minHeight: isMobile ? 56 : 48 },
            }}
            helperText={`Available: $${remainingWallet.toFixed(2)}`}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              sx={{ minHeight: isMobile ? 56 : 48 }}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Paused">Paused</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{ minHeight: isMobile ? 48 : 36 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ minHeight: isMobile ? 48 : 36 }}
          >
            {currentCampaign ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FEEDBACK */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Campaigns;
