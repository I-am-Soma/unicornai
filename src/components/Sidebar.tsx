import React, { useContext } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Campaign,
  Message,
  Assessment,
  Help,
  ExitToApp,
  FilterList,
  Settings,
  PeopleOutline,
  ChevronLeft,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthGuard'; // Ajusta la ruta según tu estructura

const unicornLogo = 'https://raw.githubusercontent.com/I-am-Soma/unicorn-landing/main/logo%20transparente.png';
const drawerWidth = 240;

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { logout } = useContext(AuthContext);
  
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Campaigns', icon: <Campaign />, path: '/campaigns' },
    { text: 'Lead Management', icon: <FilterList />, path: '/leads' },
    { text: 'Conversations', icon: <Message />, path: '/conversations' },
    { text: 'Reports & Analytics', icon: <Assessment />, path: '/reports' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
    { text: 'Clients', icon: <PeopleOutline />, path: '/clients' },
    { text: 'Help Center', icon: <Help />, path: '/help' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  };

  const handleItemClick = () => {
    // En mobile, cerrar el drawer después de hacer clic
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#1e293b',
      color: 'white',
    }}>
      {/* Header con solo el logo centrado - como el diseño original */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: isMobile ? 'space-between' : 'center',
        alignItems: 'center',
        mb: 2
      }}>
        <img 
          src={unicornLogo}
          alt="Unicorn AI Logo"
          style={{ 
            width: 80,
            height: 80,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.3))',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        
        {/* Solo mostrar botón de cerrar en mobile */}
        {isMobile && (
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              width: 36,
              height: 36,
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 1 }} />

      {/* Navigation menu - manteniendo el estilo original */}
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={handleItemClick}
                sx={{ 
                  color: 'white', 
                  backgroundColor: isActive ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
                  borderLeft: isActive ? '4px solid #1976D2' : '4px solid transparent',
                  '&:hover': { 
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#1976D2' : 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mt: 1 }} />

      {/* Logout button - manteniendo el estilo original */}
      <Box sx={{ mt: 'auto', mb: 2, px: 2 }}>
        <ListItemButton 
          onClick={handleLogout}
          sx={{ 
            backgroundColor: '#1976D2', 
            color: 'white', 
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#1565c0' } 
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText primary="Log Out" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{ 
        keepMounted: true,
        // En mobile, cerrar al hacer click fuera
        onBackdropClick: isMobile ? onClose : undefined,
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          color: 'white',
          border: 'none',
          zIndex: isMobile ? (theme) => theme.zIndex.drawer + 2 : 'auto',
          transition: theme.transitions.create('transform', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;
