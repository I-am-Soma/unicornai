import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  Message as MessageIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  People as ClientsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../components/NotificationSystem';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  showBadge?: boolean; // Para mostrar contador de notificaciones
}

const drawerWidth = 240;

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications(); // Hook para obtener notificaciones no leídas

  const navItems: NavItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Lead Management', icon: <PeopleIcon />, path: '/leads' },
    { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
    { 
      text: 'Conversations', 
      icon: <MessageIcon />, 
      path: '/conversations',
      showBadge: true, // Mostrar badge en Conversations
    },
    { text: 'Reports & Analytics', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Clients', icon: <ClientsIcon />, path: '/clients' },
    { text: 'Help Center', icon: <HelpIcon />, path: '/help' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <img
          src="https://raw.githubusercontent.com/I-am-Soma/unicorn-landing/main/logo%20transparente.png"
          alt="Unicorn AI"
          style={{ width: 40, height: 40 }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Unicorn AI
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, pt: 2, px: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'white' : 'text.secondary',
                  }}
                >
                  {/* Mostrar badge si hay notificaciones y el item lo requiere */}
                  {item.showBadge && unreadCount > 0 ? (
                    <Badge 
                      badgeContent={unreadCount} 
                      color="error"
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -3,
                          top: -3,
                          fontSize: '0.65rem',
                          height: 18,
                          minWidth: 18,
                          padding: '0 4px',
                        },
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Version 1.0.0
        </Typography>
        <Typography variant="caption" color="text.secondary">
          © 2026 Unicorn AI
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better performance on mobile
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: variant === 'permanent' ? '1px solid' : 'none',
          borderColor: 'divider',
          boxShadow: variant === 'temporary' ? 3 : 0,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
