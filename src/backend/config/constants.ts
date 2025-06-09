export const API_KEYS = {
  GOOGLE_PLACES: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
  RAPIDAPI: import.meta.env.VITE_RAPIDAPI_KEY,
};

export const API_URLS = {
  GOOGLE_PLACES: 'https://maps.googleapis.com/maps/api/place',
  YELLOW_PAGES: 'https://yellowpage-us.p.rapidapi.com',
  YELP: 'https://yelp.p.rapidapi.com',
  GOOGLE_SEARCH: 'https://google-search3.p.rapidapi.com',
};

export const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
export const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};