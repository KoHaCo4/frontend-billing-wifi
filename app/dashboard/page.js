"use client";

import React from "react";
import {
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  Activity,
  TrendingUp,
  Package,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Components
import StatsCard from "@/components/UI/Charts/StatsChart";
import RevenueChart from "@/components/UI/Charts/RevenueChart";
import CustomerChart from "@/components/UI/Charts/CustomerChart";
import StatusChart from "@/components/UI/Charts/StatusChart";
import RecentActivities from "@/components/UI/RecentActivities";
import QuickActions from "@/components/UI/QuickActions";
import Notifications from "@/components/UI/Notifications";

// Hooks
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrency, formatNumber } from "@/utils/format";

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data, summary, charts, details, isLoading, isError, refetch } =
    useDashboardStats({
      refetchInterval: 60000, // Refresh setiap 1 menit
    });

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries(["dashboard-stats"]);
  };

  // Stats cards configuration
  const statsCards = [
    {
      title: "Total Pelanggan",
      value: summary.total_customers || 0,
      icon: Users,
      color: "blue",
      subtext: `${summary.active_customers || 0} aktif`,
    },
    {
      title: "Pendapatan Bulan Ini",
      value: formatCurrency(summary.monthly_revenue || 0),
      icon: DollarSign,
      color: "green",
      subtext: "Bulan berjalan",
    },
    {
      title: "Tagihan Tertunda",
      value: summary.pending_invoices || 0,
      icon: Clock,
      color: "orange",
      subtext: `${summary.overdue_invoices || 0} terlambat`,
    },
    {
      title: "Akan Kadaluarsa",
      value: summary.expiring_soon || 0,
      icon: AlertCircle,
      color: "red",
      subtext: "Dalam 7 hari",
    },
  ];

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Gagal Memuat Dashboard
          </h2>
          <p className="text-red-600 mb-4">
            Terjadi kesalahan saat memuat data statistik
          </p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Ringkasan statistik dan monitoring sistem WiFi billing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Activity className="w-4 h-4" />
            {isLoading ? "Memuat..." : "Refresh"}
          </button>
          <span className="text-xs text-gray-500">
            Terakhir update:{" "}
            {data.updated_at
              ? new Date(data.updated_at).toLocaleTimeString("id-ID")
              : "-"}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            subtext={stat.subtext}
            loading={isLoading}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={charts.revenue_by_month} loading={isLoading} />
        <CustomerChart data={charts.customer_growth} loading={isLoading} />
      </div>

      {/* Status Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart
          title="Status Pelanggan"
          data={charts.customer_status}
          loading={isLoading}
          type="customer"
        />
        <StatusChart
          title="Status Invoice"
          data={charts.invoice_status}
          loading={isLoading}
          type="invoice"
        />
      </div>

      {/* Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Notifications
          expiringSoon={details.expiring_soon || []}
          overdueInvoices={details.overdue_invoices || []}
          loading={isLoading}
        />
        <QuickActions />
      </div>

      {/* Recent Activities */}
      <RecentActivities
        activities={details.recent_activities || []}
        loading={isLoading}
        maxItems={10}
      />

      {/* System Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Informasi Sistem
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Paket Tersedia</p>
            <p className="text-xl font-bold text-gray-900">
              {details.top_packages?.length || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Transaksi/Bulan</p>
            <p className="text-xl font-bold text-gray-900">
              {formatNumber(
                charts.revenue_by_month?.[0]?.transaction_count || 0
              )}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Metode Bayar</p>
            <p className="text-xl font-bold text-gray-900">
              {formatNumber(charts.payment_methods?.length || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Top Package</p>
            <p className="text-xl font-bold text-gray-900 truncate">
              {details.top_packages?.[0]?.name || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
