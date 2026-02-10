"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Activity,
  Wifi,
  BarChart,
  Clock,
  TrendingUp,
  Package,
  Database,
  Shield,
  RefreshCw,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/UI/Card";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

// Helper functions di luar komponen untuk menghindari redefinisi
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const getTimeAgo = (dateString) => {
  if (!dateString) return "Baru saja";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return `${Math.floor(diffDays / 7)} minggu lalu`;
};

const calculateDailyDataUsage = (activeCustomers) => {
  const totalGB = activeCustomers * 2;
  if (totalGB >= 1000) {
    return `${(totalGB / 1000).toFixed(1)} TB`;
  }
  return `${totalGB} GB`;
};

// Default data structure untuk menghindari undefined
const DEFAULT_DASHBOARD_DATA = {
  billing: {
    totalCustomers: 0,
    activeCustomers: 0,
    expiredCustomers: 0,
    suspendedCustomers: 0,
    inactiveCustomers: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    revenueChangePercentage: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    paidInvoices: 0,
    cancelledInvoices: 0,
    totalInvoices: 0,
    avgInvoiceAmount: 0,
    collectionRate: 0,
    totalRevenue: 0,
    formattedMonthlyRevenue: "Rp 0",
    formattedTotalRevenue: "Rp 0",
  },
  radius: {
    activeSessions: 0,
    totalUsers: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    dataUsageToday: "0 GB",
  },
  system: {
    status: "loading",
    database: "loading",
    radiusServer: "loading",
    scheduler: "loading",
  },
  recentActivities: [],
  paymentMethodBreakdown: [],
  revenueTrends: [],
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(DEFAULT_DASHBOARD_DATA);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/dashboard/stats");

      if (response.data?.success) {
        const data = response.data.data || {};

        console.log("📊 Dashboard data loaded:", data);

        // Parse data dengan null safety
        const billingData = data.billing || {};
        const revenueChangePercentage =
          parseFloat(billingData.revenue_change_percentage) || 0;
        const collectionRate = parseFloat(billingData.collection_rate) || 0;

        // Perbaikan: Update state secara aman dengan spread operator
        setDashboardData((prev) => ({
          ...prev,
          billing: {
            totalCustomers: billingData.total_customers || 0,
            activeCustomers: billingData.active_customers || 0,
            expiredCustomers: billingData.expired_customers || 0,
            suspendedCustomers: billingData.suspended_customers || 0,
            inactiveCustomers: billingData.inactive_customers || 0,
            monthlyRevenue: billingData.monthly_revenue || 0,
            lastMonthRevenue: billingData.last_month_revenue || 0,
            revenueChangePercentage: revenueChangePercentage,
            pendingInvoices: billingData.pending_invoices || 0,
            overdueInvoices: billingData.overdue_invoices || 0,
            paidInvoices: billingData.paid_invoices || 0,
            cancelledInvoices: billingData.cancelled_invoices || 0,
            totalInvoices: billingData.total_invoices || 0,
            avgInvoiceAmount: billingData.avg_invoice_amount || 0,
            collectionRate: collectionRate,
            totalRevenue: billingData.total_revenue || 0,
            formattedMonthlyRevenue: formatCurrency(
              billingData.monthly_revenue,
            ),
            formattedTotalRevenue: formatCurrency(billingData.total_revenue),
          },
          radius: {
            activeSessions: data.radius?.active_sessions || 0,
            totalUsers: data.radius?.total_users || 0,
            onlineUsers: data.radius?.online_users || 0,
            offlineUsers: data.radius?.offline_users || 0,
            dataUsageToday: calculateDailyDataUsage(
              data.radius?.online_users || 0,
            ),
          },
          system: {
            status: data.system?.status || "offline",
            database: data.system?.database || "disconnected",
            radiusServer: data.system?.radius_server || "offline",
            scheduler: data.system?.scheduler || "stopped",
          },
          paymentMethodBreakdown: data.payment_method_breakdown || [],
          recentActivities: data.recent_activities || [],
          revenueTrends: data.revenue_trends || [],
        }));
      } else {
        throw new Error("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  // Gunakan data dari state dengan fallback ke default
  const billing = dashboardData?.billing || DEFAULT_DASHBOARD_DATA.billing;
  const radius = dashboardData?.radius || DEFAULT_DASHBOARD_DATA.radius;
  const system = dashboardData?.system || DEFAULT_DASHBOARD_DATA.system;
  const recentActivities = dashboardData?.recentActivities || [];
  const revenueTrends = dashboardData?.revenueTrends || [];

  // Update billingStats dengan safe access
  const billingStats = [
    {
      label: "Total Pelanggan",
      value: billing.totalCustomers?.toString() || "0",
      icon: Users,
      color: "blue",
      change:
        billing.totalCustomers > 0
          ? { value: "+5%", isPositive: true }
          : { value: "0%", isPositive: false },
    },
    {
      label: "Pendapatan Bulan Ini",
      value: billing.formattedMonthlyRevenue || "Rp 0",
      icon: DollarSign,
      color: "green",
      change: {
        value:
          billing.revenueChangePercentage != null
            ? `${billing.revenueChangePercentage >= 0 ? "+" : ""}${Math.abs(billing.revenueChangePercentage).toFixed(1)}%`
            : "0.0%",
        isPositive: billing.revenueChangePercentage >= 0,
      },
    },
    {
      label: "Invoice Tertunda",
      value: billing.pendingInvoices?.toString() || "0",
      icon: CreditCard,
      color: "orange",
      change: {
        value: billing.pendingInvoices > 0 ? "+2%" : "0%",
        isPositive: false,
      },
    },
    {
      label: "Pelanggan Aktif",
      value: billing.activeCustomers?.toString() || "0",
      icon: CheckCircle,
      color: "green",
      change: {
        value: billing.activeCustomers > 0 ? "+3%" : "0%",
        isPositive: true,
      },
    },
  ];

  const radiusStats = [
    {
      label: "Sesi Aktif",
      value: radius.activeSessions?.toString() || "0",
      icon: Activity,
      color: "purple",
      change: {
        value: "+15%",
        isPositive: true,
      },
    },
    {
      label: "Total User RADIUS",
      value: radius.totalUsers?.toString() || "0",
      icon: Users,
      color: "blue",
      change: {
        value: "+10%",
        isPositive: true,
      },
    },
    {
      label: "User Online",
      value: radius.onlineUsers?.toString() || "0",
      icon: UserCheck,
      color: "green",
      change: {
        value: "+22%",
        isPositive: true,
      },
    },
    {
      label: "Data Hari Ini",
      value: radius.dataUsageToday || "0 GB",
      icon: Database,
      color: "indigo",
      change: {
        value: "+18%",
        isPositive: true,
      },
    },
  ];

  // Additional customer stats
  const customerStats = [
    {
      label: "Expired",
      value: billing.expiredCustomers?.toString() || "0",
      icon: AlertTriangle,
      color: "red",
      change: {
        value: "+2%",
        isPositive: false,
      },
    },
    {
      label: "Suspended",
      value: billing.suspendedCustomers?.toString() || "0",
      icon: UserX,
      color: "orange",
      change: {
        value: "-1%",
        isPositive: true,
      },
    },
    {
      label: "Inactive",
      value: billing.inactiveCustomers?.toString() || "0",
      icon: UserX,
      color: "gray",
      change: {
        value: "0%",
        isPositive: false,
      },
    },
    {
      label: "Total Invoice",
      value: billing.totalInvoices?.toString() || "0",
      icon: CreditCard,
      color: "blue",
      change: {
        value: "+15%",
        isPositive: true,
      },
    },
  ];

  const quickLinks = [
    {
      title: "Tambah Pelanggan",
      href: "/dashboard/billing/customers",
      icon: Users,
      color: "blue",
    },
    {
      title: "Buat Invoice",
      href: "/dashboard/billing/invoices",
      icon: CreditCard,
      color: "green",
    },
    {
      title: "Lihat Transaksi",
      href: "/dashboard/billing/transactions",
      icon: DollarSign,
      color: "purple",
    },
    {
      title: "Monitoring",
      href: "/dashboard/radius/sessions",
      icon: Activity,
      color: "orange",
    },
  ];

  const systemStatus = [
    {
      label: "Billing System",
      status: system.status || "loading",
      icon: CreditCard,
      description: "Operasional normal",
      color: (system.status || "loading") === "online" ? "green" : "red",
    },
    {
      label: "RADIUS Server",
      status: system.radiusServer || "loading",
      icon: Wifi,
      description: "Authentication service",
      color: (system.radiusServer || "loading") === "online" ? "green" : "red",
    },
    {
      label: "Database",
      status: system.database || "loading",
      icon: Database,
      description: "MySQL 8.0",
      color: (system.database || "loading") === "connected" ? "green" : "red",
    },
    {
      label: "Scheduler Jobs",
      status: system.scheduler || "loading",
      icon: Clock,
      description: "Auto-suspend & billing",
      color: (system.scheduler || "loading") === "running" ? "green" : "orange",
    },
  ];

  // Invoice stats dengan safe access
  const invoiceStats = [
    {
      label: "Invoice Dibayar",
      value: billing.paidInvoices?.toString() || "0",
      icon: CheckCircle,
      color: "green",
      change: { value: "+15%", isPositive: true },
    },
    {
      label: "Invoice Overdue",
      value: billing.overdueInvoices?.toString() || "0",
      icon: AlertTriangle,
      color: "red",
      change: { value: "-3%", isPositive: true },
    },
    {
      label: "Rata-rata Invoice",
      value: formatCurrency(billing.avgInvoiceAmount),
      icon: BarChart,
      color: "blue",
      change: { value: "+5%", isPositive: true },
    },
    {
      label: "Collection Rate",
      value: `${(billing.collectionRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "purple",
      change: { value: "+2%", isPositive: true },
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Loading
          </button>
        </div>

        {/* Show static data as fallback */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Utama
              </h1>
              <p className="text-gray-600">
                Ringkasan sistem WiFi Billing & RADIUS
              </p>
            </div>
          </div>
          <p className="text-gray-500">
            Dashboard data will appear here once connection is restored.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:px-6 py-0 space-y-6">
      {/* Header dengan tabs dan refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Utama</h1>
          <p className="text-gray-600">
            Ringkasan sistem WiFi Billing & RADIUS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
            {["overview", "billing", "radius"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "overview" && "Overview"}
                {tab === "billing" && "Billing"}
                {tab === "radius" && "RADIUS"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className={`p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${
              link.color === "blue"
                ? "hover:border-blue-200"
                : link.color === "green"
                  ? "hover:border-green-200"
                  : link.color === "purple"
                    ? "hover:border-purple-200"
                    : "hover:border-orange-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  link.color === "blue"
                    ? "bg-blue-50 text-blue-600"
                    : link.color === "green"
                      ? "bg-green-50 text-green-600"
                      : link.color === "purple"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-orange-50 text-orange-600"
                }`}
              >
                <link.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{link.title}</h3>
                <p className="text-sm text-gray-500">Klik untuk akses cepat</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* Stats berdasarkan tab aktif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(activeTab === "overview" || activeTab === "billing") &&
          billingStats.map((stat, index) => (
            <Card key={`billing-${index}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-full ${
                      stat.color === "blue"
                        ? "bg-blue-50"
                        : stat.color === "green"
                          ? "bg-green-50"
                          : stat.color === "orange"
                            ? "bg-orange-50"
                            : "bg-red-50"
                    }`}
                  >
                    <stat.icon
                      className={`w-6 h-6 ${
                        stat.color === "blue"
                          ? "text-blue-600"
                          : stat.color === "green"
                            ? "text-green-600"
                            : stat.color === "orange"
                              ? "text-orange-600"
                              : "text-red-600"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium flex items-center ${
                      stat.change.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change.isPositive ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stat.change.value}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </Card>
          ))}

        {(activeTab === "overview" || activeTab === "radius") &&
          radiusStats.map((stat, index) => (
            <Card key={`radius-${index}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-full ${
                      stat.color === "purple"
                        ? "bg-purple-50"
                        : stat.color === "blue"
                          ? "bg-blue-50"
                          : stat.color === "green"
                            ? "bg-green-50"
                            : "bg-indigo-50"
                    }`}
                  >
                    <stat.icon
                      className={`w-6 h-6 ${
                        stat.color === "purple"
                          ? "text-purple-600"
                          : stat.color === "blue"
                            ? "text-blue-600"
                            : stat.color === "green"
                              ? "text-green-600"
                              : "text-indigo-600"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium flex items-center ${
                      stat.change.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change.isPositive ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stat.change.value}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </Card>
          ))}
      </div>
      {/* Additional Customer Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {customerStats.map((stat, index) => (
          <Card key={`customer-${index}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-full ${
                    stat.color === "blue"
                      ? "bg-blue-50"
                      : stat.color === "green"
                        ? "bg-green-50"
                        : stat.color === "orange"
                          ? "bg-orange-50"
                          : stat.color === "red"
                            ? "bg-red-50"
                            : "bg-gray-50"
                  }`}
                >
                  <stat.icon
                    className={`w-6 h-6 ${
                      stat.color === "blue"
                        ? "text-blue-600"
                        : stat.color === "green"
                          ? "text-green-600"
                          : stat.color === "orange"
                            ? "text-orange-600"
                            : stat.color === "red"
                              ? "text-red-600"
                              : "text-gray-600"
                    }`}
                  />
                </div>
                <span
                  className={`text-sm font-medium flex items-center ${
                    stat.change.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change.isPositive ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {stat.change.value}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>
      {/* Revenue Trends Section */}
      <Card title="Trend Pendapatan 6 Bulan Terakhir">
        <div className="space-y-3">
          {revenueTrends.length > 0 ? (
            revenueTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm">{trend.month}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(trend.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trend.invoice_count} invoice
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Belum ada data tren pendapatan</p>
            </div>
          )}
        </div>
      </Card>
      {/* Invoice Statistics */}
      <Card title="Statistik Invoice">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {billing.pendingInvoices || 0}
            </div>
            <div className="text-sm text-blue-700">Pending</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {billing.paidInvoices || 0}
            </div>
            <div className="text-sm text-green-700">Paid</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {billing.overdueInvoices || 0}
            </div>
            <div className="text-sm text-red-700">Overdue</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {billing.totalInvoices > 0
                ? `${(billing.collectionRate || 0).toFixed(1)}%`
                : "0%"}
            </div>
            <div className="text-sm text-gray-700">Collection Rate</div>
          </div>
        </div>
      </Card>
      {/* Recent Activities & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card title="Aktivitas Terbaru">
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 pb-3 border-b last:border-0"
                >
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === "billing"
                        ? "bg-blue-50"
                        : activity.type === "radius"
                          ? "bg-purple-50"
                          : "bg-gray-50"
                    }`}
                  >
                    {activity.type === "billing" ? (
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    ) : activity.type === "radius" ? (
                      <Wifi className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No recent activities</p>
              </div>
            )}
          </div>
        </Card>

        {/* System Status */}
        <Card title="Status Sistem">
          <div className="space-y-4">
            {systemStatus.map((systemItem, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      systemItem.color === "green"
                        ? "bg-green-50"
                        : systemItem.color === "red"
                          ? "bg-red-50"
                          : "bg-orange-50"
                    }`}
                  >
                    <systemItem.icon
                      className={`w-5 h-5 ${
                        systemItem.color === "green"
                          ? "text-green-600"
                          : systemItem.color === "red"
                            ? "text-red-600"
                            : "text-orange-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{systemItem.label}</p>
                    <p className="text-sm text-gray-500">
                      {systemItem.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 ${
                    systemItem.color === "green"
                      ? "bg-green-100 text-green-800"
                      : systemItem.color === "red"
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                  } text-xs font-medium rounded-full`}
                >
                  {systemItem.status.charAt(0).toUpperCase() +
                    systemItem.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Billing Performance
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Revenue:</span>
                <span className="font-medium">
                  {formatCurrency(billing.monthlyRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Customers:</span>
                <span className="font-medium">
                  {billing.activeCustomers} / {billing.totalCustomers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collection Rate:</span>
                <span className="font-medium">
                  {billing.totalInvoices > 0
                    ? Math.round(
                        (1 -
                          (billing.pendingInvoices || 0) /
                            (billing.totalInvoices || 1)) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Network Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium text-green-600">99.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Sessions:</span>
                <span className="font-medium">{radius.activeSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Usage Today:</span>
                <span className="font-medium">{radius.dataUsageToday}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
