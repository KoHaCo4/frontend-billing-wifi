"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user dari localStorage
  useEffect(() => {
    const loadUser = () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("access_token");
      const adminData = localStorage.getItem("admin");

      console.log("🔐 AuthContext - Loading user from localStorage:");
      console.log("- Token exists:", !!token);
      console.log("- Admin data exists:", !!adminData);

      if (token && adminData) {
        try {
          const parsedAdmin = JSON.parse(adminData);
          setUser(parsedAdmin);
          console.log("✅ User loaded:", parsedAdmin.email);
        } catch (error) {
          console.error("❌ Error parsing admin data:", error);
          setUser(null);
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await response.json();
      console.log("🔐 AuthContext Login Result:", result);

      if (result.success) {
        const { user, tokens } = result.data;
        const { accessToken, refreshToken } = tokens;

        // Simpan ke localStorage
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("admin", JSON.stringify(user));

        // Update state
        setUser(user);

        toast.success("Login successful!");
        return { success: true, user };
      } else {
        toast.error(result.message || "Login failed");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error("Network error");
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    console.log("🚪 Logging out...");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("admin");
    setUser(null);
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth: () => {
      const token = localStorage.getItem("access_token");
      const adminData = localStorage.getItem("admin");
      return !!(token && adminData);
    },
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
