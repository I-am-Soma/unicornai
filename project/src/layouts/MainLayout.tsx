import React, { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  useMediaQuery, 
  useTheme,
  Fade,
} from '@mui/material';
import { Menu, Notifications, AccountCircle } from '@mui/icons-material';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Para mobile: controlar si el drawer está abierto (colapsado por defecto)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleDrawerClose = () => {
    setMobileDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar - Solo visible en mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={1}
          sx={{
            width: '100%',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: '#3b82f6', // Azul más vibrante
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <Menu />
            </IconButton>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <img 
                src="https://raw.githubusercontent.com/I-am-Soma/unicorn-landing/main/logo%20transparente.png"
                alt="Unicorn AI"
                style={{ width: 32, height: 32 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                Unicorn AI
              </Typography>
            </Box>

            {/* Mobile top bar actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <Notifications fontSize="small" />
              </IconButton>
              <IconButton
                color="inherit"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <AccountCircle fontSize="small" />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 } 
        }}
      >
        {isMobile ? (
          // Mobile: Drawer temporal que se superpone (colapsado por defecto)
          <Sidebar
            open={mobileDrawerOpen}
            onClose={handleDrawerClose}
            variant="temporary"
          />
        ) : (
          // Desktop: Sidebar permanente y visible
          <Sidebar
            open={true}
            onClose={() => {}}
            variant="permanent"
          />
        )}
      </Box>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { 
            xs: '100%', 
            md: `calc(100% - ${drawerWidth}px)` 
          },
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        }}
      >
        {/* Content wrapper */}
        <Box
          sx={{
            pt: isMobile ? 9 : 3, // Espacio para AppBar en mobile
            pb: 3,
            px: { xs: 2, sm: 3, md: 4 },
            maxWidth: '100%',
          }}
        >
          <Fade in timeout={300}>
            <Box sx={{ minHeight: 'calc(100vh - 120px)' }}>
              {children}
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;