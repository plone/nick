/**
 * Limiter helper.
 * @module helpers/limiter/limiter
 */

// External imports
import { rateLimit } from 'express-rate-limit';

// Internal imports
import config from '../../helpers/config/config';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.settings.rateLimit?.api || 100,
  message: { message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.settings.rateLimit?.auth || 5,
  message: { message: 'Too many authentication attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});
