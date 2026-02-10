"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";
import { Badge } from "@/components/UI/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
// Jika Notification belum ada, kita bisa buat komponen sederhana dulu
import Notification from "./TrafficMonitor/Notification";

export default function TrafficMonitor() {
  const [trafficData, setTrafficData] = useState([]);
  const [customerTraffic, setCustomerTraffic] = useState({});
  const [activeSessions, setActiveSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const { lastMessage, isConnected } = useWebSocket();

  // Fungsi untuk fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

      console.log(
        "🔍 Fetching from backend:",
        `${backendUrl}/traffic/sessions/active`,
      );

      const response = await fetch(`${backendUrl}/traffic/sessions/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("📊 Backend response:", data);

      if (data.success) {
        setActiveSessions(data.data);
      } else {
        // Jika backend gagal, gunakan dummy data untuk testing
        console.warn("Backend failed, using dummy data");
        setActiveSessions(getDummyData());
      }
    } catch (error) {
      console.error("Failed to fetch active sessions:", error);
      // Use dummy data for development
      setActiveSessions(getDummyData());
    }
  };

  // Fetch initial active sessions
  useEffect(() => {
    fetchActiveSessions();

    // Poll untuk update sessions setiap 10 detik
    const interval = setInterval(fetchActiveSessions, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "traffic_update":
          setTrafficData((prev) => {
            const newData = [
              ...prev,
              {
                timestamp: new Date().toISOString(),
                ...(lastMessage.data.interfaces?.[0] || {
                  rx_rate: 0,
                  tx_rate: 0,
                }),
              },
            ];
            // Keep last 100 data points
            return newData.slice(-100);
          });
          break;

        case "customer_update":
          setCustomerTraffic((prev) => ({
            ...prev,
            [lastMessage.data.customer_id]: lastMessage.data,
          }));
          break;

        case "system_alert":
          addNotification(lastMessage.data.message, lastMessage.data.level);
          break;
      }
    }
  }, [lastMessage]);

  const addNotification = (message, level = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, level }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return "0.00";
    const mbps = (bytesPerSecond * 8) / (1024 * 1024);
    return mbps.toFixed(2);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  // Calculate total usage
  const totalUsage = Object.values(customerTraffic).reduce(
    (sum, cust) => sum + (cust.current_usage || 0),
    0,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Notifications */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          level={notification.level}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Live Traffic Monitor</span>
            <Badge variant={isConnected ? "success" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Realtime Graph */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                  stroke="#6b7280"
                />
                <YAxis
                  stroke="#6b7280"
                  label={{
                    value: "Mbps",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6b7280" },
                  }}
                  tickFormatter={(value) => formatSpeed(value)}
                />
                <Tooltip
                  formatter={(value) => [`${formatSpeed(value)} Mbps`, "Speed"]}
                  labelFormatter={(label) =>
                    `Time: ${new Date(label).toLocaleTimeString()}`
                  }
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rx_rate"
                  name="Download"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="tx_rate"
                  name="Upload"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active PPPoE Sessions ({activeSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-gray-600 font-medium">
                    Username
                  </th>
                  <th className="text-left p-2 text-gray-600 font-medium">
                    IP Address
                  </th>
                  <th className="text-left p-2 text-gray-600 font-medium">
                    Download
                  </th>
                  <th className="text-left p-2 text-gray-600 font-medium">
                    Upload
                  </th>
                  <th className="text-left p-2 text-gray-600 font-medium">
                    Uptime
                  </th>
                  <th className="text-left p-2 text-gray-600 font-medium">
                    Usage
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.length > 0 ? (
                  activeSessions.map((session, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-2 font-medium">{session.username}</td>
                      <td className="p-2 text-gray-600">
                        {session.ip_address || "N/A"}
                      </td>
                      <td className="p-2">
                        <Badge variant="success">
                          {formatSpeed(session.rx_rate)} Mbps
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="blue">
                          {formatSpeed(session.tx_rate)} Mbps
                        </Badge>
                      </td>
                      <td className="p-2 text-gray-600">
                        {session.uptime || "N/A"}
                      </td>
                      <td className="p-2 font-medium">
                        {formatBytes(
                          (session.rx_bytes || 0) + (session.tx_bytes || 0),
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      Loading active sessions...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Bandwidth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {trafficData.length > 0
                ? formatSpeed(
                    trafficData[trafficData.length - 1]?.rx_rate +
                      trafficData[trafficData.length - 1]?.tx_rate,
                  )
                : "0.00"}{" "}
              Mbps
            </div>
            <p className="text-sm text-gray-500 mt-1">Current usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(customerTraffic).length}
            </div>
            <p className="text-sm text-gray-500 mt-1">Connected now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Data Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(totalUsage)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Total transferred</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dummy data function untuk development
function getDummyData() {
  return [
    {
      username: "customer1",
      ip_address: "192.168.1.100",
      rx_rate: 1024000,
      tx_rate: 512000,
      uptime: "1h 30m",
      rx_bytes: 536870912,
      tx_bytes: 268435456,
      customer: {
        name: "John Doe",
        package_name: "Premium 50Mbps",
        rate_limit: "50M/50M",
      },
      router_name: "Main Router",
      is_registered: true,
    },
    {
      username: "customer2",
      ip_address: "192.168.1.101",
      rx_rate: 2048000,
      tx_rate: 1024000,
      uptime: "2h 15m",
      rx_bytes: 1073741824,
      tx_bytes: 536870912,
      customer: {
        name: "Jane Smith",
        package_name: "Standard 20Mbps",
        rate_limit: "20M/20M",
      },
      router_name: "Main Router",
      is_registered: true,
    },
  ];
}
