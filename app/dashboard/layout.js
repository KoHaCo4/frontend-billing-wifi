"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Layout/Sidebar";
import Navbar from "@/components/Layout/Navbar";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") {
        console.log("🌐 Running on server, skipping auth check");
        return false;
      }

      const token = localStorage.getItem("access_token");
      const adminData = localStorage.getItem("admin");

      console.log("🔐 Layout Auth Check:");
      console.log(
        "- Token:",
        token ? `✅ (${token.substring(0, 20)}...)` : "❌ Missing"
      );
      console.log("- Admin data:", adminData ? "✅ Present" : "❌ Missing");
      console.log("- Full localStorage:", {
        access_token: token ? "***" + token.slice(-10) : null,
        refresh_token: localStorage.getItem("refresh_token")
          ? "***" + localStorage.getItem("refresh_token").slice(-10)
          : null,
        admin: adminData ? JSON.parse(adminData) : null,
      });

      if (!token) {
        console.log("🚫 No access_token found, redirecting to login...");
        return false;
      }

      // Optional: Verifikasi token JWT
      try {
        // Decode JWT untuk cek expiration
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const isExpired = payload.exp * 1000 < Date.now();

          if (isExpired) {
            console.log(
              "⏰ Token expired at:",
              new Date(payload.exp * 1000).toLocaleString()
            );
            console.log("Current time:", new Date().toLocaleString());

            // Coba refresh token
            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken) {
              console.log("🔄 Attempting token refresh...");
              // Anda bisa implement refresh logic di sini
            }

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("admin");
            return false;
          }

          console.log(
            "✅ Token valid, expires:",
            new Date(payload.exp * 1000).toLocaleString()
          );
          console.log("👤 User ID:", payload.id);
          console.log("👤 User email:", payload.email);
        }
      } catch (error) {
        console.error("⚠️ Error decoding token:", error);
        // Lanjutkan saja, backend akan reject jika token invalid
      }

      console.log("✅ Auth check passed");
      return true;
    };

    // Beri sedikit delay untuk memastikan client-side rendering selesai
    const timer = setTimeout(() => {
      const authorized = checkAuth();
      setIsAuthorized(authorized);
      setIsLoading(false);

      if (!authorized) {
        router.push("/auth/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Checking authentication...</p>
        <p className="text-sm text-gray-400">Please wait</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="ml-64 mt-16 p-6 lg:p-8 min-h-[calc(100vh-4rem)] w-[calc(100vw-16rem)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
