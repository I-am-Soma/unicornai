import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Chip,
  Tab,
  Tabs,
  Link,
  Avatar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Help as HelpIcon,
  Book as BookIcon,
  LiveHelp as LiveHelpIcon,
  BugReport as BugReportIcon,
  VideoLibrary as VideoLibraryIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Campaign as CampaignIcon,
  FilterList as FilterListIcon,
  Message as MessageIcon,
  Assessment as AssessmentIcon,
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
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HelpCenter: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFaqChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would search through help content
    console.log('Searching for:', searchQuery);
  };

  // FAQ data
  const faqData = [
    {
      id: 'faq1',
      question: 'How do I create a new lead?',
      answer: 'To create a new lead, navigate to the "Lead Management" section from the sidebar. Click on the "New Lead" button in the top right corner. Fill in the required information in the form that appears and click "Save".',
      category: 'leads'
    },
    {
      id: 'faq2',
      question: 'How do I set up a new campaign?',
      answer: 'To create a new campaign, go to the "Campaigns" section from the sidebar. Click on the "New Campaign" button. Enter the campaign name, budget, and other details in the form. You can also set the status, platform, and target audience for your campaign.',
      category: 'campaigns'
    },
    {
      id: 'faq3',
      question: 'How do I export reports?',
      answer: 'To export reports, navigate to the "Reports & Analytics" section. Use the "Export" button in the top right corner. You can choose between PDF, CSV, or Excel formats. You can also select a date range for your report before exporting.',
      category: 'reports'
    },
    {
      id: 'faq4',
      question: 'How do I change my password?',
      answer: 'To change your password, go to the "Settings" section and select the "Security" tab. Click on the "Change Password" button and follow the prompts to enter your current password and set a new one.',
      category: 'account'
    },
    {
      id: 'faq5',
      question: 'Can I integrate with other platforms?',
      answer: 'Yes, Unicorn AI supports integrations with various platforms. Go to the "Settings" section and select the "Integrations" tab. You can configure connections with WhatsApp, Zapier, Stripe, and other services.',
      category: 'integrations'
    },
    {
      id: 'faq6',
      question: 'How do I set up automated responses?',
      answer: 'To set up automated responses, navigate to the "Settings" section and select the "Automation" tab. Enable the "Auto-Responders" option and configure your response templates. You can create different templates for different lead sources or stages.',
      category: 'automation'
    },
    {
      id: 'faq7',
      question: 'How do I schedule email reports?',
      answer: 'In the "Reports & Analytics" section, click on the "Schedule" button. Enter the recipient email addresses, select the frequency (daily, weekly, or monthly), choose the day and time, and select the report format. Click "Schedule" to confirm.',
      category: 'reports'
    },
    {
      id: 'faq8',
      question: 'How do I compare campaign performance?',
      answer: 'In the "Reports & Analytics" section, click on the "Compare" button. Select the campaigns you want to compare (up to 5) from the list. The system will generate a comparison chart showing key metrics like clicks, impressions, and conversions.',
      category: 'campaigns'
    }
  ];

  // Filter FAQs based on search query
  const filteredFaqs = searchQuery
    ? faqData.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqData;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Help Center</Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder="Search for help topics, tutorials, FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button 
                    variant="contained" 
                    type="submit"
                    sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  >
                    Search
                  </Button>
                </InputAdornment>
              )
            }}
          />
        </form>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>Popular topics:</Typography>
          {['Leads', 'Campaigns', 'Reports', 'Integrations', 'Automation'].map((topic) => (
            <Chip 
              key={topic} 
              label={topic} 
              size="small" 
              onClick={() => setSearchQuery(topic)}
              clickable
            />
          ))}
        </Box>
      </Paper>

      {/* Help Center Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<QuestionAnswerIcon />} label="FAQs" />
          <Tab icon={<BookIcon />} label="Documentation" />
          <Tab icon={<LiveHelpIcon />} label="Support" />
          <Tab icon={<BugReportIcon />} label="Report Issues" />
          <Tab icon={<VideoLibraryIcon />} label="Tutorials" />
        </Tabs>

        {/* FAQs Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Find answers to common questions about using Unicorn AI.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip 
                label="All" 
                color={!searchQuery ? "primary" : "default"} 
                onClick={() => setSearchQuery('')}
                clickable
              />
              <Chip 
                label="Leads" 
                color={searchQuery === 'leads' ? "primary" : "default"} 
                onClick={() => setSearchQuery('leads')}
                clickable
              />
              <Chip 
                label="Campaigns" 
                color={searchQuery === 'campaigns' ? "primary" : "default"} 
                onClick={() => setSearchQuery('campaigns')}
                clickable
              />
              <Chip 
                label="Reports" 
                color={searchQuery === 'reports' ? "primary" : "default"} 
                onClick={() => setSearchQuery('reports')}
                clickable
              />
              <Chip 
                label="Account" 
                color={searchQuery === 'account' ? "primary" : "default"} 
                onClick={() => setSearchQuery('account')}
                clickable
              />
              <Chip 
                label="Integrations" 
                color={searchQuery === 'integrations' ? "primary" : "default"} 
                onClick={() => setSearchQuery('integrations')}
                clickable
              />
              <Chip 
                label="Automation" 
                color={searchQuery === 'automation' ? "primary" : "default"} 
                onClick={() => setSearchQuery('automation')}
                clickable
              />
            </Box>
            
            {filteredFaqs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <HelpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No FAQs found for "{searchQuery}"
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try a different search term or browse all FAQs
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => setSearchQuery('')}
                >
                  View All FAQs
                </Button>
              </Box>
            ) : (
              filteredFaqs.map((faq) => (
                <Accordion
                  key={faq.id}
                  expanded={expandedFaq === faq.id}
                  onChange={handleFaqChange(faq.id)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {faq.question}
                      <Chip 
                        label={faq.category} 
                        size="small" 
                        sx={{ ml: 1, textTransform: 'capitalize' }}
                      />
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography paragraph>{faq.answer}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography variant="body2" color="text.secondary">
                        Was this helpful?{' '}
                        <Link href="#" underline="hover">Yes</Link> · <Link href="#" underline="hover">No</Link>
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        </TabPanel>

        {/* Documentation Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Documentation</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Comprehensive guides and documentation for Unicorn AI features.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <FilterListIcon />
                      </Avatar>
                      <Typography variant="h6">Lead Management</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Learn how to effectively manage leads, track their status, and convert them into customers.
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Creating and importing leads" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Lead scoring and prioritization" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Lead status management" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Read Documentation</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <CampaignIcon />
                      </Avatar>
                      <Typography variant="h6">Campaign Management</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Create, manage, and optimize marketing campaigns to maximize your ROI.
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Creating campaigns" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Budget management" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Performance tracking" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Read Documentation</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                        <MessageIcon />
                      </Avatar>
                      <Typography variant="h6">Conversations</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Engage with leads through conversations and manage communication effectively.
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Starting conversations" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Managing multiple chats" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Automated responses" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Read Documentation</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                        <AssessmentIcon />
                      </Avatar>
                      <Typography variant="h6">Reports & Analytics</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Analyze performance data and generate insightful reports for decision-making.
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Viewing performance metrics" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Exporting reports" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Scheduling automated reports" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Read Documentation</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                        <SettingsIcon />
                      </Avatar>
                      <Typography variant="h6">Settings & Configuration</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Configure your account, integrations, and system preferences.
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Account settings" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Integration setup" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Notification preferences" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Read Documentation</Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                        <HelpIcon />
                      </Avatar>
                      <Typography variant="h6">Getting Started</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      New to Unicorn AI? Start here with our comprehensive onboarding guide.
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Platform overview" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="First steps guide" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Best practices" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Read Documentation</Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Support Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Support</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Need help? Our support team is ready to assist you.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <EmailIcon />
                      </Avatar>
                      <Typography variant="h6">Email Support</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Send us an email and we'll get back to you within 24 hours.
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      support@unicorn.ai
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<EmailIcon />}>
                      Send Email
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <ChatIcon />
                      </Avatar>
                      <Typography variant="h6">Live Chat</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Chat with our support team in real-time during business hours.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available Monday-Friday, 9am-5pm EST
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<ChatIcon />}>
                      Start Chat
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                        <PhoneIcon />
                      </Avatar>
                      <Typography variant="h6">Phone Support</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Call us directly for urgent issues or complex questions.
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      +1 (555) 123-4567
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<PhoneIcon />}>
                      Call Support
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Support Hours</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Standard Support</Typography>
                    <Typography variant="body2">
                      Monday - Friday: 9:00 AM - 5:00 PM EST
                    </Typography>
                    <Typography variant="body2">
                      Saturday - Sunday: Closed
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Email response within 24 hours
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Premium Support</Typography>
                    <Typography variant="body2">
                      Monday - Friday: 24 hours
                    </Typography>
                    <Typography variant="body2">
                      Saturday - Sunday: 9:00 AM - 5:00 PM EST
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Email response within 4 hours, priority phone support
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </TabPanel>

        {/* Report Issues Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Report an Issue</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Encountered a problem? Let us know so we can fix it.
            </Typography>
            
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Issue Title"
                    placeholder="Brief description of the issue"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Issue Type"
                    fullWidth
                    defaultValue="bug"
                    SelectProps={{ native: true }}
                  >
                    <option value="bug">Bug/Error</option>
                    <option value="feature">Feature Request</option>
                    <option value="question">Question</option>
                    <option value="other">Other</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Priority"
                    fullWidth
                    defaultValue="medium"
                    SelectProps={{ native: true }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    placeholder="Please provide detailed information about the issue"
                    multiline
                    rows={6}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Steps to Reproduce"
                    placeholder="List the steps to reproduce this issue"
                    multiline
                    rows={4}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    Submit Issue
                  </Button>
                </Grid>
              </Grid>
            </Paper>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Recent Issues</Typography>
              <Paper>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <BugReportIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Error exporting reports to PDF"
                      secondary="Submitted: 2 days ago • Status: In Progress"
                    />
                    <Chip label="Bug" size="small" color="error" />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <BugReportIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Campaign comparison not showing all metrics"
                      secondary="Submitted: 5 days ago • Status: Under Review"
                    />
                    <Chip label="Bug" size="small" color="warning" />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <HelpIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Request for additional lead filtering options"
                      secondary="Submitted: 1 week ago • Status: Planned"
                    />
                    <Chip label="Feature" size="small" color="info" />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          </Box>
        </TabPanel>

        {/* Tutorials Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Video Tutorials</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Learn how to use Unicorn AI with our step-by-step video tutorials.
            </Typography>
            
            <Grid container spacing={3}>
              {[
                {
                  title: 'Getting Started with Unicorn AI',
                  duration: '5:32',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZGFzaGJvYXJkfGVufDB8fDB8fHww',
                  category: 'Basics'
                },
                {
                  title: 'Creating and Managing Leads',
                  duration: '8:15',
                  thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGVhZHN8ZW58MHx8MHx8fDA%3D',
                  category: 'Lead Management'
                },
                {
                  title: 'Setting Up Your First Campaign',
                  duration: '6:47',
                  thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FtcGFpZ258ZW58MHx8MHx8fDA%3D',
                  category: 'Campaigns'
                },
                {
                  title: 'Understanding Analytics & Reports',
                  duration: '10:23',
                  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZGFzaGJvYXJkfGVufDB8fDB8fHww',
                  category: 'Analytics'
                },
                {
                  title: 'Integrating with Third-Party Services',
                  duration: '7:55',
                  thumbnail: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aW50ZWdyYXRpb258ZW58MHx8MHx8fDA%3D',
                  category: 'Integrations'
                },
                {
                  title: 'Advanced Lead Scoring Techniques',
                  duration: '12:08',
                  thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGVhZCUyMHNjb3Jpbmd8ZW58MHx8MHx8fDA%3D',
                  category: 'Advanced'
                }
              ].map((tutorial, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <Box sx={{ position: 'relative' }}>
                      <img
                        src={tutorial.thumbnail}
                        alt={tutorial.title}
                        style={{ width: '100%', height: 180, objectFit: 'cover' }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          px: 1,
                          py:  0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        {tutorial.duration}
                      </Box>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: '50%',
                          width: 60,
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                          }
                        }}
                      >
                        <VideoLibraryIcon sx={{ color: 'white', fontSize: 30 }} />
                      </Box>
                    </Box>
                    <CardContent>
                      <Chip 
                        label={tutorial.category} 
                        size="small" 
                        sx={{ mb: 1 }} 
                      />
                      <Typography variant="h6" gutterBottom>
                        {tutorial.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Learn how to {tutorial.title.toLowerCase()} with this step-by-step tutorial.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">Watch Tutorial</Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button variant="outlined">
                View All Tutorials
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Quick Help Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Need More Help?</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Contact Support
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<ChatIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Live Chat
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Schedule a Call
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default HelpCenter;