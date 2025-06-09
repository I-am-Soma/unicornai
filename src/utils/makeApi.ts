// utils/makeApi.ts
import axios from 'axios';

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/aarli33i0iyi7ab8nu1tujse4vmsivwg'; // ✅ usa tu webhook de Make aquí

export const sendSearchToMake = async (searchTerm: string, source: string, location: string) => {
  try {
    const payload = {
      searchTerm,
      source,
      location,
      requestedAt: new Date().toISOString(),
    };

    const response = await axios.post(MAKE_WEBHOOK_URL, payload);
    console.log('Búsqueda enviada a Make:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error enviando búsqueda a Make:', error);
    throw error;
  }
};
