"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("superadmin@test.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const router = useRouter();

  // Redirect jika sudah login
  useEffect(() => {
    console.log("🔍 LoginPage - Current user:", user);

    const token = localStorage.getItem("access_token");
    const adminData = localStorage.getItem("admin");

    console.log("🔐 Token in storage:", token ? "✅" : "❌");
    console.log("👤 Admin data:", adminData ? "✅" : "❌");

    if (token && adminData && user) {
      console.log("✅ Already logged in, redirecting...");
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    console.log("📤 Submitting login for:", email);

    try {
      const result = await login(email, password);

      if (!result.success) {
        console.error("❌ Login failed:", result.message);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error("Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Debug info
  useEffect(() => {
    console.log("🎯 Login Page Mounted");
    console.log("🌐 API URL:", process.env.NEXT_PUBLIC_API_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Billing WiFi</h1>
            <p className="text-gray-600 mt-2">Admin Dashboard Login</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@wifi.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Debug Section (Development only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                🐛 Debug Information
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>API URL:</span>
                  <span className="font-mono">
                    {process.env.NEXT_PUBLIC_API_URL}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LocalStorage Token:</span>
                  <span>
                    {localStorage.getItem("access_token") ? "✅" : "❌"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LocalStorage Admin:</span>
                  <span>{localStorage.getItem("admin") ? "✅" : "❌"}</span>
                </div>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full mt-2 py-1 px-3 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                >
                  Clear Storage & Reload
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Billing WiFi System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
