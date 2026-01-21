import axios from "axios";
import { toast } from "react-hot-toast";

const baseURL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` // Tambahkan /api
  : "http://localhost:8080/api";
console.log("🌐 API Base URL:", baseURL);

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Fungsi untuk mendapatkan token dengan fallback
const getAccessToken = () => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken")
    );
  }
  return null;
};

const getRefreshToken = () => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("refresh_token") ||
      localStorage.getItem("refreshToken")
    );
  }
  return null;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        `📡 ${config.method?.toUpperCase()} ${config.url} - Token attached`,
      );
    } else {
      console.log(
        `📡 ${config.method?.toUpperCase()} ${config.url} - No token`,
      );
    }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error.message);
    return Promise.reject(error);
  },
);

// Response interceptor dengan penanganan token expired
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    // Tangani error 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;

      console.log(`🔐 401 Error: ${errorCode} - ${errorMessage}`);

      // Jika token expired, coba refresh
      if (errorCode === "TOKEN_EXPIRED" || errorMessage?.includes("expired")) {
        try {
          const refreshToken = getRefreshToken();

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          console.log("🔄 Attempting token refresh...");

          // Gunakan axios langsung untuk menghindari interceptor loop
          const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken,
          });

          if (refreshResponse.data.success) {
            const { tokens } = refreshResponse.data.data;

            // Simpan token baru
            const newAccessToken = tokens.accessToken || tokens.access_token;
            const newRefreshToken = tokens.refreshToken || tokens.refresh_token;

            localStorage.setItem("access_token", newAccessToken);
            localStorage.setItem("accessToken", newAccessToken);

            if (newRefreshToken) {
              localStorage.setItem("refresh_token", newRefreshToken);
              localStorage.setItem("refreshToken", newRefreshToken);
            }

            console.log("✅ Token refreshed successfully");

            // Update header dengan token baru
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // Retry request original
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError.message);

          // Clear auth dan redirect ke login
          localStorage.removeItem("access_token");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("admin");
          localStorage.removeItem("user");

          toast.error("Session expired. Please login again.");

          if (
            typeof window !== "undefined" &&
            window.location.pathname !== "/auth/login"
          ) {
            window.location.href = "/auth/login";
          }

          return Promise.reject(refreshError);
        }
      } else {
        // Error 401 lainnya (invalid token, no token, etc)
        toast.error("Authentication failed. Please login again.");

        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/auth/login"
        ) {
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

// Export the api instance directly
export { api };

// API functions - gabungan dari kedua versi
const apiClient = {
  // Auth
  login: (data) => api.post("/auth/login", data),
  refreshToken: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
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
  getDashboardStats: () => api.get("/dashboard/stats"),
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

  // Settings
  getSettings: () => api.get("/settings"),
  updateSettings: (data) => api.put("/settings", data),
  getSystemHealth: () => api.get("/settings/health"),

  // Jobs
  runJob: (jobName) => api.post(`/jobs/run/${jobName}`),
};

export default apiClient;
