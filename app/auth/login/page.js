"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Button from "@/components/UI/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("📤 Sending login request...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      console.log("📥 Response status:", response.status);

      const result = await response.json();
      console.log("📊 Response data:", result);

      if (result.success) {
        // PERBAIKAN: Ambil data dari struktur yang benar
        const { user, tokens } = result.data;
        const { accessToken, refreshToken } = tokens;

        console.log("👤 User data:", user);
        console.log(
          "🔑 Access token:",
          accessToken ? "✅ Present" : "❌ Missing"
        );
        console.log(
          "🔄 Refresh token:",
          refreshToken ? "✅ Present" : "❌ Missing"
        );

        if (accessToken) {
          localStorage.setItem("access_token", accessToken);
          console.log("✅ access_token saved to localStorage");
        }
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
          console.log("✅ refresh_token saved to localStorage");
        }

        // Simpan info admin
        if (user) {
          localStorage.setItem("admin", JSON.stringify(user));
          console.log("👤 Admin data saved to localStorage:", user);
        }

        // DEBUG: Verifikasi penyimpanan
        console.log("🔍 localStorage verification:");
        console.log(
          "- access_token:",
          localStorage.getItem("access_token") ? "✅" : "❌"
        );
        console.log("- admin:", localStorage.getItem("admin"));

        toast.success("Login successful!");

        // Redirect dengan delay kecil untuk memastikan localStorage tersimpan
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error("Network error. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Billing WiFi - Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@wifi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Default: admin@wifi.com / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
