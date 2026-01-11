import axios from "axios";
import { toast } from "react-hot-toast";

// PERBAIKAN: Pastikan baseURL benar
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

console.log("🌐 API Base URL:", baseURL);

// Create axios instance
const api = axios.create({
  baseURL: baseURL, // Tanpa tambahan /api karena sudah di backend routing
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          `📡 ${config.method?.toUpperCase()} ${config.url} - Token attached`
        );
      } else {
        console.log(
          `📡 ${config.method?.toUpperCase()} ${config.url} - No token`
        );
      }
    }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        console.log("🔄 Attempting token refresh...");

        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { tokens } = response.data.data;
        localStorage.setItem("access_token", tokens.accessToken);
        localStorage.setItem("refresh_token", tokens.refreshToken);

        console.log("✅ Token refreshed");

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError.message);
        localStorage.clear();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Export the api instance directly
export { api };

// API functions - gabungan dari kedua versi
const apiClient = {
  // Auth
  login: (data) => api.post("/auth/login", data),
  refreshToken: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  getProfile: () => api.get("/auth/me"),

  // Packages
  getPackages: (params) => api.get("/packages", { params }),
  getPackage: (id) => api.get(`/packages/${id}`),
  createPackage: (data) => api.post("/packages", data),
  updatePackage: (id, data) => api.put(`/packages/${id}`, data),
  deletePackage: (id) => api.delete(`/packages/${id}`),

  // Customers
  getCustomers: (params) => api.get("/customers", { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post("/customers", data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),

  // Invoices
  getInvoices: (params) => api.get("/invoices", { params }),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  createInvoice: (data) => api.post("/invoices", data),
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),

  // Payments
  getPayments: (params) => api.get("/payments", { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post("/payments", data),
  updatePayment: (id, data) => api.put(`/payments/${id}`, data),
  deletePayment: (id) => api.delete(`/payments/${id}`),

  // Routers
  getRouters: (params) => api.get("/routers", { params }),
  getRouter: (id) => api.get(`/routers/${id}`),
  createRouter: (data) => api.post("/routers", data),
  updateRouter: (id, data) => api.put(`/routers/${id}`, data),
  deleteRouter: (id) => api.delete(`/routers/${id}`),
  testRouter: (id) => api.post(`/routers/${id}/test`),

  // Stats
  getDashboardStats: () => api.get("/stats/dashboard"),
  getQuickStats: () => api.get("/stats/quick"),

  // Subscriptions
  getSubscriptions: (params) => api.get("/subscriptions", { params }),
  getSubscription: (id) => api.get(`/subscriptions/${id}`),
  updateSubscription: (id, data) => api.put(`/subscriptions/${id}`, data),

  // Logs
  getLogs: (params) => api.get("/logs", { params }),

  // Admin
  getAdmins: (params) => api.get("/admins", { params }),
  getAdmin: (id) => api.get(`/admins/${id}`),
  updateAdmin: (id, data) => api.put(`/admins/${id}`, data),
};

export default apiClient;
