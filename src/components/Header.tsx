import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Box, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Badge,
  Menu,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  ListItemAvatar,
  Button,
  InputBase,
  alpha,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  NotificationsOutlined as NotificationsIcon,
  PersonOutline as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export type Period = 'monthly' | 'weekly' | 'daily';

interface HeaderProps {
  onPeriodChange: (period: Period) => void;
}

const Header: React.FC<HeaderProps> = ({ onPeriodChange }) => {
  const [period, setPeriod] = useState<Period>('monthly');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);
  const [searchAnchor, setSearchAnchor] = useState<null | HTMLElement>(null);
  const userName = user?.email?.split('@')[0] || 'User';
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, signOutUser } = useAuth();


  useEffect(() => {
    // Get user data from localStorage
    const userDataStr = localStorage.getItem('unicorn_user');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.name) {
          setUserName(userData.name.split(' ')[0]); // Get first name
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handlePeriodChange = (event: SelectChangeEvent) => {
    const newPeriod = event.target.value as Period;
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleSearchClick = (event: React.MouseEvent<HTMLElement>) => {
    setSearchAnchor(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
    setSearchAnchor(null);
    setMobileMoreAnchorEl(null);
  };

  const handleLogout = async () => {
  try {
    await signOutUser();
    navigate('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};


  const notifications = [
    { 
      id: 1, 
      text: 'New lead captured from Facebook campaign', 
      time: '5 min ago',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXZhdGFyfGVufDB8fDB8fHww'
    },
    { 
      id: 2, 
      text: 'Summer Campaign performance update available', 
      time: '1 hour ago',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXZhdGFyfGVufDB8fDB8fHww'
    },
    { 
      id: 3, 
      text: 'System maintenance scheduled for tomorrow', 
      time: '2 hours ago',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww'
    },
    { 
      id: 4, 
      text: 'Juan Pérez responded to your message', 
      time: '3 hours ago',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YXZhdGFyfGVufDB8fDB8fHww'
    },
    { 
      id: 5, 
      text: 'Weekly report is ready for review', 
      time: '5 hours ago',
      avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D'
    },
  ];

  // Only show period selector on dashboard page
  const showPeriodSelector = location.pathname === '/' || location.pathname === '/dashboard';

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1976D2',
        width: { sm: `calc(100% - 240px)` },
        ml: { sm: '240px' },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {showPeriodSelector ? (
            <>
              <Typography 
                variant="h6" 
                sx={{ 
                  mr: 2, 
                  display: { xs: 'none', sm: 'block' },
                  fontWeight: 500
                }}
              >
                Welcome, {userName}
              </Typography>
              <Select
                value={period}
                onChange={handlePeriodChange}
                size="small"
                sx={{
                  minWidth: 120,
                  backgroundColor: 'white',
                  '& .MuiSelect-select': {
                    py: 1,
                  }
                }}
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
              </Select>
            </>
          ) : (
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 500
              }}
            >
              Welcome, {userName}
            </Typography>
          )}
        </Box>
        
        {/* Desktop view */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <Tooltip title="Search">
            <IconButton 
              size="large"
              sx={{ color: 'white', mx: 1 }}
              onClick={handleSearchClick}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton 
              size="large"
              sx={{ color: 'white', mx: 1 }}
              onClick={handleNotificationClick}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Profile">
            <IconButton 
              size="large"
              sx={{ color: 'white', mx: 1 }}
              onClick={handleProfileClick}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: 'secondary.main'
                }}
              >
                {userName.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Mobile view */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="show more"
            aria-haspopup="true"
            onClick={handleMobileMenuOpen}
            color="inherit"
          >
            <MoreIcon />
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: { width: 250, mt: 1.5 }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                width: 60, 
                height: 60, 
                mx: 'auto', 
                mb: 1,
                bgcolor: 'secondary.main'
              }}
            >
              {userName.charAt(0)}
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {userName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
  {user?.email}
</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
            <PersonIcon sx={{ mr: 2 }} /> Profile
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
            <SettingsIcon sx={{ mr: 2 }} /> Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 2 }} /> Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleClose}
          PaperProps={{
            sx: { width: 360, maxHeight: 500, mt: 1.5 }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 'bold' }}>
              Notifications
            </Typography>
            <Button size="small" color="primary">
              Mark all as read
            </Button>
          </Box>
          <Divider />
          <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem sx={{ px: 2, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar src={notification.avatar} />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={notification.text}
                    secondary={notification.time}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button size="small" fullWidth>
              View All Notifications
            </Button>
          </Box>
        </Menu>

        {/* Search Menu */}
        <Menu
          anchorEl={searchAnchor}
          open={Boolean(searchAnchor)}
          onClose={handleClose}
          PaperProps={{
            sx: { width: 400, mt: 1.5 }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.common.black, 0.05)
            }}>
              <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <InputBase
                placeholder="Search leads, campaigns, reports..."
                fullWidth
                autoFocus
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block' }}>
              Recent searches
            </Typography>
            <List dense>
              <ListItem button>
                <ListItemText primary="Summer Campaign performance" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Lead conversion rates" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Facebook campaign ROI" />
              </ListItem>
            </List>
          </Box>
        </Menu>

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMoreAnchorEl}
          open={Boolean(mobileMoreAnchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: { width: 200, mt: 1.5 }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => { handleClose(); handleSearchClick(null as any); }}>
            <SearchIcon sx={{ mr: 2 }} /> Search
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); handleNotificationClick(null as any); }}>
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon sx={{ mr: 2 }} />
            </Badge>
            Notifications
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); handleProfileClick(null as any); }}>
            <PersonIcon sx={{ mr: 2 }} /> Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleClose(); navigate('/'); }}>
            <DashboardIcon sx={{ mr: 2 }} /> Dashboard
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
