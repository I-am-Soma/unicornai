import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// 🔑 Cargar variables de entorno
const SERP_API_KEY = import.meta.env.VITE_SERPAPI_KEY;
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 📌 Inicializar cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📌 Buscar negocios con SerpApi (Google Maps API)
export const buscarNegociosSerpApi = async (query: string, location = "New York") => {
  if (!SERP_API_KEY) {
    console.error("❌ Error: SerpApi Key no está configurada.");
    return [];
  }

  try {
    console.log(`🔍 Buscando en SerpApi... Query="${query}", Location="${location}"`);

    const response = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&hl=es&type=search&api_key=${SERP_API_KEY}`);

    if (!response.ok) {
      throw new Error(`❌ Error HTTP en SerpApi: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.local_results || data.local_results.length === 0) {
      console.warn("⚠️ Advertencia: No se encontraron resultados en SerpApi.");
      return [];
    }

    console.log("✅ Resultados obtenidos de SerpApi:", data.local_results);

    return data.local_results.map((negocio: any) => ({
      id: negocio.place_id || "N/A",
      name: negocio.title || "No name available",
      address: negocio.address || "No address available",
      phone: negocio.phone || "No phone available",
      rating: negocio.rating || "No rating",
      website: negocio.website || "No website",
      source: "SerpApi",
      createdAt: new Date().toISOString(),
      status: "New",
      priority: "Medium",
      notes: `Lead found via SerpApi search`,
    }));
  } catch (error) {
    console.error("❌ Error en buscarNegociosSerpApi:", error);
    return [];
  }
};

// 📌 Buscar lugares con Google Places API
export const buscarLugaresGoogle = async (query: string, lat = 31.739, lng = -106.485) => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("❌ Error: Google Places API Key no está configurada.");
    return [];
  }

  try {
    console.log(`🔍 Buscando en Google Places... Query="${query}", Location="${lat},${lng}"`);

    const response = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      params: {
        location: `${lat},${lng}`,
        radius: 5000,
        keyword: query,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.status !== "OK") {
      console.error(`❌ Google Places API error: ${response.data.status}`);
      return [];
    }

    console.log("✅ Resultados obtenidos de Google Places:", response.data.results);

    return response.data.results.map((place: any) => ({
      id: place.place_id || "N/A",
      name: place.name || "No name available",
      address: place.vicinity || "No address available",
      phone: place.formatted_phone_number || "No phone available",
      rating: place.rating || "No rating",
      website: place.website || "No website",
      source: "Google Places",
      createdAt: new Date().toISOString(),
      status: "New",
      priority: "Medium",
      notes: `Lead found via Google Places`,
    }));
  } catch (error) {
    console.error("❌ Error en Google Places API:", error);
    return [];
  }
};

// 📌 Guardar lead en Supabase
export const saveLead = async (leadData: any) => {
  try {
    console.log("💾 Guardando lead en Supabase:", leadData);

    const { data, error } = await supabase.from("leads").insert([leadData]).select();
    if (error) throw error;

    console.log("✅ Lead guardado con éxito:", data[0]);
    return data[0];
  } catch (error) {
    console.error("❌ Error guardando lead en Supabase:", error);
    return null;
  }
};

// 📌 Obtener leads desde Supabase
export const getLeads = async () => {
  try {
    console.log("📥 Obteniendo leads desde Supabase...");

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("✅ Leads obtenidos con éxito:", data);
    return data || [];
  } catch (error) {
    console.error("❌ Error obteniendo leads desde Supabase:", error);
    return [];
  }
};
