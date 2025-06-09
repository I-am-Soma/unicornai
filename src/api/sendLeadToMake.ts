// src/api/makeApi.ts
import axios from 'axios';

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/qn218ny6kp3xhlb1ca52mmgp5ld6o4ig';
export const sendLeadToMake = async (leadData: any) => {
  try {
    const response = await axios.post(MAKE_WEBHOOK_URL, leadData);
    console.log('Lead enviado a Make:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al enviar lead a Make:', error);
    throw error;
  }
};
