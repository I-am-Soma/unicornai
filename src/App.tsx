import React, { useEffect, useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
} from '@mui/material';

// Providers
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider } from './components/OnboardingTour';

// Layout & Guards
import Sidebar from './components/Sidebar';
import Header, { Period } from './components/Header';
import AuthGuard from './components/AuthGuard';

// Pages
import Dashboard from './components/Dashboard';
import LeadsList from './components/LeadsList';
import Campaigns from './components/Campaigns';
import Conversations from './components/Conversations';
import ReportsAnalytics from './components/ReportsAnalytics';
import Settings from './components/Settings';
import ClientsConfig from './components/ClientsConfig';
import HelpCenter from './components/HelpCenter';
import Login from './components/Login';
import Register from './components/Register';

// Utils
import { getStoredLeads, getStoredCampaigns } from './utils/storage';
import { buscarNegociosSerpApi } from './utils/api';

// Contexto global para lugares
export const PlacesContext = createContext<any[]>([]);

// Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    secondary: { main: '#8b5cf6' },
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
  shape: {
    borderRadius: 8,
  },
});

function App() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');
  const [places, setPlaces] = useState<any[]>([]);

  // Debug Supabase ENV
  useEffect(() => {
    console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('✅ App component mounted');
  }, []);

  // Inicializar leads y campañas demo (NO rompe producción)
  useEffect(() => {
    async function initializeData() {
      try {
        if (getStoredLeads().length === 0) {
          const { fetchLeads } = await import('./api/leadsApi');
          localStorage.setItem('unicorn_leads', JSON.stringify(await fetchLeads()));
        }

        if (getStoredCampaigns().length === 0) {
          const { fetchCampaigns } = await import('./api/leadsApi');
          localStorage.setItem(
            'unicorn_campaigns',
            JSON.stringify(await fetchCampaigns())
          );
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    }
    initializeData();
  }, []);

  // Cargar lugares (SerpApi)
  useEffect(() => {
    async function loadPlaces() {
      try {
        const data = await buscarNegociosSerpApi(
          'restaurant',
          'Ciudad Juárez, Mexico'
        );
        setPlaces(data);
      } catch (error) {
        console.error('Error loading places:', error);
      }
    }
    loadPlaces();
  }, []);

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
  };

  console.log('🎨 Rendering App...');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <PlacesContext.Provider value={places}>
            <OnboardingProvider>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected */}
                <Route
                  path="/*"
                  element={
                    <AuthGuard>
                      <Box sx={{ display: 'flex' }}>
                        {/* Sidebar - Oculto en mobile */}
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Sidebar />
                        </Box>
                        
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Header - Oculto en mobile */}
                          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Header onPeriodChange={handlePeriodChange} />
                          </Box>

                          <Box
                            component="main"
                            sx={{
                              flexGrow: 1,
                              height: '100vh',
                              overflow: 'auto',
                              mt: { xs: 0, md: 8 }, // Sin margin-top en mobile
                              backgroundColor: theme.palette.background.default,
                              pb: { xs: '64px', md: 0 }, // Padding bottom para mobile nav
                            }}
                          >
                            <Routes>
                              <Route
                                path="/"
                                element={<Dashboard period={selectedPeriod} />}
                              />
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
                  }
                />
              </Routes>
            </OnboardingProvider>
          </PlacesContext.Provider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
