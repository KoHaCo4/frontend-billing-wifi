// "use client";

// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const data = [
//   { month: "Jan", revenue: 4000 },
//   { month: "Feb", revenue: 3000 },
//   { month: "Mar", revenue: 5000 },
//   { month: "Apr", revenue: 8000 },
//   { month: "May", revenue: 7500 },
//   { month: "Jun", revenue: 12000 },
//   { month: "Jul", revenue: 15000 },
//   { month: "Aug", revenue: 18000 },
//   { month: "Sep", revenue: 20000 },
//   { month: "Oct", revenue: 22000 },
//   { month: "Nov", revenue: 25000 },
//   { month: "Dec", revenue: 28000 },
// ];

// const CustomTooltip = ({ active, payload, label }) => {
//   if (active && payload && payload.length) {
//     return (
//       <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
//         <p className="font-medium text-gray-900">{`${label}`}</p>
//         <p className="text-blue-600">
//           {`Revenue: Rp ${payload[0].value.toLocaleString("id-ID")}`}
//         </p>
//       </div>
//     );
//   }
//   return null;
// };

// export default function RevenueChart() {
//   return (
//     <div className="h-72">
//       <ResponsiveContainer width="100%" height="100%">
//         <LineChart
//           data={data}
//           margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//         >
//           <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//           <XAxis
//             dataKey="month"
//             axisLine={false}
//             tickLine={false}
//             tick={{ fill: "#6b7280" }}
//           />
//           <YAxis
//             axisLine={false}
//             tickLine={false}
//             tick={{ fill: "#6b7280" }}
//             tickFormatter={(value) => `Rp${value / 1000}k`}
//           />
//           <Tooltip content={<CustomTooltip />} />
//           <Line
//             type="monotone"
//             dataKey="revenue"
//             stroke="#3b82f6"
//             strokeWidth={2}
//             dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
//             activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
//           />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }

"use client";

import React from "react";
import LineChart from "./LineChart";
import { formatCurrency } from "@/utils/format";

const RevenueChart = ({ data = [], loading = false }) => {
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
          <p className="text-lg mb-2">Tidak ada data pendapatan</p>
          <p className="text-sm">
            Data pendapatan akan muncul setelah ada transaksi
          </p>
        </div>
      </div>
    );
  }

  // Format data untuk chart
  const chartData = data.map((item) => ({
    month: item.month,
    revenue: parseFloat(item.revenue) || 0,
    transactions: item.transaction_count || 0,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Trend Pendapatan 6 Bulan Terakhir
      </h3>

      <LineChart
        data={chartData}
        xKey="month"
        yKeys={[
          { dataKey: "revenue", name: "Pendapatan" },
          { dataKey: "transactions", name: "Transaksi" },
        ]}
        colors={["#3b82f6", "#10b981"]}
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
        yAxisFormatter={(value) => {
          if (value >= 1000000) return `Rp${(value / 1000000).toFixed(0)}Jt`;
          if (value >= 1000) return `Rp${(value / 1000).toFixed(0)}Rb`;
          return `Rp${value}`;
        }}
        tooltipFormatter={(value) => formatCurrency(value)}
      />
    </div>
  );
};

export default RevenueChart;
