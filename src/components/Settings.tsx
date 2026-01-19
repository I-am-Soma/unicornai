import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Sync as SyncIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  WhatsApp as WhatsAppIcon,
  Code as ZapierIcon,
  CreditCard as StripeIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AutoAwesome as AutomationIcon,
  FilterList as FilterIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import supabase from '../utils/supabaseClient';
import { RestartTourButton } from '../components/OnboardingTour';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openIntegrationDialog, setOpenIntegrationDialog] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // User data
  const [userId, setUserId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
    company: '',
    timezone: '',
    avatar_url: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Integration settings (stored per client)
  const [integrationForm, setIntegrationForm] = useState({
    apiKey: '',
    secretKey: '',
    webhookUrl: '',
  });

  // Notification settings (stored per user)
  const [notificationSettings, setNotificationSettings] = useState({
    newLeads: true,
    leadStatusChanges: true,
    campaignUpdates: true,
    systemAlerts: false,
    emailNotifications: true,
    pushNotifications: false,
  });

  // Automation settings (stored per client)
  const [automationSettings, setAutomationSettings] = useState({
    autoResponders: true,
    leadScoring: true,
    followUpReminders: true,
    campaignOptimization: false,
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      console.log('📄 Loading user settings...');

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        return;
      }

      setUserId(session.user.id);
      console.log('✅ User ID:', session.user.id);

      // Get user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, client_id')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      console.log('✅ User data loaded:', userData);

      setClientId(userData.client_id);
      setUserProfile({
        email: session.user.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        job_title: userData.job_title || '',
        company: userData.company || '',
        timezone: userData.timezone || '(UTC-05:00) Eastern Time (US & Canada)',
        avatar_url: userData.avatar_url || '',
      });

      // Set avatar URL
      if (userData.avatar_url) {
        setAvatarUrl(userData.avatar_url);
      }

      // Load notification settings (user-specific)
      if (userData.notification_settings) {
        setNotificationSettings({
          ...notificationSettings,
          ...userData.notification_settings,
        });
      }

      // Load automation settings (client-specific)
      const { data: clientSettings } = await supabase
        .from('client_settings')
        .select('automation_settings, integration_settings')
        .eq('client_id', userData.client_id)
        .single();

      if (clientSettings) {
        console.log('✅ Client settings loaded');
        if (clientSettings.automation_settings) {
          setAutomationSettings({
            ...automationSettings,
            ...clientSettings.automation_settings,
          });
        }
        if (clientSettings.integration_settings) {
          // Load integration configs (excluding sensitive data)
          console.log('✅ Integration settings loaded');
        }
      }

    } catch (err: any) {
      console.error('❌ Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async () => {
    try {
      console.log('💾 Saving profile...');

      const { error } = await supabase
        .from('users')
        .update({
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          phone: userProfile.phone,
          job_title: userProfile.job_title,
          company: userProfile.company,
          timezone: userProfile.timezone,
          avatar_url: avatarUrl,
        })
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ Profile saved');
      setSuccessMessage('Profile updated successfully');
      setShowSuccess(true);
    } catch (err: any) {
      console.error('❌ Error saving profile:', err);
      setError(err.message);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }

      setUploadingAvatar(true);
      console.log('📤 Uploading avatar...');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      console.log('✅ Avatar uploaded:', publicUrl);

      // Update avatar URL in state
      setAvatarUrl(publicUrl);

      // Update in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSuccessMessage('Profile picture updated successfully');
      setShowSuccess(true);
    } catch (err: any) {
      console.error('❌ Error uploading avatar:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      console.log('🗑️ Removing avatar...');

      // Update database
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      setAvatarUrl('');
      setSuccessMessage('Profile picture removed');
      setShowSuccess(true);
    } catch (err: any) {
      console.error('❌ Error removing avatar:', err);
      setError(err.message);
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validate passwords
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordForm.newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      console.log('🔐 Changing password...');

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      console.log('✅ Password changed');
      setOpenPasswordDialog(false);
      setSuccessMessage('Password changed successfully');
      setShowSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.error('❌ Error changing password:', err);
      setError(err.message);
    }
  };

  const handleOpenIntegration = (integration: string) => {
    setCurrentIntegration(integration);
    setOpenIntegrationDialog(true);
  };

  const handleSaveIntegration = async () => {
    try {
      console.log(`💾 Saving ${currentIntegration} integration...`);

      // Get or create client_settings
      const { data: existing } = await supabase
        .from('client_settings')
        .select('id, integration_settings')
        .eq('client_id', clientId)
        .single();

      const currentIntegrations = existing?.integration_settings || {};
      const updatedIntegrations = {
        ...currentIntegrations,
        [currentIntegration.toLowerCase()]: {
          api_key: integrationForm.apiKey,
          secret_key: integrationForm.secretKey,
          webhook_url: integrationForm.webhookUrl,
          enabled: true,
          configured_at: new Date().toISOString(),
        }
      };

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('client_settings')
          .update({ integration_settings: updatedIntegrations })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('client_settings')
          .insert({
            client_id: clientId,
            integration_settings: updatedIntegrations,
          });

        if (error) throw error;
      }

      console.log(`✅ ${currentIntegration} integration saved`);
      setOpenIntegrationDialog(false);
      setSuccessMessage(`${currentIntegration} integration configured successfully`);
      setShowSuccess(true);
      setIntegrationForm({
        apiKey: '',
        secretKey: '',
        webhookUrl: '',
      });
    } catch (err: any) {
      console.error('❌ Error saving integration:', err);
      setError(err.message);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      console.log('💾 Saving notification settings...');

      const { error } = await supabase
        .from('users')
        .update({
          notification_settings: notificationSettings
        })
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ Notification settings saved');
      setSuccessMessage('Notification settings saved successfully');
      setShowSuccess(true);
    } catch (err: any) {
      console.error('❌ Error saving notifications:', err);
      setError(err.message);
    }
  };

  const handleSaveAutomation = async () => {
    try {
      console.log('💾 Saving automation settings...');

      // Get or create client_settings
      const { data: existing } = await supabase
        .from('client_settings')
        .select('id')
        .eq('client_id', clientId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('client_settings')
          .update({ automation_settings: automationSettings })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('client_settings')
          .insert({
            client_id: clientId,
            automation_settings: automationSettings,
          });

        if (error) throw error;
      }

      console.log('✅ Automation settings saved');
      setSuccessMessage('Automation settings saved successfully');
      setShowSuccess(true);
    } catch (err: any) {
      console.error('❌ Error saving automation:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Settings</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }} elevation={3}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<SyncIcon />} label="Integrations" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<AutomationIcon />} label="Automation" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                  }}
                >
                  {!avatarUrl && (userProfile.first_name?.[0] || userProfile.email?.[0]?.toUpperCase() || 'U')}
                </Avatar>
                
                {uploadingAvatar && (
                  <CircularProgress
                    size={120}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                )}

                {/* Upload button */}
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <label htmlFor="avatar-upload">
                  <IconButton
                    component="span"
                    color="primary"
                    disabled={uploadingAvatar}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'white',
                      boxShadow: 2,
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </label>

                {/* Remove button */}
                {avatarUrl && (
                  <IconButton
                    onClick={handleRemoveAvatar}
                    color="error"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: 'white',
                      boxShadow: 2,
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Typography variant="h6">
                {userProfile.first_name} {userProfile.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userProfile.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {userProfile.job_title || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Client ID: {clientId}
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    value={userProfile.first_name}
                    onChange={(e) => setUserProfile({ ...userProfile, first_name: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    value={userProfile.last_name}
                    onChange={(e) => setUserProfile({ ...userProfile, last_name: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    value={userProfile.email}
                    fullWidth
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone Number"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Job Title"
                    value={userProfile.job_title}
                    onChange={(e) => setUserProfile({ ...userProfile, job_title: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Company"
                    value={userProfile.company}
                    onChange={(e) => setUserProfile({ ...userProfile, company: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Time Zone"
                    value={userProfile.timezone}
                    onChange={(e) => setUserProfile({ ...userProfile, timezone: e.target.value })}
                    fullWidth
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="(UTC-08:00) Pacific Time (US & Canada)">(UTC-08:00) Pacific Time (US & Canada)</option>
                    <option value="(UTC-07:00) Mountain Time (US & Canada)">(UTC-07:00) Mountain Time (US & Canada)</option>
                    <option value="(UTC-06:00) Central Time (US & Canada)">(UTC-06:00) Central Time (US & Canada)</option>
                    <option value="(UTC-05:00) Eastern Time (US & Canada)">(UTC-05:00) Eastern Time (US & Canada)</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    sx={{ mt: 2 }}
                  >
                    Save Changes
                  </Button>
                </Grid>

                {/* NUEVO: Card del Tutorial Interactivo */}
                <Grid item xs={12}>
                  <Card elevation={2} sx={{ mt: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <HelpIcon sx={{ color: 'white', fontSize: 28 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Tutorial Interactivo
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ¿Necesitas un repaso? Vuelve a ver el tour de bienvenida
                          </Typography>
                        </Box>
                      </Box>
                      <RestartTourButton />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Password</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your account password. We recommend using a strong password and changing it regularly.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setOpenPasswordDialog(true)}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Account Information</Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="User ID"
                    secondary={userId}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Client ID"
                    secondary={clientId}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Email"
                    secondary={userProfile.email}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Integrations Tab */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Integration settings are shared across your organization (Client ID: {clientId})
          </Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#25D366', mr: 2 }}>
                      <WhatsAppIcon />
                    </Avatar>
                    <Typography variant="h6">WhatsApp</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Connect WhatsApp Business API to send and receive messages directly from the platform.
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleOpenIntegration('WhatsApp')}
                  >
                    Configure
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#FF4A00', mr: 2 }}>
                      <ZapierIcon />
                    </Avatar>
                    <Typography variant="h6">Zapier</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Automate workflows by connecting Unicorn AI with 3,000+ apps through Zapier.
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleOpenIntegration('Zapier')}
                  >
                    Configure
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#635BFF', mr: 2 }}>
                      <StripeIcon />
                    </Avatar>
                    <Typography variant="h6">Stripe</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Process payments and manage subscriptions with Stripe integration.
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleOpenIntegration('Stripe')}
                  >
                    Configure
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Notification preferences are personal to your account
          </Alert>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose which notifications you'd like to receive.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="New Leads"
                    secondary="Get notified when new leads are captured"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={notificationSettings.newLeads}
                      onChange={() => setNotificationSettings({
                        ...notificationSettings,
                        newLeads: !notificationSettings.newLeads
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Lead Status Changes"
                    secondary="Get notified when lead status changes"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={notificationSettings.leadStatusChanges}
                      onChange={() => setNotificationSettings({
                        ...notificationSettings,
                        leadStatusChanges: !notificationSettings.leadStatusChanges
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Campaign Updates"
                    secondary="Get notified about campaign performance"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={notificationSettings.campaignUpdates}
                      onChange={() => setNotificationSettings({
                        ...notificationSettings,
                        campaignUpdates: !notificationSettings.campaignUpdates
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="System Alerts"
                    secondary="Get notified about system updates and maintenance"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={notificationSettings.systemAlerts}
                      onChange={() => setNotificationSettings({
                        ...notificationSettings,
                        systemAlerts: !notificationSettings.systemAlerts
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Delivery Methods</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose how you'd like to receive notifications.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive notifications via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={notificationSettings.emailNotifications}
                      onChange={() => setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: !notificationSettings.emailNotifications
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Push Notifications"
                    secondary="Receive push notifications in browser"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={notificationSettings.pushNotifications}
                      onChange={() => setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications: !notificationSettings.pushNotifications
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              <Button
                variant="contained"
                onClick={handleSaveNotifications}
                sx={{ mt: 2 }}
              >
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Automation Tab */}
        <TabPanel value={tabValue} index={4}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Automation settings apply to your entire organization (Client ID: {clientId})
          </Alert>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Lead Automation</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure automated responses and lead management.
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SendIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Auto-Responders"
                    secondary="Automatically send welcome messages to new leads"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={automationSettings.autoResponders}
                      onChange={() => setAutomationSettings({
                        ...automationSettings,
                        autoResponders: !automationSettings.autoResponders
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <FilterIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Lead Scoring"
                    secondary="Automatically score and prioritize leads based on behavior"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={automationSettings.leadScoring}
                      onChange={() => setAutomationSettings({
                        ...automationSettings,
                        leadScoring: !automationSettings.leadScoring
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Follow-up Reminders"
                    secondary="Get reminders to follow up with leads"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={automationSettings.followUpReminders}
                      onChange={() => setAutomationSettings({
                        ...automationSettings,
                        followUpReminders: !automationSettings.followUpReminders
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <AutomationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Campaign Optimization"
                    secondary="Automatically optimize campaigns based on performance"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={automationSettings.campaignOptimization}
                      onChange={() => setAutomationSettings({
                        ...automationSettings,
                        campaignOptimization: !automationSettings.campaignOptimization
                      })}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              <Button
                variant="contained"
                onClick={handleSaveAutomation}
                sx={{ mt: 2 }}
              >
                Save Automation Settings
              </Button>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            helperText="Minimum 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm New Password"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained">Change Password</Button>
        </DialogActions>
      </Dialog>

      {/* Integration Dialog */}
      <Dialog open={openIntegrationDialog} onClose={() => setOpenIntegrationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentIntegration} Integration</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            These settings will be shared across your organization
          </Alert>
          <TextField
            label="API Key"
            fullWidth
            margin="normal"
            value={integrationForm.apiKey}
            onChange={(e) => setIntegrationForm({ ...integrationForm, apiKey: e.target.value })}
            placeholder="Enter your API key"
          />
          <TextField
            label="Secret Key"
            type="password"
            fullWidth
            margin="normal"
            value={integrationForm.secretKey}
            onChange={(e) => setIntegrationForm({ ...integrationForm, secretKey: e.target.value })}
            placeholder="Enter your secret key"
          />
          <TextField
            label="Webhook URL"
            fullWidth
            margin="normal"
            value={integrationForm.webhookUrl}
            onChange={(e) => setIntegrationForm({ ...integrationForm, webhookUrl: e.target.value })}
            placeholder="https://your-webhook-url.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenIntegrationDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveIntegration} variant="contained">Save Configuration</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
