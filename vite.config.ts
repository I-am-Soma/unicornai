import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/google-places': {
        target: 'https://maps.googleapis.com/maps/api/place',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-places/, ''),
      },
      '/api/yelp': {
        target: 'https://api.yelp.com/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yelp/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.VITE_RAPIDAPI_KEY}`,
        },
      },
      '/api/yellow-pages': {
        target: 'https://yellowpage-us.p.rapidapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yellow-pages/, ''),
        headers: {
          'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'yellowpage-us.p.rapidapi.com',
        },
      },
      '/api/google-search': {
        target: 'https://google-search3.p.rapidapi.com/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-search/, ''),
        headers: {
          'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'google-search3.p.rapidapi.com',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});