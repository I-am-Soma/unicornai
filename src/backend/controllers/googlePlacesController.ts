import axios from 'axios';
import { Request, Response } from 'express';
import { API_KEYS, API_URLS } from '../config/constants';
import { apiCache } from '../utils/cache';
import { APIError, handleError } from '../utils/errorHandler';

export const searchPlaces = async (req: Request, res: Response) => {
  try {
    const { query, lat, lng, radius = 5000 } = req.query;
    if (!query) throw new APIError('Query parameter is required', 400);

    const cacheKey = `places-${query}-${lat}-${lng}-${radius}`;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const response = await axios.get(`${API_URLS.GOOGLE_PLACES}/nearbysearch/json`, {
      params: {
        location: `${lat},${lng}`,
        radius,
        keyword: query,
        key: API_KEYS.GOOGLE_PLACES,
      },
    });

    if (response.data.status !== 'OK') {
      throw new APIError(
        `Google Places API error: ${response.data.status}`,
        500,
        'Google Places'
      );
    }

    const formattedData = response.data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      types: place.types,
      source: 'Google Places',
    }));

    apiCache.set(cacheKey, formattedData);
    res.json(formattedData);
  } catch (error) {
    handleError(error as Error, res);
  }
};