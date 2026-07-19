import rateLimit from 'express-rate-limit';

/** General API rate limit: 100 requests / 15 min per IP. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Stricter limit for credential attempts. Applied to /login only — /refresh is
 * exercised by every open tab each ~15 min, so sharing this cap would let
 * normal sessions lock an office NAT IP out of logging in.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

/**
 * Public, no-auth resi lookup/download (reference numbers are only a 5-digit
 * random suffix per year — brute-forceable without an account behind them).
 */
export const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many tracking requests. Please try again after 15 minutes.',
  },
});
