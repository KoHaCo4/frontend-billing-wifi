"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check untuk login page
    if (pathname === "/auth/login") return;

    // Jika tidak loading dan tidak ada user
    if (!loading && !user) {
      console.log("🔒 ProtectedRoute: No user, redirecting to login");

      // Cek localStorage langsung
      const token = localStorage.getItem("access_token");
      const adminData = localStorage.getItem("admin");

      if (!token || !adminData) {
        console.log("🚫 No auth data, redirecting...");
        router.push("/auth/login");
      }
    }
  }, [user, loading, pathname, router]);

  // Show loading while checking
  if (loading && pathname !== "/auth/login") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return children;
}
