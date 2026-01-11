"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api";
import Card from "@/components/UI/Card";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Billing WiFi",
    currency: "IDR",
    timezone: "Asia/Jakarta",
    autoSuspend: true,
    gracePeriod: 3,
    suspendWithPendingInvoices: true,
    suspendCheckHour: 1,
    expiringCheckHour: 9,
    mikrotikTimeout: 5000,
    mikrotikMock: false,
  });

  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Gagal mem-parsing pengaturan tersimpan:", error);
      }
    }

    // Load system info
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/health/detailed`
      );
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (error) {
      console.error("Gagal memuat informasi sistem:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simpan ke localStorage
      localStorage.setItem("appSettings", JSON.stringify(settings));

      // Simpan ke backend jika diperlukan
      // await apiClient.updateSettings(settings);

      toast.success("Pengaturan berhasil disimpan!");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan");
      console.error("Kesalahan saat menyimpan pengaturan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      siteName: "Billing WiFi",
      currency: "IDR",
      timezone: "Asia/Jakarta",
      autoSuspend: true,
      gracePeriod: 3,
      suspendWithPendingInvoices: true,
      suspendCheckHour: 1,
      expiringCheckHour: 9,
      mikrotikTimeout: 5000,
      mikrotikMock: false,
    });
    localStorage.removeItem("appSettings");
    toast.success("Pengaturan dikembalikan ke default");
  };

  const runTestJob = async (jobName) => {
    try {
      toast.loading(`Menjalankan ${jobName}...`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/run/${jobName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      const result = await response.json();
      toast.dismiss();

      if (result.success) {
        toast.success(`${jobName} berhasil dijalankan!`);
        console.log("Hasil job:", result);
      } else {
        toast.error(`Gagal: ${result.message}`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600">
            Konfigurasi pengaturan sistem billing WiFi Anda
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* System Info Card */}
      {systemInfo && (
        <Card title="Informasi Sistem">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Status
              </label>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {systemInfo.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Waktu Aktif
              </label>
              <p className="text-sm">{systemInfo.uptime}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Database
              </label>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  systemInfo.database === "connected"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {systemInfo.database}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* System Settings Form */}
      <Card title="Pengaturan Sistem">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site Name */}
            <div>
              <label
                htmlFor="siteName"
                className="block text-sm font-medium text-gray-700"
              >
                Nama Situs
              </label>
              <input
                type="text"
                id="siteName"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Currency */}
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700"
              >
                Mata Uang
              </label>
              <select
                id="currency"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="IDR">Rupiah Indonesia (IDR)</option>
                <option value="USD">Dolar Amerika (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-gray-700"
              >
                Zona Waktu
              </label>
              <select
                id="timezone"
                name="timezone"
                value={settings.timezone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Asia/Jakarta">Asia/Jakarta</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>

            {/* Grace Period */}
            <div>
              <label
                htmlFor="gracePeriod"
                className="block text-sm font-medium text-gray-700"
              >
                Masa Tenggang (hari)
              </label>
              <input
                type="number"
                id="gracePeriod"
                name="gracePeriod"
                min="0"
                max="30"
                value={settings.gracePeriod}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Jumlah hari sebelum pelanggan otomatis disuspend
              </p>
            </div>
          </div>

          {/* Auto-Suspend Settings */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pengaturan Auto-Suspend
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSuspend"
                  name="autoSuspend"
                  checked={settings.autoSuspend}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="autoSuspend"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Aktifkan Auto-Suspend
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="suspendWithPendingInvoices"
                  name="suspendWithPendingInvoices"
                  checked={settings.suspendWithPendingInvoices}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="suspendWithPendingInvoices"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Suspend meskipun masih ada tagihan tertunda
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="suspendCheckHour"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Jam Cek Suspend (24 jam)
                  </label>
                  <input
                    type="number"
                    id="suspendCheckHour"
                    name="suspendCheckHour"
                    min="0"
                    max="23"
                    value={settings.suspendCheckHour}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="expiringCheckHour"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Jam Cek Masa Habis (24 jam)
                  </label>
                  <input
                    type="number"
                    id="expiringCheckHour"
                    name="expiringCheckHour"
                    min="0"
                    max="23"
                    value={settings.expiringCheckHour}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MikroTik Settings */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pengaturan MikroTik
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mikrotikMock"
                  name="mikrotikMock"
                  checked={settings.mikrotikMock}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="mikrotikMock"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Aktifkan Mode Mock (testing tanpa router)
                </label>
              </div>

              <div>
                <label
                  htmlFor="mikrotikTimeout"
                  className="block text-sm font-medium text-gray-700"
                >
                  Timeout Router (ms)
                </label>
                <input
                  type="number"
                  id="mikrotikTimeout"
                  name="mikrotikTimeout"
                  min="1000"
                  max="30000"
                  step="1000"
                  value={settings.mikrotikTimeout}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* Job Management */}
      <Card title="Manajemen Job">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Jalankan job terjadwal secara manual untuk pengujian
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => runTestJob("autoSuspend")}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Jalankan Auto-Suspend
            </button>
            <button
              onClick={() => runTestJob("checkExpiring")}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
            >
              Cek Masa Habis
            </button>
            <button
              onClick={() => runTestJob("checkOverdue")}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
            >
              Cek Tunggakan
            </button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Zona Berbahaya" className="border-red-200">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tindakan berikut tidak dapat dibatalkan. Lakukan dengan hati-hati.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Apakah Anda yakin ingin menghapus semua data pelanggan? Tindakan ini tidak dapat dibatalkan."
                  )
                ) {
                  toast.error("Fitur belum diimplementasikan");
                }
              }}
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-md hover:bg-red-100"
            >
              Hapus Semua Data Pelanggan
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Apakah Anda yakin ingin mereset semua pengaturan? Tindakan ini tidak dapat dibatalkan."
                  )
                ) {
                  handleReset();
                }
              }}
              className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-300 rounded-md hover:bg-yellow-100"
            >
              Reset Semua Pengaturan
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
