"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api"; // Gunakan apiClient yang sudah ada

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fungsi untuk menyimpan token dengan konsisten
  const saveTokens = (accessToken, refreshToken, userData) => {
    // Simpan dengan kedua format untuk kompatibilitas
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("accessToken", accessToken);

    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("refreshToken", refreshToken);
    }

    if (userData) {
      localStorage.setItem("admin", JSON.stringify(userData));
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // Load user dari localStorage pada mount
  useEffect(() => {
    console.log("🔄 AuthContext - Loading user from localStorage");

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    const adminData =
      localStorage.getItem("admin") || localStorage.getItem("user");

    console.log("- Token exists:", !!token);
    console.log("- Admin data exists:", !!adminData);

    if (token && adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        setUser(parsedAdmin);
        setToken(token);
        console.log("✅ User loaded:", parsedAdmin.email);

        // Validasi token dengan memanggil profile
        validateToken(token);
      } catch (error) {
        console.error("❌ Error parsing admin data:", error);
        clearAuth();
      }
    } else {
      console.log("⚠️  No auth data found in localStorage");
      setUser(null);
      setToken(null);
    }

    setLoading(false);
  }, []);

  // Validasi token dengan memanggil endpoint profile
  const validateToken = async (currentToken) => {
    try {
      // Gunakan apiClient yang sudah memiliki interceptor
      const response = await apiClient.getProfile();
      console.log("✅ Token validated");
    } catch (error) {
      console.error("❌ Token validation failed:", error);
      if (error.response?.status === 401) {
        clearAuth();
        if (pathname !== "/auth/login") {
          router.push("/auth/login");
        }
      }
    }
  };

  // Cek auth status saat route berubah
  useEffect(() => {
    console.log("📍 Route changed to:", pathname);

    // Skip untuk route public
    if (pathname === "/auth/login") {
      console.log("ℹ️  Login page, skipping auth check");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    console.log("🔐 Current token:", token ? "✅ Exists" : "❌ Missing");

    if (!token && pathname !== "/auth/login") {
      console.log("🚫 No token, redirecting to login");
      router.push("/auth/login");
    }
  }, [pathname, router]);

  const login = async (email, password) => {
    try {
      console.log("🔐 Attempting login for:", email);

      const response = await apiClient.login({ email, password });

      console.log("📥 Login response:", response.data);

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        // Handle multiple token naming formats
        const accessToken = tokens?.accessToken || tokens?.access_token;
        const refreshToken = tokens?.refreshToken || tokens?.refresh_token;

        console.log(
          "🔑 Access Token:",
          accessToken ? "✅ Received" : "❌ Missing"
        );
        console.log(
          "🔄 Refresh Token:",
          refreshToken ? "✅ Received" : "❌ Missing"
        );

        if (!accessToken) {
          throw new Error("No access token in response");
        }

        // Simpan tokens dengan format konsisten
        saveTokens(accessToken, refreshToken, user);

        // Update state
        setUser(user);
        setToken(accessToken);

        console.log("✅ Login successful, user:", user.email);
        toast.success("Login successful!");

        // Redirect ke dashboard
        setTimeout(() => {
          console.log("🚀 Redirecting to dashboard...");
          router.push("/dashboard");
        }, 100);

        return { success: true, user };
      } else {
        const errorMsg = response.data.message || "Login failed";
        console.error("❌ Login failed:", errorMsg);
        toast.error(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      console.error("❌ Login error:", error);

      let errorMessage = "Network error";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    console.log("🚪 Logging out...");

    try {
      const refreshToken =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("refreshToken");
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("❌ Logout API error:", error);
      // Lanjutkan logout meskipun API call gagal
    }

    clearAuth();
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  const clearAuth = () => {
    // Clear semua kemungkinan key
    localStorage.removeItem("access_token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("admin");
    localStorage.removeItem("user");

    // Clear state
    setUser(null);
    setToken(null);
  };

  const checkAuth = () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    const adminData =
      localStorage.getItem("admin") || localStorage.getItem("user");
    return !!(token && adminData);
  };

  const value = {
    user,
    loading,
    token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    checkAuth,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
