import React, { useEffect, useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  Campaign as CampaignIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

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
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// ============================================================================
// MOBILE BOTTOM NAVIGATION COMPONENT
// ============================================================================
const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 0;
    if (path === '/leads') return 1;
    if (path === '/conversations') return 2;
    if (path === '/reports') return 3;
    if (path === '/settings') return 4;
    return 0;
  };

  const [value, setValue] = useState(getCurrentValue());

  useEffect(() => {
    setValue(getCurrentValue());
  }, [location.pathname]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const routes = ['/', '/leads', '/conversations', '/reports', '/settings'];
    navigate(routes[newValue]);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: 1,
        borderColor: 'divider',
      }}
      elevation={8}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 60,
            padding: '6px 12px 8px',
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '4px',
          },
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<DashboardIcon />}
          sx={{ minHeight: 44, minWidth: 44 }}
        />
        <BottomNavigationAction
          label="Leads"
          icon={<PeopleIcon />}
          sx={{ minHeight: 44, minWidth: 44 }}
        />
        <BottomNavigationAction
          label="Chat"
          icon={<ChatIcon />}
          sx={{ minHeight: 44, minWidth: 44 }}
        />
        <BottomNavigationAction
          label="Reports"
          icon={<ReportsIcon />}
          sx={{ minHeight: 44, minWidth: 44 }}
        />
        <BottomNavigationAction
          label="Settings"
          icon={<SettingsIcon />}
          sx={{ minHeight: 44, minWidth: 44 }}
        />
      </BottomNavigation>
    </Paper>
  );
};

// ============================================================================
// MOBILE FAB COMPONENT
// ============================================================================
const MobileFAB: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const actions = [
    {
      icon: <PersonAddIcon />,
      name: 'Add Lead',
      onClick: () => {
        navigate('/leads');
        setOpen(false);
      },
    },
    {
      icon: <CampaignIcon />,
      name: 'New Campaign',
      onClick: () => {
        navigate('/campaigns');
        setOpen(false);
      },
    },
    {
      icon: <RefreshIcon />,
      name: 'Refresh',
      onClick: () => {
        window.location.reload();
        setOpen(false);
      },
    },
  ];

  return (
    <SpeedDial
      ariaLabel="Quick actions"
      sx={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        '& .MuiFab-primary': {
          width: 56,
          height: 56,
        },
      }}
      icon={<SpeedDialIcon />}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
    >
      {actions.map((action) => (
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
  );
};

// ============================================================================
// MAIN APP
// ============================================================================
function App() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');
  const [places, setPlaces] = useState<any[]>([]);

  // Debug Supabase ENV
  useEffect(() => {
    console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <PlacesContext.Provider value={places}>
            <OnboardingProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <AuthGuard>
                      <ResponsiveLayout
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={handlePeriodChange}
                      />
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

// ============================================================================
// RESPONSIVE LAYOUT COMPONENT
// ============================================================================
interface ResponsiveLayoutProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  useEffect(() => {
    console.log('📱 Is Mobile?', isMobile);
    console.log('🖥️ Window width:', window.innerWidth);
  }, [isMobile]);

  // Renderizar el componente correcto según la ruta
  const renderPage = () => {
    const path = location.pathname;
    
    if (path === '/' || path === '/dashboard') {
      return <Dashboard period={selectedPeriod} />;
    }
    if (path === '/leads') return <LeadsList />;
    if (path === '/campaigns') return <Campaigns />;
    if (path === '/conversations') return <Conversations />;
    if (path === '/reports') return <ReportsAnalytics />;
    if (path === '/settings') return <Settings />;
    if (path === '/clients') return <ClientsConfig />;
    if (path === '/help') return <HelpCenter />;
    
    return <Navigate to="/" replace />;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* DESKTOP: Sidebar + Header */}
      {!isMobile && (
        <>
          <Sidebar />
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Header onPeriodChange={onPeriodChange} />
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
              {renderPage()}
            </Box>
          </Box>
        </>
      )}

      {/* MOBILE: Sin Sidebar ni Header, con Bottom Nav */}
      {isMobile && (
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            backgroundColor: theme.palette.background.default,
            pb: '64px', // Espacio para bottom navigation
          }}
        >
          <Box
            component="main"
            sx={{
              minHeight: '100vh',
              overflow: 'auto',
            }}
          >
            {renderPage()}
          </Box>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />

          {/* Mobile FAB */}
          <MobileFAB />
        </Box>
      )}
    </Box>
  );
};

export default App;
