const rateLimit = require("express-rate-limit");
const logger = require("../config/logger");

/**
 * Globales Rate Limit nur für schreibende Requests.
 * GET-Endpunkte (z. B. /api/menu) sollen im Restaurantbetrieb nicht blockiert werden.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Zu viele Anfragen, bitte später versuchen",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Zu viele Anfragen",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Striktes Limit für Auth-Endpoints (5 versuche pro 15 min)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Zu viele Login-Versuche",
  skipSuccessfulRequests: true, // Zählt nur fehlgeschlagene Attempts
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ error: "Zu viele Anmeldeversuche, versuchen Sie es später" });
  },
});

/**
 * API-specific Limiter
 */
const apiLimiters = {
  // Order creation: max 10 pro Minute (Spam-Schutz)
  orderCreate: rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: "Zu viele Bestellungen, bitte warten",
  }),

  // Search: max 30 pro Minute
  search: rateLimit({
    windowMs: 60 * 1000,
    max: 30,
  }),

  // User Profile: max 20 pro Minute
  userApi: rateLimit({
    windowMs: 60 * 1000,
    max: 20,
  }),
};

module.exports = {
  globalLimiter,
  authLimiter,
  ...apiLimiters,
};
