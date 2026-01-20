"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Layout/Sidebar";
import Navbar from "@/components/Layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("🏠 DashboardLayout - Auth status:", {
      user: user ? "✅" : "❌",
      loading,
      token: localStorage.getItem("access_token") ? "✅" : "❌",
    });

    // Jika tidak loading dan tidak ada user (setelah semua pengecekan)
    if (!loading && !user) {
      console.log("🚫 No user in DashboardLayout, checking localStorage...");

      const token = localStorage.getItem("access_token");
      const adminData = localStorage.getItem("admin");

      if (!token || !adminData) {
        console.log("⚠️  No auth data found, redirecting to login");
        router.push("/auth/login");
      }
    }
  }, [user, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Jika tidak ada user (seharusnya sudah redirect di useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <div className="flex h-full pt-16">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content (SATU-SATUNYA YANG SCROLL) */}
        <main className="flex-1 overflow-y-auto px-4 py-12">{children}</main>
      </div>
    </div>
  );
}
