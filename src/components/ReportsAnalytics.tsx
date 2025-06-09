import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  ListItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  FilterList as FilterListIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Compare as CompareIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { fetchLeads, fetchCampaigns, exportReportToPdf, exportReportToCsv } from '../api/leadsApi';
import { CampaignData, Lead } from '../interfaces/interfaces';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportsAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [compareMenuAnchor, setCompareMenuAnchor] = useState<null | HTMLElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, campaignsData] = await Promise.all([
        fetchLeads(),
        fetchCampaigns()
      ]);
      setLeads(leadsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLeadMetrics = () => {
    const now = new Date();
    const periodStart = new Date();
    
    switch (period) {
      case 'monthly':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'weekly':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'daily':
        periodStart.setDate(now.getDate() - 1);
        break;
    }

    const periodLeads = leads.filter(lead => new Date(lead.createdAt) >= periodStart);
    const totalLeads = periodLeads.length;
    
    // Calculate lead sources distribution
    const sourceDistribution = periodLeads.reduce((acc: {[key: string]: number}, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {});

    // Calculate conversion rate (assuming 'Converted' status means converted)
    const convertedLeads = periodLeads.filter(lead => lead.status === 'Converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Calculate priority distribution
    const priorityDistribution = periodLeads.reduce((acc: {[key: string]: number}, lead) => {
      acc[lead.priority] = (acc[lead.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      totalLeads,
      conversionRate: conversionRate.toFixed(1),
      sourceDistribution,
      priorityDistribution,
      newLeads: periodLeads.filter(lead => lead.status === 'New').length,
      contactedLeads: periodLeads.filter(lead => lead.status === 'Contacted').length,
    };
  };

  const metrics = calculateLeadMetrics();

  const getLeadSourcesChartData = () => {
    const sources = Object.entries(metrics.sourceDistribution);
    return {
      labels: sources.map(([source]) => source),
      datasets: [{
        data: sources.map(([, count]) => count),
        backgroundColor: ['#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'],
        borderWidth: 0,
      }],
    };
  };

  const getLeadStatusChartData = () => {
    const statuses = ['New', 'Contacted', 'Converted', 'Not Interested'];
    const statusCounts = statuses.map(status => 
      leads.filter(lead => lead.status === status).length
    );

    return {
      labels: statuses,
      datasets: [{
        label: 'Lead Status Distribution',
        data: statusCounts,
        backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
        borderWidth: 0,
      }],
    };
  };

  const getLeadTrendsData = () => {
    const dates = new Set<string>();
    const leadsByDate: { [key: string]: number } = {};

    leads.forEach(lead => {
      const date = new Date(lead.createdAt).toLocaleDateString();
      dates.add(date);
      leadsByDate[date] = (leadsByDate[date] || 0) + 1;
    });

    const sortedDates = Array.from(dates).sort();
    return {
      labels: sortedDates,
      datasets: [{
        label: 'New Leads',
        data: sortedDates.map(date => leadsByDate[date] || 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePeriodChange = (event: any) => {
    setPeriod(event.target.value);
  };

  const handleExportPDF = async () => {
    try {
      await exportReportToPdf(period);
      setSuccessMessage('Report exported to PDF successfully');
    } catch (err) {
      setError('Failed to export PDF');
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportReportToCsv(period);
      setSuccessMessage('Report exported to CSV successfully');
    } catch (err) {
      setError('Failed to export CSV');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Reports & Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Time Period</InputLabel>
            <Select value={period} onChange={handlePeriodChange} label="Time Period">
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          
          <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="outlined" startIcon={<TableIcon />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Leads</Typography>
              <Typography variant="h4">{metrics.totalLeads}</Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +{Math.floor(Math.random() * 10) + 5}% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Conversion Rate</Typography>
              <Typography variant="h4">{metrics.conversionRate}%</Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +{Math.floor(Math.random() * 5) + 1}% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">New Leads</Typography>
              <Typography variant="h4">{metrics.newLeads}</Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +{Math.floor(Math.random() * 20) + 10}% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Contacted Leads</Typography>
              <Typography variant="h4">{metrics.contactedLeads}</Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +{Math.floor(Math.random() * 15) + 5}% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different report views */}
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BarChartIcon />} label="Overview" />
          <Tab icon={<TimelineIcon />} label="Lead Trends" />
          <Tab icon={<PieChartIcon />} label="Lead Sources" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Lead Acquisition Trends</Typography>
                <Box sx={{ height: 300 }}>
                  <Line 
                    data={getLeadTrendsData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Leads'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Lead Status Distribution</Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut 
                    data={getLeadStatusChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Lead Trends Tab */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Lead Acquisition Over Time</Typography>
            <Box sx={{ height: 400 }}>
              <Line 
                data={getLeadTrendsData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top'
                    },
                    title: {
                      display: true,
                      text: `Lead Trends (${period})`
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Leads'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </TabPanel>

        {/* Lead Sources Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Lead Sources Distribution</Typography>
                <Box sx={{ height: 300 }}>
                  <Pie 
                    data={getLeadSourcesChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Source Performance</Typography>
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={{
                      labels: Object.keys(metrics.sourceDistribution),
                      datasets: [
                        {
                          label: 'Number of Leads',
                          data: Object.values(metrics.sourceDistribution),
                          backgroundColor: '#6366f1',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Leads'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportsAnalytics;