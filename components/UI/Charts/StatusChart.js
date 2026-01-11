"use client";

import React from "react";
import PieChart from "./PieChart";
import { getStatusColor } from "@/utils/format";

const StatusChart = ({
  title = "Distribusi Status",
  data = [],
  loading = false,
  type = "customer", // 'customer' or 'invoice'
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-80">
        <div className="animate-pulse h-full flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm h-80 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Tidak ada data</p>
          <p className="text-sm">Data akan muncul setelah ada entri</p>
        </div>
      </div>
    );
  }

  // Format data untuk pie chart
  const chartData = data
    .map((item) => ({
      name:
        item.status === "active"
          ? "Aktif"
          : item.status === "expired"
          ? "Kadaluarsa"
          : item.status === "suspended"
          ? "Ditangguhkan"
          : item.status === "pending"
          ? "Tertunda"
          : item.status === "paid"
          ? "Lunas"
          : item.status === "overdue"
          ? "Terlambat"
          : item.status === "cancelled"
          ? "Dibatalkan"
          : item.status,
      value: item.count || 0,
      status: item.status,
    }))
    .filter((item) => item.value > 0);

  // Warna berdasarkan status
  const statusColors = {
    active: "#10b981",
    expired: "#ef4444",
    suspended: "#f59e0b",
    pending: "#3b82f6",
    paid: "#10b981",
    overdue: "#ef4444",
    cancelled: "#6b7280",
  };

  const colors = chartData.map(
    (item) => statusColors[item.status] || "#6b7280"
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>

      <PieChart
        data={chartData}
        colors={colors}
        height={300}
        showLabel={true}
      />

      {/* Status legend */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: colors[index] }}
            ></div>
            <span className="text-sm text-gray-700">{item.name}</span>
            <span className="text-sm font-medium ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusChart;
