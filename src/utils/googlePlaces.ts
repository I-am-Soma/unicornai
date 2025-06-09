import axios from 'axios';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

export async function buscarLugares(keyword: string, lat: number = 31.739, lng: number = -106.485, radius: number = 5000) {
    if (!GOOGLE_API_KEY) {
        console.error("❌ No se encontró la API Key de Google Places");
        return { error: "API Key no configurada", results: [] };
    }

    try {
        const url = `/api/google-places/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${GOOGLE_API_KEY}`;
        
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error en Google Places API:", error);
        return { error: "No se pudo obtener datos", results: [] };
    }
}
