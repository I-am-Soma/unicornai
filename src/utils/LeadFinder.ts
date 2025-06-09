const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export async function buscarLeads(lat: number, lng: number, categoria: string = "marketing", radio: number = 5000) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radio}&keyword=${categoria}&key=${GOOGLE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error al obtener datos de Google Places");

        const data = await response.json();
        
        if (data.status !== "OK") {
            console.error("Error en respuesta API:", data);
            return { error: "No se encontraron leads." };
        }

        // Extraer los leads relevantes
        const leads = data.results.map((place: any) => ({
            nombre: place.name,
            direccion: place.vicinity || "No disponible",
            categoria: categoria,
            rating: place.rating || "Sin calificación",
            total_reviews: place.user_ratings_total || 0,
            lugar_id: place.place_id
        }));

        return leads;
    } catch (error) {
        console.error("Error en Google Places API:", error);
        return { error: "No se pudo obtener leads." };
    }
}
