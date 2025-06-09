import express from 'express';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants';
import { searchPlaces } from '../controllers/googlePlacesController';
import { searchBusinesses } from '../controllers/yelpController';
import { searchListings } from '../controllers/yellowPagesController';

const router = express.Router();

const limiter = rateLimit(RATE_LIMIT);
router.use(limiter);

router.get('/places/search', searchPlaces);
router.get('/yelp/search', searchBusinesses);
router.get('/yellowpages/search', searchListings);

export default router;