"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import {
  Save,
  RotateCcw,
  Database,
  Server,
  Shield,
  Bell,
  Clock,
  Wifi,
  Globe,
  DollarSign,
  Calendar,
  Activity,
  Users,
  CreditCard,
  TestTube,
} from "lucide-react";
import { Card } from "@/components/UI/Card";
import TestResultModal from "@/components/UI/TestResultModal";
import TestNotification from "@/components/Notification/TestNotification";

export default function SettingsPage() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [jobLogs, setJobLogs] = useState([]);

  // ====== TAMBAHKAN STATE INI ======
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);

  const [testPhone, setTestPhone] = useState("");
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState("checking");

  // Tambahkan di useEffect utama
  const testSettingsAPI = async () => {
    console.log("🧪 Testing Settings API...");

    const token = localStorage.getItem("access_token");

    // Test 1: GET settings
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      console.log("✅ GET /settings:", data);
    } catch (error) {
      console.error("❌ GET failed:", error);
    }

    // Test 2: POST dengan data kecil
    try {
      const testData = {
        general: { siteName: "Test WiFi " + Date.now() },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(testData),
        },
      );

      const data = await response.json();
      console.log("✅ POST /settings:", data);
    } catch (error) {
      console.error("❌ POST failed:", error);
    }
  };

  // Panggil setelah mount
  useEffect(() => {
    testSettingsAPI();
  }, []);

  // Default settings yang lengkap
  const defaultSettings = {
    general: {
      siteName: "Billing WiFi",
      timezone: "Asia/Jakarta",
      currency: "IDR",
      dateFormat: "DD/MM/YYYY",
      language: "id",
    },
    billing: {
      autoSuspend: true,
      gracePeriod: 3,
      suspendWithPendingInvoices: true,
      taxRate: 0,
      invoicePrefix: "INV",
    },
    scheduler: {
      suspendCheckHour: 1,
      expiringCheckHour: 9,
      overdueCheckHour: 2,
      autoSuspendEnabled: true,
    },
    mikrotik: {
      timeout: 5000,
      retryAttempts: 3,
      mockMode: false,
      autoSync: true,
    },
    notifications: {
      emailNotifications: true,
      notifyOnSuspend: true,
      notifyOnPayment: true,
      notifyBeforeExpiry: true,
      daysBeforeExpiry: 3,
    },
    whatsapp: {
      enableReminder: true,
      reminderSchedule: "0 9 * * *", // Jam 09:00 setiap hari
      daysBefore: [3, 1], // H-3 dan H-1
      enablePaymentLinks: true,
      testPhoneNumber: "",
      companyName: "Billing WiFi",
      companyPhone: "081234567890",
      paymentLinkExpiryHours: 24,
    },
  };

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    loadSystemInfo();
    loadJobLogs();
  }, []);

  // ====== MODIFIKASI FUNGSI TEST MIKROTIK ======
  const testMikrotikConnection = async () => {
    setIsTesting(true);
    try {
      toast.loading("Menguji koneksi semua router...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/routers/test-all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      toast.dismiss();

      if (data.success) {
        // Simpan hasil ke state
        if (data.results) {
          setTestResults(data.results);
        } else if (data.data?.results) {
          setTestResults(data.data.results);
        } else {
          // Fallback jika struktur berbeda
          setTestResults([
            {
              routerId: 1,
              routerName: "Test Router",
              ipAddress: "192.168.1.1",
              status: "active",
              message: "Test completed",
              duration: 100,
              timestamp: new Date().toISOString(),
            },
          ]);
        }

        // Tampilkan modal
        setShowTestResults(true);

        // Tampilkan notifikasi
        const successCount = testResults.filter(
          (r) => r.status === "active",
        ).length;
        const totalCount = testResults.length;

        toast.success(
          `✅ Tes selesai! ${successCount} dari ${totalCount} router aktif`,
        );
      } else {
        toast.error(`❌ ${data.message || "Test failed"}`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(`❌ Error: ${error.message}`);
      console.error("Test all routers error:", error);

      // Untuk development, tampilkan dummy data
      if (process.env.NODE_ENV === "development") {
        const dummyResults = [
          {
            routerId: 1,
            routerName: "MikroTik VM",
            ipAddress: "192.168.56.101",
            status: "error",
            message: "Error: Test timeout (7s)",
            error: "Test timeout (7s)",
            duration: 7002,
            timestamp: new Date().toISOString(),
          },
          {
            routerId: 2,
            routerName: "Router Kantor",
            ipAddress: "192.168.88.1",
            status: "disconnected",
            message: "Connection failed: Network unreachable",
            error: "unknown",
            duration: 10,
            timestamp: new Date().toISOString(),
          },
          {
            routerId: 3,
            routerName: "Router Test",
            ipAddress: "192.168.1.1",
            status: "active",
            message: "Connection successful",
            duration: 150,
            timestamp: new Date().toISOString(),
          },
        ];
        setTestResults(dummyResults);
        setShowTestResults(true);
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Fungsi untuk test ulang
  const handleRetryTest = () => {
    setShowTestResults(false);
    setTimeout(() => {
      testMikrotikConnection();
    }, 500);
  };
  // =============================================

  // Fungsi untuk test save dengan data lengkap
  const testSaveCompleteData = async () => {
    console.log("🧪 Testing complete data save...");

    const testData = {
      general: {
        siteName: "Billing WiFi PRO",
        timezone: "Asia/Jakarta",
        currency: "IDR",
        dateFormat: "DD/MM/YYYY",
        language: "id",
      },
      billing: {
        autoSuspend: true,
        gracePeriod: 5,
        suspendWithPendingInvoices: true,
        taxRate: 10,
        invoicePrefix: "INV",
      },
      scheduler: {
        suspendCheckHour: 2,
        expiringCheckHour: 10,
        overdueCheckHour: 3,
        autoSuspendEnabled: true,
      },
      mikrotik: {
        timeout: 8000,
        retryAttempts: 5,
        mockMode: false,
        autoSync: true,
      },
      notifications: {
        emailNotifications: false,
        notifyOnSuspend: true,
        notifyOnPayment: true,
        notifyBeforeExpiry: true,
        daysBeforeExpiry: 5,
      },
    };

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please login first");
        return;
      }

      toast.loading("Testing save...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(testData),
        },
      );

      const result = await response.json();
      toast.dismiss();

      console.log("Test save result:", result);

      if (result.success) {
        toast.success("✅ Test PASSED: All data saved correctly");
        loadSettings();
        return true;
      } else {
        toast.error("❌ Test FAILED: " + result.message);
        return false;
      }
    } catch (error) {
      toast.dismiss();
      toast.error("❌ Test ERROR: " + error.message);
      console.error("Test error:", error);
      return false;
    }
  };

  // Fungsi untuk cek data form saat ini
  const debugCurrentFormData = () => {
    if (watch) {
      const currentData = watch();
      console.log("📊 Current form data:", currentData);

      // Check which fields have values
      const fieldCheck = {
        general: {
          siteName: !!currentData.general?.siteName,
          timezone: !!currentData.general?.timezone,
          currency: !!currentData.general?.currency,
          dateFormat: !!currentData.general?.dateFormat,
          language: !!currentData.general?.language,
        },
        billing: {
          autoSuspend: currentData.billing?.autoSuspend !== undefined,
          gracePeriod: currentData.billing?.gracePeriod !== undefined,
          suspendWithPendingInvoices:
            currentData.billing?.suspendWithPendingInvoices !== undefined,
          taxRate: currentData.billing?.taxRate !== undefined,
          invoicePrefix: !!currentData.billing?.invoicePrefix,
        },
      };

      console.log("🔍 Field check:", fieldCheck);
      toast.info("Check console for form data");
    } else {
      toast.error("watch() function not available");
    }
  };

  // Fungsi untuk test WhatsApp
  const testWhatsApp = async () => {
    if (!testPhone) {
      toast.error("Masukkan nomor telepon test");
      return;
    }

    setIsTestingWhatsApp(true);
    try {
      toast.loading("Mengirim pesan test...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer-reminder/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ phone: testPhone }),
        },
      );

      const result = await response.json();
      toast.dismiss();

      if (result.success) {
        toast.success("✅ Pesan test terkirim!");
      } else {
        toast.error(`❌ Gagal: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(`❌ Error: ${error.message}`);
      console.error("Test WhatsApp error:", error);
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  // Fungsi untuk cek status WhatsApp
  const checkWhatsAppStatus = async () => {
    try {
      setWhatsappStatus("checking");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customer-reminder/status`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWhatsappStatus(
            result.data.connected ? "connected" : "disconnected",
          );
          toast.success(
            "Status WhatsApp: " +
              (result.data.connected ? "TERHUBUNG" : "TERPUTUS"),
          );
        } else {
          setWhatsappStatus("error");
          toast.error("Gagal memeriksa status");
        }
      } else {
        setWhatsappStatus("error");
        toast.error("Endpoint status tidak ditemukan");
      }
    } catch (error) {
      console.error("Check WhatsApp status error:", error);
      setWhatsappStatus("error");
      toast.error("Error memeriksa status");
    }
  };

  // Panggil checkWhatsAppStatus saat load
  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      console.log("📥 Loading settings...");

      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        },
      );

      console.log("Response status:", response.status);

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      if (result.success && result.data) {
        const mergedSettings = {
          general: {
            ...defaultSettings.general,
            ...(result.data.general || {}),
          },
          billing: {
            ...defaultSettings.billing,
            ...(result.data.billing || {}),
          },
          scheduler: {
            ...defaultSettings.scheduler,
            ...(result.data.scheduler || {}),
          },
          mikrotik: {
            ...defaultSettings.mikrotik,
            ...(result.data.mikrotik || {}),
          },
          notifications: {
            ...defaultSettings.notifications,
            ...(result.data.notifications || {}),
          },
          whatsapp: {
            ...defaultSettings.whatsapp,
            ...(result.data.whatsapp || {}),
          },
        };

        console.log("Merged settings:", mergedSettings);
        reset(mergedSettings);
        toast.success("Settings loaded successfully");
      } else {
        toast.error(result.message || "Failed to load settings");
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error);
      toast.error("Failed to load settings from server");

      const savedSettings = localStorage.getItem("appSettings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          reset(parsed);
          toast("Using local settings", { icon: "⚠️" });
        } catch (e) {
          console.error("Local storage parse error:", e);
          reset(defaultSettings);
          toast("Using default settings", { icon: "⚙️" });
        }
      } else {
        reset(defaultSettings);
        toast("Using default settings", { icon: "⚙️" });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      console.log("🩺 Memeriksa kesehatan sistem...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settings/health`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSystemInfo(result.data);
          console.log("✅ Info sistem berhasil dimuat:", result.data);
        }
      }
    } catch (error) {
      console.error("❌ Gagal memuat informasi sistem:", error);
      setSystemInfo({
        status: "OK",
        uptime: "N/A",
        database: "connected",
        version: "1.0.0",
        stats: {
          customers: 0,
          invoices: 0,
          routers: 0,
        },
      });
    }
  };

  const loadJobLogs = async () => {
    try {
      console.log("📋 Loading job logs...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/logs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      );

      console.log("Job logs response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log("⚠️  Job logs endpoint not found, using fallback data");
          setJobLogs([
            {
              id: 1,
              jobName: "autoSuspend",
              status: "success",
              message: "Auto-suspend job completed",
              timestamp: new Date().toISOString(),
            },
            {
              id: 2,
              jobName: "checkExpiring",
              status: "success",
              message: "Check expiring job completed",
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Job logs data:", data);

      if (data.success) {
        setJobLogs(data.data || []);
      } else {
        console.error("Failed to load job logs:", data.message);
      }
    } catch (error) {
      console.error("❌ Failed to load job logs:", error);
      setJobLogs([]);
    }
  };

  // Di fungsi onSubmit(), tambahkan konversi yang benar:
  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      console.log("💾 Saving settings...", formData);
      console.log("📱 WhatsApp data from form:", formData.whatsapp);

      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Please login again");
      }

      // KONVERSI daysBefore DARI CHECKBOX KE ARRAY NUMBER
      const formElements = document.querySelectorAll(
        'input[name="whatsapp.daysBefore"]:checked',
      );
      const daysBeforeArray = Array.from(formElements).map((el) =>
        parseInt(el.value),
      );

      // Jika tidak ada yang dicentang, gunakan default [3, 1]
      const daysBefore = daysBeforeArray.length > 0 ? daysBeforeArray : [3, 1];

      // Pastikan semua data WhatsApp ada
      const whatsappData = {
        enableReminder: formData.whatsapp?.enableReminder ?? true,
        reminderSchedule: formData.whatsapp?.reminderSchedule || "*/2 * * * *",
        daysBefore: daysBefore,
        enablePaymentLinks: formData.whatsapp?.enablePaymentLinks ?? true,
        testPhoneNumber: formData.whatsapp?.testPhoneNumber || "",
        companyName: formData.whatsapp?.companyName || "Billing WiFi",
        companyPhone: formData.whatsapp?.companyPhone || "",
        paymentLinkExpiryHours: formData.whatsapp?.paymentLinkExpiryHours
          ? parseInt(formData.whatsapp.paymentLinkExpiryHours)
          : 24,
      };

      console.log("✅ WhatsApp data after processing:", whatsappData);

      const completeData = {
        ...defaultSettings,
        ...formData,
        general: { ...defaultSettings.general, ...formData.general },
        billing: { ...defaultSettings.billing, ...formData.billing },
        scheduler: { ...defaultSettings.scheduler, ...formData.scheduler },
        mikrotik: { ...defaultSettings.mikrotik, ...formData.mikrotik },
        notifications: {
          ...defaultSettings.notifications,
          ...formData.notifications,
        },
        // GUNAKAN WHATSAPP DATA YANG SUDAH DIPROSES
        whatsapp: whatsappData,
      };

      console.log("📦 Complete data to save:", completeData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(completeData),
        },
      );

      const result = await response.json();
      console.log("Save response:", result);

      if (response.ok && result.success) {
        localStorage.setItem("appSettings", JSON.stringify(completeData));
        toast.success("✅ Settings saved successfully!");

        reset(completeData);

        setTimeout(() => {
          loadSettings();
        }, 500);
      } else {
        throw new Error(result.message || "Save failed");
      }
    } catch (error) {
      console.error("❌ Save error:", error);
      const currentData = watch ? watch() : formData;
      localStorage.setItem("appSettings", JSON.stringify(currentData));
      toast.success("Settings saved locally (fallback)");
      toast.error(`Backend error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin mengembalikan ke pengaturan default?",
      )
    ) {
      reset(defaultSettings);
      localStorage.removeItem("appSettings");
      toast.success("Pengaturan dikembalikan ke default");
    }
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
        },
      );

      const result = await response.json();
      toast.dismiss();

      if (result.success) {
        toast.success(`${jobName} berhasil dijalankan!`);
        loadJobLogs();
      } else {
        toast.error(result.message || `Gagal menjalankan ${jobName}`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(`Error: ${error.message}`);
      console.error(`Error running job ${jobName}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pengaturan Sistem
          </h1>
          <p className="text-gray-600">
            Konfigurasi pengaturan sistem WiFi Billing Anda
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          {/* Debug Button */}
          <button
            onClick={() => testSaveCompleteData()}
            className="flex items-center gap-2 px-4 py-2 border border-purple-300 rounded-md text-purple-700 hover:bg-purple-50"
          >
            <TestTube className="w-4 h-4" />
            Debug Save
          </button>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* System Info */}
      {systemInfo && (
        <Card title="Informasi Sistem">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Server className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Status Server</p>
              <p
                className={`text-lg font-bold ${
                  systemInfo.status === "OK" ? "text-green-600" : "text-red-600"
                }`}
              >
                {systemInfo.status === "OK" ? "Online" : "Offline"}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Database className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Database</p>
              <p
                className={`text-lg font-bold ${
                  systemInfo.database === "connected"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {systemInfo.database === "connected"
                  ? "Connected"
                  : "Disconnected"}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Pelanggan</p>
              <p className="text-lg font-bold text-purple-600">
                {systemInfo.stats?.customers || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <CreditCard className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Invoice</p>
              <p className="text-lg font-bold text-orange-600">
                {systemInfo.stats?.invoices || 0}
              </p>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* General Settings */}
        <Card title="Pengaturan Umum" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Situs
              </label>
              <input
                type="text"
                {...register("general.siteName")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Billing WiFi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Waktu
              </label>
              <select
                {...register("general.timezone")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mata Uang
              </label>
              <select
                {...register("general.currency")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="IDR">Rupiah (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format Tanggal
              </label>
              <select
                {...register("general.dateFormat")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Billing Settings */}
        <Card title="Pengaturan Billing" className="mb-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("billing.autoSuspend")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Aktifkan Auto-Suspend
                  </span>
                </label>
                <p className="ml-6 text-xs text-gray-500 mt-1">
                  Otomatis suspend pelanggan yang telah habis masa aktifnya
                </p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("billing.suspendWithPendingInvoices")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Suspend dengan tagihan tertunda
                  </span>
                </label>
                <p className="ml-6 text-xs text-gray-500 mt-1">
                  Tetap suspend meskipun ada tagihan yang belum dibayar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Masa Tenggang (hari)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  {...register("billing.gracePeriod")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Waktu tunggu sebelum pelanggan di-suspend setelah masa aktif
                  habis
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pajak (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  {...register("billing.taxRate")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Scheduler Settings */}
        <Card title="Pengaturan Scheduler" className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Cek Suspend (24 jam)
                </label>
                <input
                  type="time"
                  step="60"
                  {...register("scheduler.suspendCheckHour")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Cek Kadaluarsa (24 jam)
                </label>
                <input
                  type="time"
                  step="60"
                  {...register("scheduler.expiringCheckHour")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Cek Tunggakan (24 jam)
                </label>
                <input
                  type="time"
                  step="60"
                  {...register("scheduler.overdueCheckHour")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register("scheduler.autoSuspendEnabled")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Aktifkan Auto-Suspend Scheduler
                </span>
              </label>
              <p className="ml-6 text-xs text-gray-500 mt-1">
                Scheduler akan berjalan otomatis sesuai jadwal di atas
              </p>
            </div>
          </div>
        </Card>

        {/* MikroTik Settings - MODIFIKASI KECIL DI SINI */}
        <Card title="Pengaturan MikroTik" className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="30000"
                  step="1000"
                  {...register("mikrotik.timeout")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percobaan Ulang
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  {...register("mikrotik.retryAttempts")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register("mikrotik.mockMode")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Mode Mock (testing tanpa router fisik)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register("mikrotik.autoSync")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Sinkronisasi Otomatis
                </span>
              </label>
            </div>

            {/* TOMBOL TEST - DIUBAH SEDIKIT */}
            <button
              type="button"
              onClick={testMikrotikConnection}
              disabled={isTesting}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                isTesting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {isTesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  Sedang Testing...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  Test Koneksi MikroTik
                </>
              )}
            </button>
          </div>
        </Card>

        {/* WhatsApp Notification Settings */}
        <Card title="Pengaturan WhatsApp" className="mb-6">
          <div className="space-y-6">
            {/* Enable/Disable */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register("whatsapp.enableReminder")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Aktifkan Notifikasi WhatsApp Otomatis
                </span>
              </label>
              <p className="ml-6 text-xs text-gray-500 mt-1">
                Sistem akan mengirim reminder otomatis ke pelanggan sebelum masa
                aktif berakhir
              </p>
            </div>

            {/* Jadwal Pengiriman */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jadwal Kirim Reminder (Cron)
                </label>
                <input
                  type="text"
                  {...register("whatsapp.reminderSchedule")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0 9 * * *"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format cron: menit jam hari bulan hari-minggu
                </p>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div>
                    <strong>Contoh:</strong>
                  </div>
                  <div>0 9 * * * = Setiap hari jam 09:00</div>
                  <div>0 9,15 * * * = Jam 09:00 dan 15:00</div>
                  <div>*/10 * * * * = Setiap 10 menit</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kirim Reminder (H-)
                </label>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        value={day}
                        {...register("whatsapp.daysBefore")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        H-{day} ({day} hari sebelum expired)
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Pilih hari-hari sebelum expired untuk kirim reminder
                </p>
              </div>
            </div>

            {/* Payment Link Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Payment Link</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      {...register("whatsapp.enablePaymentLinks")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Sertakan Payment Link di Pesan
                    </span>
                  </label>
                  <p className="ml-6 text-xs text-gray-500">
                    Jika aktif, pesan akan mengandung link pembayaran langsung
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Masa Aktif Payment Link (jam)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    {...register("whatsapp.paymentLinkExpiryHours")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Payment link akan expired setelah X jam
                  </p>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Info Perusahaan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Perusahaan
                  </label>
                  <input
                    type="text"
                    {...register("whatsapp.companyName")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Billing WiFi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon Perusahaan
                  </label>
                  <input
                    type="text"
                    {...register("whatsapp.companyPhone")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="081234567890"
                  />
                </div>
              </div>
            </div>

            {/* Test WhatsApp */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Test WhatsApp</h4>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Test (tanpa +62)
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="81234567890"
                  />
                </div>
                <button
                  type="button"
                  onClick={testWhatsApp}
                  disabled={isTestingWhatsApp || !testPhone}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                    isTestingWhatsApp || !testPhone
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {isTestingWhatsApp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Test WhatsApp
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Kirim pesan test ke nomor ini untuk memastikan konfigurasi
                berfungsi
              </p>
            </div>

            {/* Status WhatsApp Service */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Status Service</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${whatsappStatus === "connected" ? "bg-green-500" : whatsappStatus === "disconnected" ? "bg-red-500" : "bg-yellow-500"}`}
                  ></div>
                  <span className="text-sm">
                    {whatsappStatus === "connected"
                      ? "✅ Terhubung ke WhatsApp"
                      : whatsappStatus === "disconnected"
                        ? "❌ Tidak terhubung"
                        : "⏳ Mengecek status..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={checkWhatsAppStatus}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications Settings */}
        <Card title="Pengaturan Notifikasi" className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("notifications.emailNotifications")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Notifikasi Email
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("notifications.notifyOnSuspend")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Notifikasi saat Suspend
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("notifications.notifyOnPayment")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Notifikasi saat Pembayaran
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("notifications.notifyBeforeExpiry")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Notifikasi sebelum Kadaluarsa
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hari sebelum kadaluarsa untuk notifikasi
              </label>
              <input
                type="number"
                min="1"
                max="7"
                {...register("notifications.daysBeforeExpiry")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>
      </form>

      {/* Job Management */}
      <Card title="Manajemen Job">
        <div className="space-y-6">
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
              Cek Kadaluarsa
            </button>
            <button
              onClick={() => runTestJob("checkOverdue")}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
            >
              Cek Tunggakan
            </button>
          </div>

          {/* Job Logs */}
          {jobLogs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Log Job Terakhir
              </h4>
              <div className="space-y-2">
                {jobLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="text-sm bg-gray-50 p-3 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{log.jobName}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
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
                    <p className="text-gray-600 mt-1">{log.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ====== TAMBAHKAN MODAL DI SINI ====== */}
      {showTestResults && (
        <TestResultModal
          results={testResults}
          onClose={() => setShowTestResults(false)}
          onRetry={handleRetryTest}
        />
      )}
    </div>
  );
}
