import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isTest = env.NODE_ENV === 'test';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 500,
  validate: { default: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errors: [],
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 30, // 30 attempts per 15 minutes
  validate: { default: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
    errors: [],
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTest ? 10000 : 20, // 20 requests per hour per user as per brief
  keyGenerator: (req) => {
    return req.user?._id ? req.user._id.toString() : (req.ip || 'unknown');
  },
  validate: {
    keyGeneratorIpFallback: false,
    default: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI usage quota exceeded: maximum 20 requests per hour per user.',
    errors: [],
  },
});

export default {
  globalLimiter,
  authLimiter,
  aiLimiter,
};
