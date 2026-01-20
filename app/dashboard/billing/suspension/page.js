"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  UserX,
  RefreshCw,
  Calendar,
  Wifi,
  WifiOff,
  Clock,
  Bell,
  Settings,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import Button from "@/components/UI/Button";
import Card from "@/components/UI/Card";

export default function SuspensionDashboard() {
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [autoSuspendEnabled, setAutoSuspendEnabled] = useState(true);
  const [schedulerSettings, setSchedulerSettings] = useState({
    suspendCheckHour: 1,
    expiringCheckHour: 9,
    overdueCheckHour: 2,
  });

  // Ambil settings untuk mendapatkan konfigurasi scheduler
  const { data: settings } = useQuery({
    queryKey: ["suspension-settings"],
    queryFn: async () => {
      try {
        const response = await api.get("/settings");
        if (response.data.success && response.data.data) {
          const data = response.data.data;

          // Update state dengan data dari settings
          if (data.scheduler) {
            setSchedulerSettings({
              suspendCheckHour: data.scheduler.suspendCheckHour || 1,
              expiringCheckHour: data.scheduler.expiringCheckHour || 9,
              overdueCheckHour: data.scheduler.overdueCheckHour || 2,
            });
          }

          if (data.scheduler?.autoSuspendEnabled !== undefined) {
            setAutoSuspendEnabled(data.scheduler.autoSuspendEnabled);
          }

          if (data.billing?.gracePeriod !== undefined) {
            // Simpan grace period ke localStorage untuk digunakan di stats
            localStorage.setItem("grace_period", data.billing.gracePeriod);
          }

          return data;
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
      return null;
    },
  });

  // Ambil statistik suspend dengan grace period dari settings
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["suspension-stats"],
    queryFn: async () => {
      try {
        const response = await api.get("/suspension/stats");
        if (response.data.success) {
          // Gabungkan dengan grace period dari settings jika ada
          const gracePeriod =
            settings?.billing?.gracePeriod ||
            localStorage.getItem("grace_period") ||
            3;

          return {
            ...response.data.data,
            grace_period_days: parseInt(gracePeriod),
            scheduler_enabled: autoSuspendEnabled,
            suspend_hour: schedulerSettings.suspendCheckHour,
            expiring_hour: schedulerSettings.expiringCheckHour,
            overdue_hour: schedulerSettings.overdueCheckHour,
          };
        }
        return response.data.data;
      } catch (error) {
        console.error("Error fetching suspension stats:", error);
        return {
          total_suspended: 0,
          recent_auto_suspended: 0,
          expired_not_suspended: 0,
          grace_period_days: settings?.billing?.gracePeriod || 3,
        };
      }
    },
    enabled: !!settings, // Hanya fetch setelah settings selesai
  });

  // Ambil data pelanggan yang akan segera habis
  const { data: expiring, refetch: refetchExpiring } = useQuery({
    queryKey: ["expiring-soon"],
    queryFn: async () => {
      try {
        const response = await api.get("/suspension/expiring-soon?days=3");
        return response.data.data;
      } catch (error) {
        console.error("Error fetching expiring data:", error);
        return { count: 0, customers: [] };
      }
    },
  });

  // Fetch job logs untuk menampilkan status job terakhir
  const { data: jobLogs } = useQuery({
    queryKey: ["suspension-job-logs"],
    queryFn: async () => {
      try {
        const response = await api.get("/jobs/logs?type=suspension&limit=5");
        return response.data.data || [];
      } catch (error) {
        console.error("Error fetching job logs:", error);
        return [];
      }
    },
    refetchInterval: 30000, // Auto-refresh setiap 30 detik
  });

  // Toggle auto-suspend
  const toggleAutoSuspend = async () => {
    try {
      setAutoSuspendEnabled(!autoSuspendEnabled);

      // Update settings di backend
      await api.put("/settings", {
        scheduler: {
          ...schedulerSettings,
          autoSuspendEnabled: !autoSuspendEnabled,
        },
      });

      refetchStats();
    } catch (error) {
      console.error("Error toggling auto-suspend:", error);
      setAutoSuspendEnabled(autoSuspendEnabled); // Revert if error
    }
  };

  const triggerAutoSuspend = async () => {
    if (
      !confirm(
        `Jalankan auto-suspend sekarang? Semua pelanggan yang sudah kedaluwarsa (melewati masa tenggang ${
          stats?.grace_period_days || 3
        } hari) akan disuspend.`
      )
    ) {
      return;
    }

    setTriggerLoading(true);
    try {
      const response = await api.post("/suspension/trigger-auto-suspend");
      alert(
        `Auto-suspend dijalankan: ${response.data.data.suspended} pelanggan berhasil disuspend`
      );
      refetchStats();
    } catch (error) {
      alert(
        "Gagal menjalankan auto-suspend: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setTriggerLoading(false);
    }
  };

  // Format jam untuk display
  const formatHour = (hour) => {
    return hour.toString().padStart(2, "0") + ":00";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manajemen Suspend
            </h1>
            <p className="text-gray-600">Sistem auto-suspend dan monitoring</p>
            <div className="flex items-center gap-2 mt-2">
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  autoSuspendEnabled
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {autoSuspendEnabled ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Auto-Suspend: AKTIF</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Auto-Suspend: NONAKTIF</span>
                  </>
                )}
              </div>
              <button
                onClick={toggleAutoSuspend}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {autoSuspendEnabled ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                refetchStats();
                refetchExpiring();
              }}
              className="border hover:cursor-pointer hover:scale-95"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Muat Ulang
            </Button>

            <Button
              variant="warning"
              onClick={triggerAutoSuspend}
              loading={triggerLoading}
              disabled={triggerLoading || !autoSuspendEnabled}
              title={
                !autoSuspendEnabled
                  ? "Aktifkan auto-suspend terlebih dahulu"
                  : ""
              }
              className="border hover:cursor-pointer hover:scale-95"
            >
              <UserX className="w-4 h-4 mr-2" />
              Jalankan Auto-Suspend Sekarang
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                (window.location.href = "/dashboard/billing/settings")
              }
              className="border hover:cursor-pointer hover:scale-95"
            >
              <Settings className="w-4 h-4 mr-2" />
              Ke Pengaturan
            </Button>
          </div>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Disuspend</p>
              <p className="text-3xl font-bold mt-1">
                {stats?.total_suspended || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <WifiOff className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Pelanggan yang saat ini disuspend
          </p>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Baru Saja Di-suspend Otomatis
              </p>
              <p className="text-3xl font-bold mt-1 text-orange-600">
                {stats?.recent_auto_suspended || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <UserX className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">7 hari terakhir</p>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Kedaluwarsa Tapi Belum Disuspend
              </p>
              <p className="text-3xl font-bold mt-1 text-yellow-600">
                {stats?.expired_not_suspended || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Melewati masa tenggang{" "}
            <span className="font-bold">{stats?.grace_period_days || 3}</span>{" "}
            hari
          </p>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Masa Tenggang</p>
              <p className="text-3xl font-bold mt-1">
                {stats?.grace_period_days || 3} hari
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Dari pengaturan billing</p>
        </Card>
      </div>

      {/* Tabel Akan Segera Kedaluwarsa */}
      {expiring && expiring.count > 0 && (
        <Card className="mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <h2 className="text-lg font-semibold">
                  Pelanggan Akan Segera Kedaluwarsa
                </h2>
                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  {expiring.count} pelanggan
                </span>
              </div>
              <span className="text-sm text-gray-500">
                Dalam {expiring.threshold_days} hari ke depan
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pelanggan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tanggal Kedaluwarsa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sisa Hari
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Router
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expiring.customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {customer.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {customer.username_pppoe}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">
                        {new Date(customer.expired_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.days_left <= 1
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {customer.days_left}{" "}
                        {customer.days_left === 1 ? "hari" : "hari"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {customer.router_name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informasi Jadwal Auto-Suspend */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Jadwal Auto-Suspend
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Suspend
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        autoSuspendEnabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {autoSuspendEnabled ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatHour(schedulerSettings.suspendCheckHour)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Setiap hari</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Cek Kadaluarsa
                    </span>
                    <Bell className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatHour(schedulerSettings.expiringCheckHour)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Setiap hari</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Cek Tunggakan
                    </span>
                    <Bell className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatHour(schedulerSettings.overdueCheckHour)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Setiap hari</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Konfigurasi dari Settings
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Masa Tenggang:</span>
                    <span className="ml-2 font-medium">
                      {stats?.grace_period_days || 3} hari
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`ml-2 font-medium ${
                        autoSuspendEnabled ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {autoSuspendEnabled ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Ubah pengaturan di halaman Settings
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Job History */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              History Job Terakhir
            </h3>
            <div className="space-y-3">
              {jobLogs && jobLogs.length > 0 ? (
                jobLogs.map((log, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {log.jobName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {log.message}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          log.status === "success"
                            ? "bg-green-100 text-green-800"
                            : log.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                      <span>{log.duration ? `${log.duration}ms` : ""}</span>
                      <span>
                        {new Date(log.timestamp).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PlayCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada riwayat job</p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Cara Kerja Auto-Suspend
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>Mengecek pelanggan dengan langganan kedaluwarsa</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>
                    Menghitung masa tenggang:{" "}
                    <span className="font-medium">
                      {stats?.grace_period_days || 3} hari
                    </span>
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>Menonaktifkan akun PPPoE di router MikroTik</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>Mengubah status pelanggan menjadi "suspended"</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>Otomatis aktif kembali setelah invoice dibayar</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={triggerAutoSuspend}
              disabled={triggerLoading || !autoSuspendEnabled}
              className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all ${
                autoSuspendEnabled
                  ? "border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700"
                  : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              <UserX className="w-8 h-8 mb-2" />
              <span className="font-medium">Jalankan Auto-Suspend</span>
              <span className="text-sm mt-1">Manual trigger</span>
            </button>

            <button
              onClick={() =>
                window.open("/dashboard/reports/suspension", "_blank")
              }
              className="p-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all flex flex-col items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 mb-2" />
              <span className="font-medium">Laporan Suspend</span>
              <span className="text-sm mt-1">Lihat detail</span>
            </button>

            <button
              onClick={() =>
                window.open("/dashboard/billing/settings#scheduler", "_self")
              }
              className="p-4 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all flex flex-col items-center justify-center"
            >
              <Settings className="w-8 h-8 mb-2" />
              <span className="font-medium">Pengaturan Scheduler</span>
              <span className="text-sm mt-1">Ubah jadwal</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
