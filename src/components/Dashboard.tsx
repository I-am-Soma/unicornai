import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Alert,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import StatCard from "./StatCard";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { Period } from "./Header";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Campaign as CampaignIcon,
  VoiceChat as VoiceIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Message as MessageIcon,
} from "@mui/icons-material";
import supabase from '../utils/supabaseClient';
import { fetchLeads, fetchCampaigns, fetchConversations } from '../api/leadsApi';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface DashboardProps {
  period: Period;
}

const Dashboard: React.FC<DashboardProps> = ({ period }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading dashboard data...');

      // Intentar cargar con RPC primero
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_data");
      
      if (rpcError) {
        console.warn('⚠️ RPC get_user_data failed:', rpcError.message);
        console.log('ℹ️ Falling back to direct queries...');
      } else if (rpcData && rpcData.length > 0) {
        console.log('✅ RPC data loaded:', rpcData[0]);
        setUserData(rpcData[0]);
      }

      // Cargar datos directamente también (como fallback o complemento)
      const [leadsData, campaignsData, conversationsData] = await Promise.all([
        fetchLeads(),
        fetchCampaigns(),
        fetchConversations(),
      ]);

      console.log('✅ Dashboard data loaded:', {
        leads: leadsData.length,
        campaigns: campaignsData.length,
        conversations: conversationsData.length
      });

      setLeads(leadsData);
      setCampaigns(campaignsData);
      setConversations(conversationsData);

      // Si no hay userData del RPC, construirlo manualmente
      if (!userData) {
        setUserData({
          leads_count: leadsData.length,
          campaigns_count: campaignsData.length,
          conversations_count: conversationsData.length,
        });
      }
    } catch (err) {
      console.error("❌ Error loading dashboard:", err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas de leads
  const calculateLeadMetrics = () => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'New').length;
    const contactedLeads = leads.filter(l => l.status === 'Contacted').length;
    const closedLeads = leads.filter(l => l.status === 'Closed').length;
    const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      closedLeads,
      conversionRate: `${conversionRate}%`,
    };
  };

  const metrics = calculateLeadMetrics();

  const leadStats = [
    { 
      title: "Total Leads", 
      value: userData?.leads_count || metrics.totalLeads || 0, 
      color: "#6366f1" 
    },
    { 
      title: "Conversion Rate", 
      value: metrics.conversionRate, 
      color: "#ec4899" 
    },
    { 
      title: "New Leads", 
      value: metrics.newLeads, 
      color: "#8b5cf6" 
    },
    { 
      title: "Contacted Leads", 
      value: metrics.contactedLeads, 
      color: "#06b6d4" 
    },
  ];

  const campaignStats = [
    { 
      title: "Campaigns", 
      value: userData?.campaigns_count || campaigns.length || 0, 
      color: "#10b981" 
    },
    { 
      title: "Conversations", 
      value: userData?.conversations_count || conversations.length || 0, 
      color: "#3b82f6" 
    },
    { 
      title: "Closed Deals", 
      value: metrics.closedLeads, 
      color: "#f59e0b" 
    },
    { 
      title: "Active Chats", 
      value: conversations.filter(c => c.status !== 'Closed').length, 
      color: "#14b8a6" 
    },
  ];

  // Generar datos de tendencias basados en created_at de leads
  const getLeadTrendsData = () => {
    if (leads.length === 0) {
      return {
        labels: ['No data'],
        datasets: [{
          label: "New Leads",
          data: [0],
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.4,
        }],
      };
    }

    // Agrupar leads por fecha
    const leadsByDate: { [key: string]: number } = {};
    leads.forEach(lead => {
      if (!lead.created_at) return;
      const date = new Date(lead.created_at).toLocaleDateString();
      leadsByDate[date] = (leadsByDate[date] || 0) + 1;
    });

    const sortedDates = Object.keys(leadsByDate).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Tomar últimos 7 días
    const last7Days = sortedDates.slice(-7);

    return {
      labels: last7Days,
      datasets: [{
        label: "New Leads",
        data: last7Days.map(date => leadsByDate[date]),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
      }],
    };
  };

  // Distribución de fuentes de leads
  const getLeadSourcesData = () => {
    if (leads.length === 0) {
      return {
        labels: ['No data'],
        datasets: [{
          data: [1],
          backgroundColor: ["#e0e0e0"],
          borderWidth: 0,
        }],
      };
    }

    const sourceCount: { [key: string]: number } = {};
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });

    const sources = Object.entries(sourceCount);
    
    return {
      labels: sources.map(([source]) => source),
      datasets: [{
        data: sources.map(([, count]) => count),
        backgroundColor: ["#6366f1", "#ec4899", "#8b5cf6", "#06b6d4", "#10b981"],
        borderWidth: 0,
      }],
    };
  };

  // Quick actions for mobile FAB
  const fabActions = [
    {
      icon: <PersonAddIcon />,
      name: 'Add Lead',
      onClick: () => {
        setFabOpen(false);
        navigate('/leads');
      },
    },
    {
      icon: <CampaignIcon />,
      name: 'New Campaign',
      onClick: () => {
        setFabOpen(false);
        navigate('/campaigns');
      },
    },
    {
      icon: <RefreshIcon />,
      name: 'Refresh Data',
      onClick: () => {
        setFabOpen(false);
        loadDashboardData();
      },
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: isMobile ? 2 : 3,
        pb: isMobile ? 10 : 3, // Extra padding bottom para mobile nav
      }}
      data-tour="dashboard"
    >
      {/* Header - Desktop */}
      {!isMobile && (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Dashboard Overview</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadDashboardData}
              size="small"
              sx={{ minHeight: 44 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/campaigns")}
              size="small"
              sx={{ minHeight: 44 }}
            >
              Create Campaign
            </Button>
          </Box>
        </Box>
      )}

      {/* Header - Mobile */}
      {isMobile && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Mobile: Summary Cards Carousel */}
      {isMobile && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 2,
              pb: 2,
              '&::-webkit-scrollbar': {
                height: 6,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 3,
              },
            }}
          >
            <Card
              sx={{
                minWidth: 280,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GroupIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {metrics.totalLeads}
                    </Typography>
                    <Typography variant="body2">Total Leads</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                    <Typography variant="caption">New: {metrics.newLeads}</Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                    <Typography variant="caption">Rate: {metrics.conversionRate}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                minWidth: 280,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MessageIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {conversations.length}
                    </Typography>
                    <Typography variant="body2">Active Chats</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                    <Typography variant="caption">Campaigns: {campaigns.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                minWidth: 280,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {metrics.conversionRate}
                    </Typography>
                    <Typography variant="body2">Conversion Rate</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                    <Typography variant="caption">Closed: {metrics.closedLeads}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Desktop: Lead Metrics Grid */}
      {!isMobile && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Lead Metrics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {leadStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StatCard {...stat} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Desktop: Campaign Metrics */}
      {!isMobile && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 4 }}>
            Campaign & Conversation Metrics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {campaignStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StatCard {...stat} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Charts - Responsive */}
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: isMobile ? 2 : 3,
              borderRadius: isMobile ? 3 : 2,
            }} 
            elevation={3}
          >
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
              Lead Acquisition Trends
            </Typography>
            <Box sx={{ height: isMobile ? 250 : 300 }}>
              <Line
                data={getLeadTrendsData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        font: {
                          size: isMobile ? 10 : 12,
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                        font: {
                          size: isMobile ? 10 : 12,
                        },
                      },
                      title: {
                        display: !isMobile,
                        text: "Number of Leads",
                      },
                    },
                    x: {
                      ticks: {
                        font: {
                          size: isMobile ? 10 : 12,
                        },
                      },
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: isMobile ? 2 : 3,
              borderRadius: isMobile ? 3 : 2,
            }} 
            elevation={3}
          >
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
              Lead Sources
            </Typography>
            <Box sx={{ height: isMobile ? 250 : 300 }}>
              <Doughnut
                data={getLeadSourcesData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        font: {
                          size: isMobile ? 10 : 12,
                        },
                        padding: isMobile ? 8 : 10,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Desktop: Quick Stats Summary */}
      {!isMobile && (
        <Paper sx={{ p: 3, mt: 3 }} elevation={3}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Quick Summary
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {metrics.totalLeads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Leads in System
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {conversations.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Conversations
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {metrics.newLeads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New Leads Today
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                  {metrics.conversionRate}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conversion Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Mobile: Floating Action Button with Speed Dial */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Quick actions"
          sx={{
            position: 'fixed',
            bottom: 80, // Above bottom navigation
            right: 16,
            '& .MuiFab-primary': {
              width: 56,
              height: 56,
            },
          }}
          icon={<SpeedDialIcon />}
          open={fabOpen}
          onOpen={() => setFabOpen(true)}
          onClose={() => setFabOpen(false)}
        >
          {fabActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              sx={{
                '& .MuiSpeedDialAction-fab': {
                  minHeight: 44,
                  minWidth: 44,
                },
              }}
            />
          ))}
        </SpeedDial>
      )}
    </Box>
  );
};

export default Dashboard;
