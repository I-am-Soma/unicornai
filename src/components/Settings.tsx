import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Sync as SyncIcon,
  Edit as EditIcon,
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
} from '@mui/icons-material';

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
  const [tabValue, setTabValue] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openIntegrationDialog, setOpenIntegrationDialog] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [integrationForm, setIntegrationForm] = useState({
    apiKey: '',
    secretKey: '',
    webhookUrl: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    newLeads: true,
    leadStatusChanges: true,
    campaignUpdates: true,
    systemAlerts: false,
    emailNotifications: true,
    pushNotifications: false,
  });
  const [automationSettings, setAutomationSettings] = useState({
    autoResponders: true,
    leadScoring: true,
    followUpReminders: true,
    campaignOptimization: false,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = () => {
    setSuccessMessage('Profile updated successfully');
    setShowSuccess(true);
  };

  const handleChangePassword = () => {
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSuccessMessage('New passwords do not match');
      setShowSuccess(true);
      return;
    }
    
    setOpenPasswordDialog(false);
    setSuccessMessage('Password changed successfully');
    setShowSuccess(true);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleOpenIntegration = (integration: string) => {
    setCurrentIntegration(integration);
    setOpenIntegrationDialog(true);
  };

  const handleSaveIntegration = () => {
    setOpenIntegrationDialog(false);
    setSuccessMessage(`${currentIntegration} integration configured successfully`);
    setShowSuccess(true);
    setIntegrationForm({
      apiKey: '',
      secretKey: '',
      webhookUrl: '',
    });
  };

  const handleSaveNotifications = () => {
    setSuccessMessage('Notification settings saved successfully');
    setShowSuccess(true);
  };

  const handleSaveAutomation = () => {
    setSuccessMessage('Automation settings saved successfully');
    setShowSuccess(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Settings</Typography>

      <Paper sx={{ width: '100%' }}>
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
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                A
              </Avatar>
              <IconButton
                color="primary"
                sx={{
                  position: 'relative',
                  top: -30,
                  right: -30,
                  bgcolor: 'white',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <EditIcon />
              </IconButton>
              <Typography variant="h6">Admin User</Typography>
              <Typography variant="body2" color="text.secondary">admin@unicorn.ai</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Administrator</Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    defaultValue="Admin"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    defaultValue="User"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    defaultValue="admin@unicorn.ai"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone Number"
                    defaultValue="+1 (555) 123-4567"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Job Title"
                    defaultValue="Marketing Director"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Company"
                    defaultValue="Unicorn AI"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Time Zone"
                    defaultValue="(UTC-05:00) Eastern Time (US & Canada)"
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
                Your password was last changed 30 days ago. We recommend changing your password regularly for security.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setOpenPasswordDialog(true)}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Two-Factor Authentication</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add an extra layer of security to your account by enabling two-factor authentication.
              </Typography>
              <FormControlLabel
                control={<Switch color="primary" />}
                label="Enable Two-Factor Authentication"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Login Sessions</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                You're currently logged in from these devices:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Chrome on Windows"
                    secondary="Active now • IP: 192.168.1.1"
                  />
                  <ListItemSecondaryAction>
                    <Button color="error" size="small">
                      Logout
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Safari on iPhone"
                    secondary="Last active: 2 days ago • IP: 192.168.1.2"
                  />
                  <ListItemSecondaryAction>
                    <Button color="error" size="small">
                      Logout
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Integrations Tab */}
        <TabPanel value={tabValue} index={2}>
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

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Automation Rules</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create custom rules to automate lead management.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="High Priority for Enterprise Leads"
                    secondary="When lead's company size > 500, set priority to High"
                  />
                  <ListItemSecondaryAction>
                    <Switch defaultChecked />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Auto-assign to Sales Team"
                    secondary="When lead's budget > $10,000, assign to Sales Team"
                  />
                  <ListItemSecondaryAction>
                    <Switch defaultChecked />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
              >
                Create New Rule
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
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
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
      <Dialog open={openIntegrationDialog} onClose={() => setOpenIntegrationDialog(false)}>
        <DialogTitle>{currentIntegration} Integration</DialogTitle>
        <DialogContent>
          <TextField
            label="API Key"
            fullWidth
            margin="normal"
            value={integrationForm.apiKey}
            onChange={(e) => setIntegrationForm({ ...integrationForm, apiKey: e.target.value })}
          />
          <TextField
            label="Secret Key"
            fullWidth
            margin="normal"
            value={integrationForm.secretKey}
            onChange={(e) => setIntegrationForm({ ...integrationForm, secretKey: e.target.value })}
          />
          <TextField
            label="Webhook URL"
            fullWidth
            margin="normal"
            value={integrationForm.webhookUrl}
            onChange={(e) => setIntegrationForm({ ...integrationForm, webhookUrl: e.target.value })}
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
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;