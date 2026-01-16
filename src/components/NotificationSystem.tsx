// VERSIÓN TEMPORAL SIN react-hot-toast
// Usa solo Material-UI Snackbar

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Snackbar, Alert, IconButton, Badge } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import supabase from '../utils/supabaseClient';

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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  useEffect(() => {
    initializeNotifications();
    requestNotificationPermission();
  }, []);

  const initializeNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ No active session');
        return;
      }

      setUserId(session.user.id);

      const { data: userData } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', session.user.id)
        .single();

      if (userData?.client_id) {
        setClientId(userData.client_id);
        await loadNotifications(session.user.id);
        setupRealtimeSubscriptions(session.user.id, userData.client_id);
      }
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error loading notifications:', error);
        return;
      }

      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('❌ Error in loadNotifications:', error);
    }
  };

  const setupRealtimeSubscriptions = (userId: string, clientId: string) => {
    console.log('🔔 Setting up real-time subscriptions...');

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

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(conversationsChannel);
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
    showSnackbar(notification.message, 'success');
    playSound();
    showDesktopNotification(notification);
    saveNotificationToDb(notification);
  };

  const handleNewMessage = (conversation: any) => {
    const notification: Notification = {
      id: `msg-${conversation.id}-${Date.now()}`,
      type: 'new_message',
      title: '💬 New Message',
      message: `Message from ${conversation.lead_phone}`,
      read: false,
      created_at: new Date().toISOString(),
      metadata: { conversation_id: conversation.id },
    };

    addNotification(notification);
    showSnackbar(notification.message, 'info');
    playSound();
    showDesktopNotification(notification);
    saveNotificationToDb(notification);
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  };

  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const playSound = () => {
    if (!soundEnabled) return;

    try {
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
    } catch (error) {
      console.error('❌ Error playing sound:', error);
    }
  };

  const showDesktopNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
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
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    try {
      await supabase.from('notifications').delete().eq('user_id', userId);
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
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
        setSoundEnabled,
      }}
    >
      {children}
      
      {/* Snackbar en lugar de toast */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();

  return (
    <IconButton color="inherit">
      <Badge badgeContent={unreadCount} color="error">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
};
