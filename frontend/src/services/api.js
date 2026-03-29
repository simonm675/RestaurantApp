import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const saved = localStorage.getItem("restaurantAuth");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed?.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
});

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
};

export const menuApi = {
  getAll: (params) => api.get("/menu", { params }),
  create: (payload) => api.post("/menu", payload),
  update: (id, payload) => api.put(`/menu/${id}`, payload),
  remove: (id) => api.delete(`/menu/${id}`),
};

export const orderApi = {
  create: (payload) => api.post("/orders", payload),
  getMine: () => api.get("/orders"),
  getAll: (params) => api.get("/orders/admin", { params }),
  getSummary: () => api.get("/orders/admin/summary"),
  updateStatus: (id, payload) => api.put(`/orders/${id}/status`, payload),
};

export const userApi = {
  getAll: () => api.get("/users"),
  getMe: () => api.get("/users/me"),
  updateProfile: (payload) => api.put("/users/profile", payload),
};

export default api;
