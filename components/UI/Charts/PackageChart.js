"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/utils/format";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function PackageChart({ data }) {
  const chartData = data.map((item) => ({
    name: item.package_name,
    customers: item.customer_count,
    revenue: (item.customer_count * (item.price || 0)).toFixed(2),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Tidak ada data paket</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(value, name) => {
            if (name === "customers") return [value, "Pelanggan"];
            if (name === "revenue") return [formatCurrency(value), "Revenue"];
            return [value, name];
          }}
          labelFormatter={(label) => `Paket: ${label}`}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="customers"
          name="Jumlah Pelanggan"
          fill="#8884d8"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
        <Bar
          yAxisId="right"
          dataKey="revenue"
          name="Revenue Potensial"
          fill="#82ca9d"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
