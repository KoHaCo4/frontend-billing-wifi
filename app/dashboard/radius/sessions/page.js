"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";

export default function MonitoringPage() {
  const [data, setData] = useState([]);
  const [statistics, setStatistics] = useState({
    total_customers: 0,
    online: 0,
    offline: 0,
    online_percentage: 0,
    total_routers: 0,
  });
  const [routers, setRouters] = useState([]);
  const [selectedRouter, setSelectedRouter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load routers
  useEffect(() => {
    loadRouters();
  }, []);

  // Load monitoring data
  useEffect(() => {
    loadMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadMonitoringData();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [selectedRouter, searchTerm, autoRefresh]);

  const loadRouters = async () => {
    try {
      const response = await api.get("/routers", {
        params: { status: "active", limit: 100 },
      });

      if (response.data.success) {
        setRouters(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load routers:", error);
      toast.error("Gagal memuat daftar router");
    }
  };

  const loadMonitoringData = async () => {
    try {
      setLoading(true);

      const params = {};
      if (selectedRouter !== "all") {
        params.router_id = selectedRouter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get("/monitoring", { params });

      if (response.data.success) {
        setData(response.data.data.data);
        setStatistics(response.data.data.statistics);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to load monitoring data:", error);
      toast.error("Gagal memuat data monitoring");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (customerId, username) => {
    if (!confirm(`Yakin ingin memutuskan koneksi ${username}?`)) {
      return;
    }

    try {
      const response = await api.post(
        `/monitoring/customer/${customerId}/disconnect`,
      );

      if (response.data.success) {
        toast.success("Koneksi berhasil diputus");
        loadMonitoringData(); // Refresh data
      }
    } catch (error) {
      toast.error("Gagal memutus koneksi: " + error.message);
    }
  };

  const formatUptime = (uptime) => {
    if (!uptime) return "-";

    // Example: 1d2h3m4s
    const days = uptime.match(/(\d+)d/);
    const hours = uptime.match(/(\d+)h/);
    const minutes = uptime.match(/(\d+)m/);
    const seconds = uptime.match(/(\d+)s/);

    if (days) return `${days[1]} hari`;
    if (hours) return `${hours[1]} jam`;
    if (minutes) return `${minutes[1]} menit`;
    if (seconds) return `${seconds[1]} detik`;

    return uptime;
  };

  const formatBytes = (bytesStr) => {
    if (!bytesStr || bytesStr === "0") return "0 B";

    const bytes = parseInt(bytesStr);
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Monitoring Pelanggan
            </h1>
            <p className="text-gray-600">
              Pantau status koneksi PPPoE real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadMonitoringData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Memuat..." : "Refresh"}
            </button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pelanggan</p>
              <p className="text-2xl font-bold">{statistics.total_customers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Online</p>
              <p className="text-2xl font-bold text-green-600">
                {statistics.online}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${statistics.online_percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.online_percentage}% online
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Offline</p>
              <p className="text-2xl font-bold text-red-600">
                {statistics.offline}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Router Aktif</p>
              <p className="text-2xl font-bold">{statistics.total_routers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Router
            </label>
            <select
              value={selectedRouter}
              onChange={(e) => setSelectedRouter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Router</option>
              {routers.map((router) => (
                <option key={router.id} value={router.id}>
                  {router.name} ({router.ip_address})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari Pelanggan
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, username, atau alamat..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedRouter("all");
                setSearchTerm("");
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Daftar Pelanggan ({data.length})
          </h2>
          <div className="text-sm text-gray-500">
            Terakhir update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bandwidth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Paket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2 text-gray-500">
                      Memuat data monitoring...
                    </p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.customer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.username_pppoe}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.address}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.router_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-2 ${item.is_online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                        ></div>
                        <div>
                          <span
                            className={`font-medium ${item.is_online ? "text-green-700" : "text-red-700"}`}
                          >
                            {item.is_online ? "ONLINE" : "OFFLINE"}
                          </span>
                          <div className="text-xs text-gray-500">
                            {item.last_seen && formatDate(item.last_seen)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.is_online ? (
                        <div>
                          <div className="font-mono text-sm">
                            {item.remote_address || "-"}
                          </div>
                          {item.caller_id && (
                            <div className="text-xs text-gray-500">
                              {item.caller_id}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.is_online ? (
                        <div className="text-sm">
                          {formatUptime(item.uptime)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.is_online ? (
                        <div>
                          <div className="flex items-center text-sm">
                            <span className="text-blue-600 mr-1">↓</span>
                            {formatBytes(item.bytes_in)}
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-green-600 mr-1">↑</span>
                            {formatBytes(item.bytes_out)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{item.package_name}</div>
                        <div className="text-sm text-gray-500">
                          {item.rate_limit}
                        </div>
                        <div className="text-xs">
                          {item.days_until_expiry > 0 ? (
                            <span className="text-green-600">
                              {item.days_until_expiry} hari lagi
                            </span>
                          ) : (
                            <span className="text-red-600">Kadaluarsa</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/customers/${item.customer_id}`)
                          }
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Detail
                        </button>
                        {item.is_online && (
                          <button
                            onClick={() =>
                              handleDisconnect(
                                item.customer_id,
                                item.username_pppoe,
                              )
                            }
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
