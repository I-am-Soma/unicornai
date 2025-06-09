import axios from 'axios';
import { Request, Response } from 'express';
import { API_KEYS, API_URLS } from '../config/constants';
import { apiCache } from '../utils/cache';
import { APIError, handleError } from '../utils/errorHandler';

export const searchBusinesses = async (req: Request, res: Response) => {
  try {
    const { term, location } = req.query;
    if (!term || !location) {
      throw new APIError('Term and location parameters are required', 400);
    }

    const cacheKey = `yelp-${term}-${location}`;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const response = await axios.get(`${API_URLS.YELP}/businesses/search`, {
      headers: {
        'X-RapidAPI-Key': API_KEYS.RAPIDAPI,
        'X-RapidAPI-Host': 'yelp.p.rapidapi.com',
      },
      params: { term, location },
    });

    const formattedData = response.data.businesses.map((business: any) => ({
      id: business.id,
      name: business.name,
      address: business.location.display_address.join(', '),
      phone: business.phone,
      rating: business.rating,
      reviewCount: business.review_count,
      categories: business.categories.map((cat: any) => cat.title),
      source: 'Yelp',
    }));

    apiCache.set(cacheKey, formattedData);
    res.json(formattedData);
  } catch (error) {
    handleError(error as Error, res);
  }
};