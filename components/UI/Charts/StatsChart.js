"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Sen", customers: 45 },
  { name: "Sel", customers: 52 },
  { name: "Rab", customers: 49 },
  { name: "Kam", customers: 61 },
  { name: "Jum", customers: 55 },
  { name: "Sab", customers: 48 },
  { name: "Min", customers: 41 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="font-medium text-gray-900">{`${label}`}</p>
        <p className="text-green-600">{`Customers: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function StatsChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="customers" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
