import toast from "react-hot-toast";

/**
 * Zentralisierte Error-Handling Utility
 * Konvertiert verschiedene Error-Typen zu benutzerfreundlichen Meldungen
 */

export const handleApiError = (error, context = "") => {
  let message = "Ein Fehler ist aufgetreten";
  let severity = "error";

  if (error.response) {
    // HTTP Error mit Response
    const { status, data } = error.response;

    switch (status) {
      case 400:
        message = data?.message || "Ungültige Anfrage";
        severity = "warning";
        break;
      case 401:
        message = "Sie müssen sich anmelden";
        severity = "warning";
        // TODO: Logout & Redirect
        break;
      case 403:
        message = "Sie haben keine Berechtigung";
        severity = "error";
        break;
      case 404:
        message = "Ressource nicht gefunden";
        severity = "warning";
        break;
      case 429:
        message = "Zu viele Anfragen, bitte warten Sie";
        severity = "warning";
        break;
      case 500:
        message = data?.message || "Serverfehler, bitte später versuchen";
        severity = "error";
        break;
      default:
        message = data?.message || `Fehler ${status}`;
    }
  } else if (error.request) {
    // Request wurde gesendet, aber keine Response
    message = "Keine Antwort vom Server. Bitte überprüfen Sie die Verbindung";
    severity = "error";
  } else if (error.message === "Network Error") {
    message = "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung";
    severity = "error";
  } else {
    message = error.message || "Unbekannter Fehler";
  }

  // Log mit Context
  console.error(`[${context}] ${message}`, error);

  return { message, severity };
};

/**
 * Zeige Error-Toast
 */
export const showErrorToast = (error, context = "") => {
  const { message, severity } = handleApiError(error, context);

  if (severity === "error") {
    toast.error(message);
  } else if (severity === "warning") {
    toast.loading(message);
  } else {
    toast(message);
  }

  return message;
};

/**
 * Retry-Mechanism für fehlgeschlagene API-Calls
 */
export const retryRequest = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Retry nur bei bestimmten Errors
      if (error.response?.status === 429 || error.code === "ECONNABORTED") {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(
          `Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Nicht-wiederholbare Fehler sofort werfen
        throw error;
      }
    }
  }

  throw lastError;
};

/**
 * Promise.retry mit Timeout
 */
export const withTimeout = (promise, timeoutMs = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    ),
  ]);
};

/**
 * Cached API-Call (mit localStorage)
 */
export const getCachedOrFetch = async (
  key,
  fetchFn,
  cacheDurationMs = 5 * 60 * 1000
) => {
  const cached = localStorage.getItem(`cache_${key}`);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < cacheDurationMs) {
      return data;
    }
  }

  try {
    const data = await fetchFn();
    localStorage.setItem(
      `cache_${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
    return data;
  } catch (error) {
    // Fallback auf alte Cache wenn fetch fehlschlägt
    if (cached) {
      return JSON.parse(cached).data;
    }
    throw error;
  }
};

/**
 * Clear Cache
 */
export const clearCache = (key) => {
  localStorage.removeItem(`cache_${key}`);
};

/**
 * Offline-Detektion
 */
export const isOnline = () => {
  return navigator.onLine && typeof window !== "undefined";
};

/**
 * Queue für Offline-Requests
 */
class RequestQueue {
  constructor() {
    this.queue = [];
  }

  add(request) {
    this.queue.push({
      ...request,
      timestamp: Date.now(),
    });
    this.persist();
  }

  persist() {
    localStorage.setItem("offline_queue", JSON.stringify(this.queue));
  }

  load() {
    const stored = localStorage.getItem("offline_queue");
    this.queue = stored ? JSON.parse(stored) : [];
  }

  async flush(executor) {
    this.load();
    for (const request of this.queue) {
      try {
        await executor(request);
        this.queue = this.queue.filter((r) => r.timestamp !== request.timestamp);
      } catch (error) {
        console.error("Request queue flush error:", error);
        break;
      }
    }
    this.persist();
  }

  clear() {
    this.queue = [];
    localStorage.removeItem("offline_queue");
  }
}

export const requestQueue = new RequestQueue();
