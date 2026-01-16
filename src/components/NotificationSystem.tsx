import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Typography,
  Box,
  Button,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Campaign as CampaignIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import supabase from '../utils/supabaseClient';

// Types
interface Notification {
  id: string;
  type: 'new_lead' | 'lead_status_change' | 'new_message' | 'campaign_update' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Provider Component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');

  // Initialize
  useEffect(() => {
    initializeNotifications();
    requestNotificationPermission();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserId(session.user.id);

      // Get client_id
      const { data: userData } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', session.user.id)
        .single();

      if (userData?.client_id) {
        setClientId(userData.client_id);
        
        // Load existing notifications
        await loadNotifications(session.user.id, userData.client_id);
        
        // Setup real-time subscriptions
        setupRealtimeSubscriptions(session.user.id, userData.client_id);
      }

      // Load sound preference
      const soundPref = localStorage.getItem('notifications_sound');
      if (soundPref !== null) {
        setSoundEnabled(soundPref === 'true');
      }
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  };

  const loadNotifications = async (userId: string, clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          created_at: n.created_at,
          metadata: n.metadata,
        })));
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscriptions = (userId: string, clientId: string) => {
    console.log('🔔 Setting up real-time notifications...');

    // Subscribe to new leads
    const leadsChannel = supabase
      .channel('leads-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Leads',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log('🆕 New lead detected:', payload.new);
          handleNewLead(payload.new);
        }
      )
      .subscribe();

    // Subscribe to new conversations/messages
    const conversationsChannel = supabase
      .channel('conversations-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log('💬 New message detected:', payload.new);
          handleNewMessage(payload.new);
        }
      )
      .subscribe();

    // Subscribe to lead status changes
    const leadUpdatesChannel = supabase
      .channel('lead-updates-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Leads',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            console.log('📊 Lead status changed:', payload.new);
            handleLeadStatusChange(payload.old, payload.new);
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(leadUpdatesChannel);
    };
  };

  const handleNewLead = (lead: any) => {
    const notification: Notification = {
      id: `lead-${lead.id}-${Date.now()}`,
      type: 'new_lead',
      title: '🎯 New Lead Captured',
      message: `${lead.business_name || lead.name || 'New lead'} has been added to your pipeline`,
      read: false,
      created_at: new Date().toISOString(),
      metadata: { lead_id: lead.id },
    };

    addNotification(notification);
    showToast(notification);
    playSound();
    showDesktopNotification(notification);
    saveNotificationToDb(notification);
  };

  const handleNewMessage = (conversation: any) => {
    const notification: Notification = {
      id: `msg-${conversation.id}-${Date.now()}`,
      type: 'new_message',
      title: '💬 New Message',
      message: `Message from ${conversation.lead_phone}: ${conversation.last_message?.substring(0, 50)}...`,
      read: false,
      created_at: new Date().toISOString(),
      metadata: { conversation_id: conversation.id },
    };

    addNotification(notification);
    showToast(notification);
    playSound();
    showDesktopNotification(notification);
    saveNotificationToDb(notification);
  };

  const handleLeadStatusChange = (oldLead: any, newLead: any) => {
    const notification: Notification = {
      id: `status-${newLead.id}-${Date.now()}`,
      type: 'lead_status_change',
      title: '📊 Lead Status Updated',
      message: `${newLead.business_name || 'Lead'} status changed from ${oldLead.status} to ${newLead.status}`,
      read: false,
      created_at: new Date().toISOString(),
      metadata: { lead_id: newLead.id, old_status: oldLead.status, new_status: newLead.status },
    };

    addNotification(notification);
    showToast(notification);
    saveNotificationToDb(notification);
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  };

  const showToast = (notification: Notification) => {
    const icon = getNotificationIcon(notification.type);
    
    toast(
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {notification.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {notification.message}
          </Typography>
        </Box>
      </Box>,
      {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      }
    );
  };

  const playSound = () => {
    if (!soundEnabled) return;
    
    // Create notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const showDesktopNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const saveNotificationToDb = async (notification: Notification) => {
    if (!userId) return;

    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: false,
        metadata: notification.metadata,
        created_at: notification.created_at,
      });
    } catch (error) {
      console.error('❌ Error saving notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  };

  const clearAll = async () => {
    setNotifications([]);

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('notifications_sound', enabled.toString());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_lead':
        return <PersonIcon color="primary" />;
      case 'new_message':
        return <MessageIcon color="info" />;
      case 'lead_status_change':
        return <CheckCircleIcon color="success" />;
      case 'campaign_update':
        return <CampaignIcon color="warning" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        soundEnabled,
        setSoundEnabled: handleSoundToggle,
      }}
    >
      {children}
      <Toaster />
    </NotificationContext.Provider>
  );
};

// Notification Bell Component
export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, soundEnabled, setSoundEnabled } =
    useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_lead':
        return <PersonIcon fontSize="small" color="primary" />;
      case 'new_message':
        return <MessageIcon fontSize="small" color="info" />;
      case 'lead_status_change':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'campaign_update':
        return <CampaignIcon fontSize="small" color="warning" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            </IconButton>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </Box>
        </Box>
        <Divider />

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    handleClose();
                  }}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTimeAgo(notification.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {notification.message}
                      </Typography>
                    }
                  />
                </MenuItem>
              ))}
            </Box>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button size="small" color="error" onClick={clearAll}>
                Clear All
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};
