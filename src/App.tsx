import React, { useState, useEffect, createContext } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Header, { Period } from './components/Header';
import LeadsList from './components/LeadsList';
import Campaigns from './components/Campaigns';
import Conversations from './components/Conversations';
import ReportsAnalytics from './components/ReportsAnalytics';
import Settings from './components/Settings';
import ClientsConfig from './components/ClientsConfig';
import HelpCenter from './components/HelpCenter';
import Login from './components/Login';
import AuthGuard from './components/AuthGuard';
import { getStoredLeads, getStoredCampaigns } from './utils/storage';
import { buscarNegociosSerpApi } from "./utils/api";

// Crear contexto global para almacenar lugares de Google Places
export const PlacesContext = createContext([]);

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976D2', light: '#42a5f5', dark: '#1565c0' },
    secondary: { main: '#ec4899', light: '#f472b6', dark: '#db2777' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: '#1e293b', color: 'white' } },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', borderRadius: '8px' } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600, backgroundColor: '#f8fafc' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          fontSize: '0.75rem',
          padding: '8px 12px',
        },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: '12px' } } },
  },
});

function App() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');
  const [isInitialized, setIsInitialized] = useState(false);
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    async function initializeData() {
      try {
        const leads = getStoredLeads();
        if (leads.length === 0) {
          const { fetchLeads } = await import('./api/leadsApi');
          const demoLeads = await fetchLeads();
          localStorage.setItem('unicorn_leads', JSON.stringify(demoLeads));
        }

        const campaigns = getStoredCampaigns();
        if (campaigns.length === 0) {
          const { fetchCampaigns } = await import('./api/leadsApi');
          const demoCampaigns = await fetchCampaigns();
          localStorage.setItem('unicorn_campaigns', JSON.stringify(demoCampaigns));
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    }

    initializeData();
  }, []);

  useEffect(() => {
    async function loadPlaces() {
      try {
        const data = await buscarNegociosSerpApi("restaurant", "Ciudad Juárez, Mexico");
        setPlaces(data);
      } catch (error) {
        console.error("Error loading places:", error);
      }
    }

    loadPlaces();
  }, []);

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
  };

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PlacesContext.Provider value={places}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <AuthGuard>
                <Box sx={{ display: 'flex' }}>
                  <Sidebar />
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Header onPeriodChange={handlePeriodChange} />
                    <Box
                      component="main"
                      sx={{
                        flexGrow: 1,
                        height: '100vh',
                        overflow: 'auto',
                        mt: 8,
                        backgroundColor: theme.palette.background.default,
                      }}
                    >
                      <Routes>
                        <Route path="/" element={<Dashboard period={selectedPeriod} />} />
                        <Route path="/leads" element={<LeadsList />} />
                        <Route path="/campaigns" element={<Campaigns />} />
                        <Route path="/conversations" element={<Conversations />} />
                        <Route path="/reports" element={<ReportsAnalytics />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/clients" element={<ClientsConfig />} />
                        <Route path="/help" element={<HelpCenter />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Box>
                  </Box>
                </Box>
              </AuthGuard>
            } />
          </Routes>
        </PlacesContext.Provider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
