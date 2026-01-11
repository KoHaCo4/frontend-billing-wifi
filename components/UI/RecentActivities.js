"use client";

import React from "react";
import {
  Activity,
  User,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  formatDateTime,
  formatRelativeTime,
  truncateText,
} from "@/utils/format";

const RecentActivities = ({
  activities = [],
  loading = false,
  maxItems = 10,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Aktivitas Terbaru
          </h3>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Aktivitas Terbaru
          </h3>
        </div>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada aktivitas</p>
        </div>
      </div>
    );
  }

  const getActionIcon = (action) => {
    switch (action) {
      case "create_customer":
      case "create_package":
      case "create_invoice":
        return <User className="w-4 h-4 text-green-600" />;
      case "update_customer":
      case "update_package":
      case "update_invoice":
        return <Edit className="w-4 h-4 text-blue-600" />;
      case "delete_customer":
      case "delete_package":
      case "delete_invoice":
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case "payment_received":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "invoice_overdue":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "customer_expired":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    if (action.includes("create")) return "bg-green-100 text-green-800";
    if (action.includes("update")) return "bg-blue-100 text-blue-800";
    if (action.includes("delete")) return "bg-red-100 text-red-800";
    if (action.includes("payment")) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatActionText = (action) => {
    const actions = {
      create_customer: "Tambah Pelanggan",
      update_customer: "Update Pelanggan",
      delete_customer: "Hapus Pelanggan",
      create_invoice: "Buat Invoice",
      update_invoice: "Update Invoice",
      delete_invoice: "Hapus Invoice",
      payment_received: "Pembayaran Diterima",
      invoice_overdue: "Invoice Terlambat",
      customer_expired: "Pelanggan Kadaluarsa",
      auto_suspend: "Auto Suspend",
      auto_extend: "Auto Extend",
      mikrotik_error: "Error MikroTik",
    };
    return actions[action] || action.replace("_", " ");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Aktivitas Terbaru
          </h3>
        </div>
        <span className="text-sm text-gray-500">
          {activities.length} aktivitas
        </span>
      </div>

      <div className="space-y-4">
        {activities.slice(0, maxItems).map((activity, index) => (
          <div
            key={index}
            className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getActionIcon(activity.action)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getActionColor(
                      activity.action
                    )}`}
                  >
                    {formatActionText(activity.action)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  {truncateText(activity.description, 100)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {activity.source === "admin" && activity.admin_name ? (
                      <>
                        <User className="w-3 h-3" />
                        <span>{activity.admin_name}</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3 h-3" />
                        <span>Sistem</span>
                      </>
                    )}
                  </div>
                  <span>{formatDateTime(activity.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;
