// src/components/LeadSearchYelp.tsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Paper, Typography, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem,
  Alert, Snackbar, CircularProgress
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const YELP_WEBHOOK_URL = 'https://hook.us2.make.com/cvd583e1n9yhle4p1ljlot34ajnger7d';

const LeadSearchYelp: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await axios.post(YELP_WEBHOOK_URL, {
        search: searchTerm,
        location,
        maxItems: 20,
        source: "yelp",
      });

      if (response.data && response.data.results) {
        setResults(response.data.results);
        setSuccess('Yelp leads received successfully');
      } else {
        setError('No results returned from Make');
      }
    } catch (err) {
      console.error('Error sending to Make webhook:', err);
      setError('An error occurred while sending data to Make');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Lead Search (Yelp Webhook)</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Search Term"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter business type or keywords"
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State or Country"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {results.map((lead: any, index: number) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">{lead.name}</Typography>
          <Typography variant="body2">{lead.address}</Typography>
          <Typography variant="body2">Phone: {lead.phone}</Typography>
          <Typography variant="body2">Source: {lead.source}</Typography>
        </Paper>
      ))}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadSearchYelp;
