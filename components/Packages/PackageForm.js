"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import Button from "@/components/UI/Button";
import { api } from "@/lib/api";

export default function PackageForm({ package: pkg, onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [routers, setRouters] = useState([]);
  const [loadingRouters, setLoadingRouters] = useState(true);
  const [selectedRouters, setSelectedRouters] = useState([]);

  // Watch values
  const packageName = watch("name");
  const profileName = watch("profile_name");
  const isActive = watch("is_active", true);

  // Load routers dari API
  useEffect(() => {
    const loadRouters = async () => {
      try {
        setLoadingRouters(true);
        const response = await api.get("/routers", {
          params: { status: "active", limit: 100 },
        });

        if (response.data.success) {
          setRouters(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to load routers:", error);
        toast.error("Gagal memuat daftar router");
      } finally {
        setLoadingRouters(false);
      }
    };

    loadRouters();
  }, []);

  // Generate profile name
  useEffect(() => {
    if (packageName && !profileName && !generatingProfile) {
      const generatedProfile = packageName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      if (generatedProfile !== profileName) {
        setValue("profile_name", generatedProfile);
      }
    }
  }, [packageName, profileName, generatingProfile, setValue]);

  // Reset form
  useEffect(() => {
    if (pkg) {
      reset({
        name: pkg.name || "",
        price: pkg.price || 0,
        duration_days: pkg.duration_days || 30,
        shared_users: pkg.shared_users || 1,
        rate_limit: pkg.rate_limit || "unlimited",
        type: pkg.type || "pppoe",
        is_active: pkg.is_active !== undefined ? Boolean(pkg.is_active) : true,
        profile_name: pkg.profile_name || "",
        selected_routers: pkg.selected_routers || [],
      });

      if (pkg.selected_routers) {
        setSelectedRouters(pkg.selected_routers);
      }
    } else {
      reset({
        name: "",
        price: 0,
        duration_days: 30,
        shared_users: 1,
        rate_limit: "unlimited",
        type: "pppoe",
        is_active: true,
        profile_name: "",
        selected_routers: [],
      });
      setSelectedRouters([]);
    }
  }, [pkg, reset]);

  // Handle router selection
  const handleRouterSelect = (routerId) => {
    const newSelected = selectedRouters.includes(routerId)
      ? selectedRouters.filter((id) => id !== routerId)
      : [...selectedRouters, routerId];

    setSelectedRouters(newSelected);
    setValue("selected_routers", newSelected);
  };

  const selectAllRouters = () => {
    const allIds = routers.map((r) => r.id);
    setSelectedRouters(allIds);
    setValue("selected_routers", allIds);
  };

  const clearAllRouters = () => {
    setSelectedRouters([]);
    setValue("selected_routers", []);
  };

  // Rate limit options
  const rateLimitOptions = [
    { value: "unlimited", label: "Unlimited" },
    { value: "1M/1M", label: "1 Mbps Down/Up" },
    { value: "2M/2M", label: "2 Mbps Down/Up" },
    { value: "5M/5M", label: "5 Mbps Down/Up" },
    { value: "10M/10M", label: "10 Mbps Down/Up" },
    { value: "20M/20M", label: "20 Mbps Down/Up" },
    { value: "50M/50M", label: "50 Mbps Down/Up" },
    { value: "100M/50M", label: "100M Down / 50M Up" },
  ];

  const typeOptions = [
    { value: "pppoe", label: "PPPoE" },
    { value: "hotspot", label: "Hotspot" },
  ];

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      console.log("📤 Submitting package data:", data);

      // Prepare payload
      const payload = {
        name: data.name,
        price: parseFloat(data.price),
        duration_days: parseInt(data.duration_days),
        shared_users: parseInt(data.shared_users),
        rate_limit: data.rate_limit,
        type: data.type,
        is_active: Boolean(data.is_active),
        profile_name:
          data.profile_name ||
          data.name
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, ""),
        selected_routers: data.selected_routers || [],
      };

      console.log("📦 Payload:", payload);

      // Warning jika tidak pilih router tapi butuh PPPoE
      if (payload.type === "pppoe" && payload.selected_routers.length === 0) {
        const confirm = window.confirm(
          "Anda tidak memilih router untuk membuat profil PPPoE.\n" +
            "Package akan dibuat TANPA profil di MikroTik.\n\n" +
            "Lanjutkan?",
        );

        if (!confirm) {
          setLoading(false);
          return;
        }
      }

      const url = pkg ? `/packages/${pkg.id}` : `/packages`;
      const method = pkg ? "put" : "post";

      // Gunakan timeout yang lebih panjang untuk create package
      const response = await api({
        method,
        url,
        data: payload,
        timeout: 45000, // 45 detik timeout
      });

      console.log("✅ Server response:", response.data);

      if (response.data.success) {
        const message = pkg ? "Package updated!" : "Package created!";

        // Show detailed success message
        const routerCount = response.data.data?.routers_count || 0;
        const profileName = response.data.data?.profile_name;

        if (routerCount > 0) {
          toast.success(
            <div>
              <div className="font-medium">{message}</div>
              <div className="text-sm mt-1">
                ✅ Profil <span className="font-mono">{profileName}</span>{" "}
                berhasil dibuat di {routerCount} router
              </div>
            </div>,
            { duration: 5000 },
          );
        } else {
          toast.success(
            <div>
              <div className="font-medium">{message}</div>
              <div className="text-sm mt-1">
                ⚠️ Package dibuat tanpa profil MikroTik
              </div>
            </div>,
          );
        }

        onSuccess();
      }
    } catch (error) {
      console.error("❌ Error saving package:", error);

      let errorMessage = "Gagal menyimpan package";
      let showDetails = false;

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        showDetails = true;
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Timeout: Proses pembuatan terlalu lama";
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Tampilkan toast dengan detail jika perlu
      if (showDetails && error.response?.data?.message?.includes("Mikrotik")) {
        toast.error(
          <div>
            <div className="font-medium">Gagal membuat profil MikroTik</div>
            <div className="text-sm mt-1">{errorMessage}</div>
            <div className="text-xs mt-1 text-red-300">
              Semua perubahan telah dibatalkan
            </div>
          </div>,
          { duration: 8000 },
        );
      } else {
        toast.error(`Error: ${errorMessage}`, { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProfile = () => {
    if (packageName) {
      setGeneratingProfile(true);
      const generatedProfile = packageName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      setValue("profile_name", generatedProfile);
      setTimeout(() => setGeneratingProfile(false), 500);
    } else {
      toast.error("Masukkan nama package terlebih dahulu");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Package Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Package *
          </label>
          <input
            type="text"
            {...register("name", {
              required: "Nama package harus diisi",
              minLength: { value: 2, message: "Minimal 2 karakter" },
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.name
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Contoh: Paket 30 Hari"
            disabled={loading}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Harga (Rp) *
          </label>
          <input
            type="number"
            {...register("price", {
              required: "Harga harus diisi",
              min: { value: 1, message: "Harga harus lebih dari 0" },
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.price
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Contoh: 150000"
            disabled={loading}
          />
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
          )}
        </div>

        {/* Duration Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Durasi (Hari) *
          </label>
          <input
            type="number"
            {...register("duration_days", {
              required: "Durasi harus diisi",
              min: { value: 1, message: "Minimal 1 hari" },
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.duration_days
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Contoh: 30"
            disabled={loading}
          />
          {errors.duration_days && (
            <p className="text-red-500 text-sm mt-1">
              {errors.duration_days.message}
            </p>
          )}
        </div>

        {/* Shared Users */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Bersama *
          </label>
          <input
            type="number"
            {...register("shared_users", {
              required: "Jumlah user harus diisi",
              min: { value: 1, message: "Minimal 1 user" },
              max: { value: 10, message: "Maksimal 10 user" },
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.shared_users
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Contoh: 1"
            disabled={loading}
          />
          {errors.shared_users && (
            <p className="text-red-500 text-sm mt-1">
              {errors.shared_users.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Jumlah user yang boleh menggunakan koneksi ini
          </p>
        </div>

        {/* Rate Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batas Kecepatan *
          </label>
          <select
            {...register("rate_limit", {
              required: "Batas kecepatan harus dipilih",
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.rate_limit
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={loading}
          >
            <option value="">Pilih Batas Kecepatan</option>
            {rateLimitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.rate_limit && (
            <p className="text-red-500 text-sm mt-1">
              {errors.rate_limit.message}
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipe Koneksi *
          </label>
          <select
            {...register("type", { required: "Tipe koneksi harus dipilih" })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.type
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={loading}
            onChange={(e) => {
              if (e.target.value !== "pppoe") {
                clearAllRouters();
              }
            }}
          >
            <option value="">Pilih Tipe</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
          )}
        </div>

        {/* Profile Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Profil MikroTik *
            <span className="text-xs text-gray-500 ml-2">
              (Akan dibuat sebagai profil PPPoE)
            </span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                {...register("profile_name", {
                  required: "Nama profil harus diisi",
                  pattern: {
                    value: /^[a-z0-9_]+$/,
                    message: "Hanya huruf kecil, angka, dan underscore (_)",
                  },
                })}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  errors.profile_name
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="contoh: paket_30_hari"
                disabled={loading}
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateProfile}
              disabled={!packageName || loading || generatingProfile}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingProfile ? "Membuat..." : "Auto Generate"}
            </button>
          </div>
          {errors.profile_name && (
            <p className="text-red-500 text-sm mt-1">
              {errors.profile_name.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Nama ini akan digunakan sebagai nama profil PPPoE di MikroTik
          </p>
        </div>

        {/* Router Selection (only for PPPoE) */}
        {watch("type") === "pppoe" && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Router untuk Membuat Profil PPPoE
              <span className="text-xs text-gray-500 ml-2">
                (Pilih router yang aktif)
              </span>
            </label>

            {loadingRouters ? (
              <div className="text-gray-500">Memuat daftar router...</div>
            ) : routers.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700">
                  ⚠️ Tidak ada router aktif yang ditemukan
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Package akan dibuat tanpa profil MikroTik
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={selectAllRouters}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={clearAllRouters}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Hapus Semua
                  </button>
                  <div className="ml-auto text-sm text-gray-500">
                    Terpilih: {selectedRouters.length} router
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {routers.map((router) => (
                    <div
                      key={router.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRouters.includes(router.id)
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => handleRouterSelect(router.id)}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={selectedRouters.includes(router.id)}
                          onChange={() => handleRouterSelect(router.id)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                          disabled={loading}
                        />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {router.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {router.ip_address}
                          {router.api_port && `:${router.api_port}`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {router.location || "Tidak ada lokasi"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  ✔️ Profil PPPoE akan dibuat di router yang dipilih
                  <br />
                  ⚠️ Jika gagal di salah satu router, semua perubahan akan
                  dibatalkan
                </p>
              </>
            )}
          </div>
        )}

        {/* Status */}
        <div className="md:col-span-2">
          <div
            className={`flex items-center p-4 rounded-lg border ${
              isActive
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="is_active"
                {...register("is_active")}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                disabled={loading}
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-gray-700"
              >
                Package Aktif
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {isActive
                  ? "Package ini akan tersedia untuk dipilih pelanggan"
                  : "Package ini tidak akan muncul di pilihan pelanggan"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden input for selected_routers */}
      <input
        type="hidden"
        {...register("selected_routers")}
        value={selectedRouters}
      />

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="min-w-[120px]"
        >
          {pkg ? "Update Package" : "Buat Package"}
        </Button>
      </div>
    </form>
  );
}
