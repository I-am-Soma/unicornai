import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { business_type, location } = req.body;

    const webhookURL = 'https://hook.us2.make.com/dw0dhfzsitxih2xkynu67soy7ewimqak'; // Reemplázala con la URL de Make

    const response = await axios.post(webhookURL, {
      business_type: business_type || 'restaurant',
      location: location || 'New York, USA'
    });

    res.status(200).json({ message: 'Solicitud enviada correctamente a Make', data: response.data });
  } catch (error) {
    console.error('Error enviando a Make:', error);
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
}
