import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { buscarLugares } from '../api/googlePlacesApi';

const LeadSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!searchTerm) return;
    const data = await buscarLugares(searchTerm);
    setResults(data.results || []);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={8}>
          <TextField
            fullWidth
            label="Buscar negocios por categoría (Ej. 'Marketing Agency')"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            Buscar Leads
          </Button>
        </Grid>
      </Grid>

      {/* Muestra resultados si hay */}
      {results.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {results.map((place: any, index: number) => (
            <Paper key={index} sx={{ p: 1, mb: 1 }}>
              <strong>{place.name}</strong> - {place.vicinity}
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default LeadSearch;
