import React, { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography, CircularProgress, Button } from "@mui/material";
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
import { Add as AddIcon } from "@mui/icons-material";
import supabase from '../utils/supabaseClient';

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
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, [period]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_user_data");
      if (error) {
        console.error("Error cargando user data:", error.message);
      } else {
        setUserData(data?.[0]);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setLoading(false);
    }
  };

  const leadStats = [
    { title: "Total Leads", value: userData?.leads_count || 0, color: "#6366f1" },
    { title: "Conversion Rate", value: "—", color: "#ec4899" }, // puedes calcularla después si la guardas
    { title: "New Leads", value: "—", color: "#8b5cf6" }, // si quieres contarlos por estado
    { title: "Contacted Leads", value: "—", color: "#06b6d4" },
  ];

  const campaignStats = [
    { title: "Campaigns", value: userData?.campaigns_count || 0, color: "#10b981" },
    { title: "Conversations", value: userData?.conversations_count || 0, color: "#3b82f6" },
    { title: "Amount Spent", value: "$0.00", color: "#f59e0b" }, // placeholder
    { title: "Clicks", value: 0, color: "#14b8a6" },
  ];

  // Dummy charts por ahora (puedes conectarlos a datos reales si tienes la info en Supabase)
  const getLeadTrendsData = () => {
    return {
      labels: ["2025-01-01", "2025-01-02", "2025-01-03"],
      datasets: [
        {
          label: "New Leads",
          data: [5, 7, 4],
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getLeadSourcesData = () => {
    return {
      labels: ["Google", "Facebook", "LinkedIn", "Direct"],
      datasets: [
        {
          data: [10, 8, 5, 2],
          backgroundColor: ["#6366f1", "#ec4899", "#8b5cf6", "#06b6d4"],
          borderWidth: 0,
        },
      ],
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
        <Typography variant="h5">Dashboard Overview</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => navigate("/campaigns")}
          size="small"
        >
          Create Campaign
        </Button>
      </Box>

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
        Campaign Metrics
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
          <Paper sx={{ p: 2 }}>
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
          <Paper sx={{ p: 2 }}>
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
    </Box>
  );
};

export default Dashboard;
