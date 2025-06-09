import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => {
  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: color,
        color: 'white',
        borderRadius: 2,
        height: '100%',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.8 }}>
          {title}
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </Box>
    </Paper>
  );
};

export default StatCard;