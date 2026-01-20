// app/providers.js atau file providers Anda
"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "@/components/Layout/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }) {
  // Buat QueryClient instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 menit
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              style: {
                background: "#10b981",
              },
            },
            error: {
              duration: 4000,
              style: {
                background: "#ef4444",
              },
            },
          }}
        />
        <ProtectedRoute>{children}</ProtectedRoute>
      </AuthProvider>
    </QueryClientProvider>
  );
}
