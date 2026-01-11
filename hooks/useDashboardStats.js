// hooks/useDashboardStats.js
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { toast } from "react-hot-toast";

// Default/fallback data jika apiClient error
const defaultStats = {
  summary: {
    total_customers: 0,
    active_customers: 0,
    pending_invoices: 0,
    overdue_invoices: 0,
    monthly_revenue: 0,
    expiring_soon: 0,
  },
  charts: {
    revenue_by_month: [],
    customer_growth: [],
    customer_status: [],
    invoice_status: [],
    payment_methods: [],
  },
  details: {
    recent_activities: [],
    expiring_soon: [],
    overdue_invoices: [],
    top_packages: [],
  },
};

export const useDashboardStats = (options = {}) => {
  const {
    refetchInterval = 60000, // 60 seconds - diperpanjang
    enabled = true,
    onSuccess,
    onError,
    retry = 1, // Retry hanya 1 kali jika error
  } = options;

  const query = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        console.log("🔄 Fetching dashboard stats...");
        const response = await apiClient.getDashboardStats();
        console.log("✅ Dashboard stats received:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ Error fetching dashboard stats:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });

        // Jika error 500, return default data dengan flag error
        if (error.response?.status === 500) {
          console.warn("⚠️ Using fallback data for 500 error");
          return {
            success: false,
            message: "Using fallback data due to server error",
            data: defaultStats,
            isFallback: true,
          };
        }
        throw error;
      }
    },
    refetchInterval,
    enabled,
    retry,
    staleTime: 30000, // 30 seconds
    cacheTime: 120000, // 2 minutes
    onSuccess: (data) => {
      console.log("📊 Dashboard stats query success:", data.success);
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      console.error("🚨 Dashboard stats query error:", error);
      // Hanya show toast jika bukan error 500 yang sudah kita handle
      if (error.response?.status !== 500) {
        toast.error("Gagal memuat data dashboard");
      }
      if (onError) onError(error);
    },
  });

  // Extract data dengan fallback
  const responseData = query.data;
  const stats = responseData?.data || defaultStats;
  const isFallback = responseData?.isFallback || false;

  return {
    ...query,
    data: stats,
    summary: stats.summary || {},
    charts: stats.charts || {},
    details: stats.details || {},
    isFallback: isFallback,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// Quick stats hook dengan fallback
export const useQuickStats = (options = {}) => {
  const {
    refetchInterval = 120000, // 2 minutes
    enabled = true,
    retry = 1,
  } = options;

  const defaultQuickStats = {
    total_customers: 0,
    active_customers: 0,
    pending_invoices: 0,
    monthly_revenue: 0,
  };

  return useQuery({
    queryKey: ["quick-stats"],
    queryFn: async () => {
      try {
        const response = await apiClient.getQuickStats();
        return response.data;
      } catch (error) {
        console.error("Quick stats error:", error);
        if (error.response?.status === 500) {
          return {
            success: false,
            data: defaultQuickStats,
            isFallback: true,
          };
        }
        throw error;
      }
    },
    refetchInterval,
    enabled,
    retry,
    staleTime: 60000, // 1 minute
  });
};
