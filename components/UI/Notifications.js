"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Clock,
  DollarSign,
  UserX,
  CheckCircle,
  X,
} from "lucide-react";
import { formatDate, formatCurrency, formatRelativeTime } from "@/utils/format";
import { useRouter } from "next/navigation";

const Notifications = ({
  expiringSoon = [],
  overdueInvoices = [],
  loading = false,
}) => {
  const [dismissed, setDismissed] = useState([]);
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Notifikasi</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allNotifications = [
    ...expiringSoon.map((item) => ({
      ...item,
      type: "expiring",
      title: "Pelanggan Akan Kadaluarsa",
      message: `${item.name} akan kadaluarsa dalam ${item.days_left} hari`,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      action: () => router.push(`/dashboard/customers/${item.id}`),
    })),
    ...overdueInvoices.map((item) => ({
      ...item,
      type: "overdue",
      title: "Invoice Terlambat",
      message: `Invoice ${item.invoice_number} terlambat ${item.days_overdue} hari`,
      icon: DollarSign,
      color: "text-red-600 bg-red-50 border-red-200",
      action: () => router.push(`/dashboard/invoices/${item.id}`),
    })),
  ].filter((item) => !dismissed.includes(`${item.type}-${item.id}`));

  const handleDismiss = (id, type, e) => {
    e.stopPropagation();
    setDismissed((prev) => [...prev, `${type}-${id}`]);
  };

  if (allNotifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900">Notifikasi</h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Tidak ada notifikasi</p>
          <p className="text-sm text-gray-500 mt-1">
            Semua sistem berjalan normal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Notifikasi</h3>
        </div>
        <span className="text-sm text-gray-500">
          {allNotifications.length} notifikasi
        </span>
      </div>

      <div className="space-y-4">
        {allNotifications.map((notification, index) => {
          const Icon = notification.icon;

          return (
            <div
              key={index}
              onClick={notification.action}
              className={`p-4 rounded-lg border ${notification.color} cursor-pointer hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                        {notification.type === "expiring"
                          ? "Kadaluarsa"
                          : "Terlambat"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {notification.type === "expiring" && (
                        <span>
                          Expires: {formatDate(notification.expired_at)}
                        </span>
                      )}
                      {notification.type === "overdue" && (
                        <span>
                          Amount: {formatCurrency(notification.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) =>
                    handleDismiss(notification.id, notification.type, e)
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
