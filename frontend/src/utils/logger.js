/**
 * Frontend Logger Utility
 * Einfaches Logging Tool für Frontend (sichere Daten!)
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[import.meta.env.MODE === "production" ? "warn" : "debug"];

export const logger = {
  debug: (...args) => {
    if (LOG_LEVELS.debug >= currentLevel) {
      console.log("[DEBUG]", ...args);
    }
  },

  info: (...args) => {
    if (LOG_LEVELS.info >= currentLevel) {
      console.log("[INFO]", ...args);
    }
  },

  warn: (...args) => {
    if (LOG_LEVELS.warn >= currentLevel) {
      console.warn("[WARN]", ...args);
    }
  },

  error: (...args) => {
    if (LOG_LEVELS.error >= currentLevel) {
      console.error("[ERROR]", ...args);

      // Optional: Send to backend error tracking (Sentry, LogRocket, etc.)
      if (import.meta.env.VITE_ERROR_TRACKING_ENABLED === "true") {
        // logToBackend(...args);
      }
    }
  },

  // Performance logging
  measure: (label, fn) => {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (duration > 100) {
      console.warn(`[PERF WARN] ${label} took ${duration.toFixed(2)}ms`);
    } else {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }

    return result;
  },

  // Async performance
  measureAsync: async (label, asyncFn) => {
    const start = performance.now();
    const result = await asyncFn();
    const duration = performance.now() - start;

    if (duration > 1000) {
      console.warn(`[PERF WARN] ${label} took ${duration.toFixed(2)}ms`);
    } else {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }

    return result;
  },
};

export default logger;
