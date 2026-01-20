// components/TestResultModal.js
import { useState, useEffect } from "react";
import {
  X,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Server,
  Activity,
} from "lucide-react";

const TestResultModal = ({ results, onClose, onRetry }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!results || results.length === 0) {
    return null;
  }

  // Calculate statistics
  const stats = {
    total: results.length,
    active: results.filter((r) => r.status === "active").length,
    inactive: results.filter((r) => r.status === "inactive").length,
    error: results.filter((r) => r.status === "error").length,
    disconnected: results.filter((r) => r.status === "disconnected").length,
    successRate:
      results.length > 0
        ? Math.round(
            (results.filter((r) => r.status === "active").length /
              results.length) *
              100
          )
        : 0,
    avgResponseTime:
      results.length > 0
        ? Math.round(
            results.reduce((acc, r) => acc + r.duration, 0) / results.length
          )
        : 0,
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      active: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Aktif",
      },
      inactive: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-4 h-4" />,
        label: "Nonaktif",
      },
      error: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Error",
      },
      disconnected: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: <WifiOff className="w-4 h-4" />,
        label: "Disconnected",
      },
      testing: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Activity className="w-4 h-4" />,
        label: "Testing",
      },
    };

    const configItem = config[status] || config.error;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${configItem.color}`}
      >
        {configItem.icon}
        {configItem.label}
      </span>
    );
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    setIsExporting(true);

    const headers = [
      "Router ID",
      "Nama Router",
      "IP Address",
      "Status",
      "Pesan",
      "Error",
      "Durasi (ms)",
      "Timestamp",
    ];
    const csvData = results.map((router) => [
      router.routerId,
      router.routerName,
      router.ipAddress,
      router.status,
      router.message,
      router.error || "",
      router.duration,
      formatTime(router.timestamp),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `hasil-tes-router-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Hasil Tes Koneksi Router
            </h2>
            <p className="text-gray-600">
              Hasil pengujian koneksi ke semua router MikroTik
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Statistics */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Router</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <Server className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Router Aktif</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <Wifi className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bermasalah</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.error + stats.disconnected}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.successRate}%
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {stats.total === 0
              ? "Tidak ada data"
              : `Menampilkan ${stats.total} router • ${stats.active} aktif • ${
                  stats.error + stats.disconnected
                } bermasalah`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={isExporting || stats.total === 0}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isExporting || stats.total === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Mengekspor..." : "Export CSV"}
            </button>

            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Test Ulang
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Router
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Pesan
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Durasi
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Waktu Tes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.map((router, index) => (
                    <tr
                      key={router.routerId || index}
                      className="hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {router.routerName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {router.ipAddress}
                          </p>
                          {router.routerId && (
                            <p className="text-xs text-gray-400">
                              ID: {router.routerId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={router.status} />
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate" title={router.message}>
                          {router.message}
                        </div>
                        {router.error && router.error !== "unknown" && (
                          <div
                            className="text-xs text-red-600 mt-1 truncate"
                            title={router.error}
                          >
                            Error: {router.error}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {router.duration}ms
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {formatTime(router.timestamp)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Rata-rata response time:{" "}
            <span className="font-medium">{stats.avgResponseTime}ms</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Tutup
            </button>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Test Ulang Semua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultModal;
