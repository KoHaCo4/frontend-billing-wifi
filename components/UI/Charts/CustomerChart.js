"use client";

import React from "react";
import LineChart from "./LineChart";
import { formatNumber } from "@/utils/format";

const CustomerChart = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-80">
        <div className="animate-pulse h-full flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm h-80 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Tidak ada data pelanggan</p>
          <p className="text-sm">
            Data pertumbuhan akan muncul setelah ada pelanggan
          </p>
        </div>
      </div>
    );
  }

  // Format data untuk chart
  const chartData = data.map((item) => ({
    month: item.month,
    new_customers: item.new_customers || 0,
    total_customers: item.total_customers || 0,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Pertumbuhan Pelanggan 6 Bulan Terakhir
      </h3>

      <LineChart
        data={chartData}
        xKey="month"
        yKeys={[
          { dataKey: "new_customers", name: "Pelanggan Baru" },
          { dataKey: "total_customers", name: "Total Pelanggan" },
        ]}
        colors={["#8b5cf6", "#3b82f6"]}
        height={300}
        xAxisFormatter={(value) => {
          // Format: Mar 2024
          const [year, month] = value.split("-");
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Agu",
            "Sep",
            "Okt",
            "Nov",
            "Des",
          ];
          return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
        }}
        yAxisFormatter={formatNumber}
      />
    </div>
  );
};

export default CustomerChart;
