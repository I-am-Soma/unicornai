import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Grid, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { buscarLugares } from '../api/googlePlacesApi';
import { createLead } from '../api/api'; // ← Importar función

interface SearchResult {
  name: string;
  vicinity: string;
  formatted_phone_number?: string;
  website?: string;
  geometry?: {
    location: { lat: number; lng: number };
  };
}

const LeadSearch: React.FC = () => {
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!businessType || !location) {
      alert('Por favor ingresa tipo de negocio y ubicación');
      return;
    }

    setLoading(true);
    try {
      const searchQuery = `${businessType} in ${location}`;
      const data = await buscarLugares(searchQuery);
      setResults(data.results || []);
    } catch (error) {
      console.error('❌ Error searching:', error);
      alert('Error al buscar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleImportLead = async (place: SearchResult) => {
    try {
      // Validar que tenga al menos nombre
      if (!place.name) {
        alert('Este negocio no tiene información suficiente');
        return;
      }

      await createLead({
        name: place.name,
        phone: place.formatted_phone_number || 'N/A',
        email: place.website || '',
        notes: place.vicinity || '',
        source: 'Google Maps',
        status: 'New',
        priority: 'Medium',
        relevance: 'Medium',
        rating: 0,
      });

      alert(`✅ Lead "${place.name}" importado correctamente`);
      
      // Opcional: remover de resultados
      setResults(results.filter(r => r.name !== place.name));
    } catch (error: any) {
      console.error('❌ Error importing lead:', error);
      alert(error.message || 'Error al importar lead');
    }
  };

  return (
    <Paper 
      sx={{ p: 3, mb: 3 }}
      data-tour="search-leads"
    >
      <Box sx={{ mb: 3 }}>
        <h2 style={{ margin: 0 }}>Search & Import Leads</h2>
      </Box>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            label="Business Type"
            placeholder="e.g., Marketing Agency, Restaurant"
            variant="outlined"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            label="Location"
            placeholder="e.g., Ciudad Juárez, Chihuahua"
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{ height: '56px' }}
          >
            {loading ? 'Buscando...' : 'Search & Import'}
          </Button>
        </Grid>
      </Grid>

      {/* Resultados */}
      {results.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <h3>Resultados encontrados: {results.length}</h3>
          {results.map((place, index) => (
            <Paper 
              key={index} 
              sx={{ 
                p: 2, 
                mb: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
              }}
            >
              <Box>
                <strong>{place.name}</strong>
                <br />
                <small style={{ color: '#666' }}>
                  {place.vicinity}
                  {place.formatted_phone_number && ` • ${place.formatted_phone_number}`}
                </small>
              </Box>
              <IconButton 
                color="primary" 
                onClick={() => handleImportLead(place)}
                title="Importar lead"
              >
                <AddIcon />
              </IconButton>
            </Paper>
          ))}
        </Box>
      )}

      {results.length === 0 && businessType && location && !loading && (
        <Box sx={{ mt: 3, textAlign: 'center', color: '#666' }}>
          No se encontraron resultados. Intenta con otra búsqueda.
        </Box>
      )}
    </Paper>
  );
};

export default LeadSearch;
