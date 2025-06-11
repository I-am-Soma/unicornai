import React, { useEffect, useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header, { Period } from './components/Header';
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
import AuthGuard from './components/AuthGuard';

import { getStoredLeads, getStoredCampaigns } from './utils/storage';
import { buscarNegociosSerpApi } from './utils/api';

// Contexto global para lugares
export const PlacesContext = createContext<any[]>([]);

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
          boxShadow:
            '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { head: { fontWeight: 600, backgroundColor: '#f8fafc' } },
    },
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
  // ① — Inserta aquí este bloque:
  useEffect(() => {
    console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  }, []);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');
  const [isInitialized, setIsInitialized] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);

  // Inicializar leads y campañas
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
        console.error('Error initializing data:', error);
      }
    }
    initializeData();
  }, []);

  // Cargar lugares desde SerpApi
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

  // Puedes mostrar un loader si no está inicializado
  // if (!isInitialized) return <div>Cargando...</div>;

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <PlacesContext.Provider value={places}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas protegidas */}
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <Box sx={{ display: 'flex' }}>
                      <Sidebar />
                      <Box
                        sx={{
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Header onPeriodChange={handlePeriodChange} />
                        <Box
                          component="main"
                          sx={{
                            flexGrow: 1,
                            height: '100vh',
                            overflow: 'auto',
                            mt: 8,
                            backgroundColor:
                              theme.palette.background.default,
                          }}
                        >
                          <Routes>
                            <Route
                              path="/"
                              element={
                                <Dashboard period={selectedPeriod} />
                              }
                            />
                            <Route
                              path="/leads"
                              element={<LeadsList />}
                            />
                            <Route
                              path="/campaigns"
                              element={<Campaigns />}
                            />
                            <Route
                              path="/conversations"
                              element={<Conversations />}
                            />
                            <Route
                              path="/reports"
                              element={<ReportsAnalytics />}
                            />
                            <Route
                              path="/settings"
                              element={<Settings />}
                            />
                            <Route
                              path="/clients"
                              element={<ClientsConfig />}
                            />
                            <Route
                              path="/help"
                              element={<HelpCenter />}
                            />
                            <Route
                              path="*"
                              element={<Navigate to="/" replace />}
                            />
                          </Routes>
                        </Box>
                      </Box>
                    </Box>
                  </AuthGuard>
                }
              />
            </Routes>
          </PlacesContext.Provider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
