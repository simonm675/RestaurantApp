/**
 * Input Validation & Sanitization Utilities
 * Verhindert XSS, SQL Injection, Invalid Input
 */

/**
 * Email Validierung
 */
export const validateEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

/**
 * Passwort Validierung
 * Min 8 Zeichen, mind. 1 Großbuchstabe, 1 Zahl
 */
export const validatePassword = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
};

/**
 * Telefonnummer Validierung
 */
export const validatePhone = (phone) => {
  const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return re.test(phone.replace(/\s/g, ""));
};

/**
 * Adresse Validierung
 */
export const validateAddress = (address) => {
  return address && address.trim().length >= 5;
};

/**
 * String Sanitization (verhindert XSS)
 * Entfernt gefährliche Characters und HTML
 */
export const sanitizeString = (str) => {
  if (!str) return "";

  return str
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/["']/g, (match) => (match === '"' ? "&quot;" : "&#39;")) // Escape quotes
    .trim();
};

/**
 * Sanitize Input für sicheren Zugriff
 */
export const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return sanitizeString(input);
  }

  if (typeof input === "object" && input !== null) {
    const sanitized = Array.isArray(input) ? [...input] : { ...input };

    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "string") {
        sanitized[key] = sanitizeString(sanitized[key]);
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = sanitizeInput(sanitized[key]);
      }
    });

    return sanitized;
  }

  return input;
};

/**
 * Double Submit Prevention
 * Verhindert dass User gleiche Form zweimal submitten
 */
class SubmitGuard {
  constructor(cooldownMs = 1000) {
    this.cooldownMs = cooldownMs;
    this.lastSubmitTime = 0;
  }

  canSubmit() {
    const now = Date.now();
    if (now - this.lastSubmitTime < this.cooldownMs) {
      return false;
    }
    this.lastSubmitTime = now;
    return true;
  }

  reset() {
    this.lastSubmitTime = 0;
  }
}

export const submitGuard = new SubmitGuard(1000);

/**
 * React Hook für Submit Guard
 */
import { useCallback, useState } from "react";

export const useSubmitGuard = (cooldownMs = 1000) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const canSubmit = useCallback(() => {
    const now = Date.now();
    if (now - lastSubmitTime < cooldownMs) {
      return false;
    }
    setLastSubmitTime(now);
    return true;
  }, [lastSubmitTime, cooldownMs]);

  const withGuard = useCallback(
    async (asyncFn) => {
      if (!canSubmit()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await asyncFn();
      } finally {
        setIsSubmitting(false);
      }
    },
    [canSubmit]
  );

  return { isSubmitting, withGuard };
};

/**
 * Validierungs-Schema für Formulare
 */
export const schemas = {
  user: {
    name: (value) => value && value.trim().length >= 2,
    email: validateEmail,
    password: validatePassword,
    phone: validatePhone,
    address: validateAddress,
  },

  order: {
    items: (value) => Array.isArray(value) && value.length > 0,
    deliveryType: (value) => ["delivery", "pickup"].includes(value),
    address: (value) => value && value.trim().length >= 5,
    phone: validatePhone,
  },

  menuItem: {
    name: (value) => value && value.trim().length >= 2,
    price: (value) => !isNaN(value) && parseFloat(value) > 0,
    category: (value) => value && value.trim().length > 0,
  },
};

/**
 * Validiere ganzes Object gegen Schema
 */
export const validateObject = (obj, schema) => {
  const errors = {};

  Object.keys(schema).forEach((key) => {
    if (!schema[key](obj[key])) {
      errors[key] = `Invalid ${key}`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Beispiel Nutzung:
 *
 * const { isValid, errors } = validateObject({
 *   name: "John",
 *   email: "john@example.com",
 *   password: "SecurePass123"
 * }, schemas.user);
 *
 * if (!isValid) {
 *   console.log("Validation errors:", errors);
 * }
 */
