"use client";

import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatNumber } from "@/utils/format";

const LineChart = ({
  data,
  xKey,
  yKeys,
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
  height = 300,
  showGrid = true,
  showLegend = true,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  title,
}) => {
  const formatYAxis = (value) => {
    if (yAxisFormatter) return yAxisFormatter(value);
    // Auto-format: if values are large, use k/M suffix
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">
            {xAxisFormatter ? xAxisFormatter(label) : label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {tooltipFormatter
                ? tooltipFormatter(entry.value)
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            tickFormatter={xAxisFormatter}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatYAxis} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}

          {yKeys.map((key, index) => (
            <Line
              key={key.name || key}
              type="monotone"
              dataKey={key.dataKey || key}
              name={key.name || key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
