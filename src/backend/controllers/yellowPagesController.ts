import axios from 'axios';
import { Request, Response } from 'express';
import { API_KEYS, API_URLS } from '../config/constants';
import { apiCache } from '../utils/cache';
import { APIError, handleError } from '../utils/errorHandler';

export const searchListings = async (req: Request, res: Response) => {
  try {
    const { query, location } = req.query;
    if (!query) throw new APIError('Query parameter is required', 400);

    const cacheKey = `yellowpages-${query}-${location}`;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const response = await axios.get(`${API_URLS.YELLOW_PAGES}/search`, {
      headers: {
        'X-RapidAPI-Key': API_KEYS.RAPIDAPI,
        'X-RapidAPI-Host': 'yellowpage-us.p.rapidapi.com',
      },
      params: { query, location },
    });

    const formattedData = response.data.businesses.map((business: any) => ({
      id: business.id,
      name: business.name,
      address: business.address,
      phone: business.phone,
      website: business.website,
      categories: business.categories,
      source: 'Yellow Pages',
    }));

    apiCache.set(cacheKey, formattedData);
    res.json(formattedData);
  } catch (error) {
    handleError(error as Error, res);
  }
};