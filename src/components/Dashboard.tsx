import React, { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography, CircularProgress, Button, Alert } from "@mui/material";
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
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
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
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Dashboard Overview</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/campaigns")}
            size="small"
          >
            Create Campaign
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Lead Metrics */}
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

      {/* Campaign Metrics */}
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

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }} elevation={3}>
            <Typography variant="h6" gutterBottom>
              Lead Acquisition Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={getLeadTrendsData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                      title: {
                        display: true,
                        text: "Number of Leads",
                      },
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }} elevation={3}>
            <Typography variant="h6" gutterBottom>
              Lead Sources Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Doughnut
                data={getLeadSourcesData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Stats Summary */}
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
    </Box>
  );
};

export default Dashboard;
