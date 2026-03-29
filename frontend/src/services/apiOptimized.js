import axios from "axios";
import { retryRequest, getCachedOrFetch, withTimeout } from "./errorHandling";
import logger from "./logger";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ✅ Setup interceptors
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ✅ Auto-inject JWT Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized → Logout
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * Menu API mit Caching
 */
export const menuApi = {
  getAll: () =>
    getCachedOrFetch("menu_all", () => axiosInstance.get("/menu"), 5 * 60 * 1000),

  search: (term) => retryRequest(() => axiosInstance.get("/menu/search", { params: { q: term } })),

  getById: (id) => axiosInstance.get(`/menu/${id}`),

  create: (data) => axiosInstance.post("/menu", data),

  update: (id, data) => axiosInstance.put(`/menu/${id}`, data),

  delete: (id) => axiosInstance.delete(`/menu/${id}`),
};

/**
 * Order API mit Retry & Timeout
 */
export const orderApi = {
  create: (data) =>
    retryRequest(
      () => withTimeout(axiosInstance.post("/orders", data), 15000),
      2 // Max 2 Versuche für Order-Erstellung (kritisch)
    ),

  getAll: (filter = {}) =>
    retryRequest(() => axiosInstance.get("/orders", { params: filter })),

  getUserOrders: (page = 1, limit = 10) =>
    getCachedOrFetch(
      `orders_user_p${page}`,
      () => axiosInstance.get("/orders", { params: { page, limit } }),
      2 * 60 * 1000 // Cache 2 Min
    ),

  getById: (id) => axiosInstance.get(`/orders/${id}`),

  updateStatus: (id, status) =>
    axiosInstance.patch(`/orders/${id}/status`, { status }),

  cancel: (id) =>
    axiosInstance.delete(`/orders/${id}`),

  // ✅ Admin: Summary mit weniger Requests
  getAdminSummary: () =>
    getCachedOrFetch(
      "admin_summary",
      () => axiosInstance.get("/orders/admin/summary"),
      1 * 60 * 1000 // 1 Min Cache
    ),
};

/**
 * Auth API
 */
export const authApi = {
  register: (data) => axiosInstance.post("/auth/register", data),

  login: (email, password) =>
    retryRequest(() => axiosInstance.post("/auth/login", { email, password })),

  getProfile: () =>
    getCachedOrFetch("user_profile", () => axiosInstance.get("/auth/profile"), 10 * 60 * 1000),

  logout: () => axiosInstance.post("/auth/logout"),
};

/**
 * User API
 */
export const userApi = {
  getAll: () => axiosInstance.get("/users"),

  getById: (id) => axiosInstance.get(`/users/${id}`),

  update: (id, data) => axiosInstance.put(`/users/${id}`, data),

  delete: (id) => axiosInstance.delete(`/users/${id}`),
};

/**
 * Health Check - mit Retry
 */
export const healthCheck = async () => {
  try {
    const response = await retryRequest(
      () => withTimeout(axiosInstance.get("/health"), 5000),
      2
    );
    return response.data;
  } catch (error) {
    logger.error("Health check failed:", error);
    throw error;
  }
};

export default axiosInstance;
