import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { sendLeadRequestToMake } from '../api/leadsApi';

const LeadRequestForm = () => {
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!businessType || !location) {
      alert('Please fill in both fields');
      return;
    }

    setLoading(true);
    try {
      const result = await sendLeadRequestToMake({
        business_type: businessType,
        location,
      });
      setResponse(result);
      alert('Request sent to Make successfully!');
      setBusinessType('');
      setLocation('');
    } catch (error) {
      alert('An error occurred while sending data to Make.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(to right bottom, #ffffff, #fafafa)' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Request Leads from Make
        </Typography>
        <TextField
          label="Business Type (Giro)"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          sx={{ mb: 2, width: '100%' }}
        />
        <TextField
          label="Location (Ubicación)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ mb: 2, width: '100%' }}
        />
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Search and Send to Make'}
        </Button>
      </Paper>
      {response && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1">Response from Make:</Typography>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </Box>
      )}
    </Box>
  );
};

export default LeadRequestForm;

