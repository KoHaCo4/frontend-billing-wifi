"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { toast } from "react-hot-toast";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import Button from "@/components/UI/Button";
import { api } from "@/lib/api";

// Schema validasi
const customerSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Nama harus diisi",
    "any.required": "Nama harus diisi",
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]{10,15}$/)
    .allow("")
    .messages({
      "string.pattern.base": "Format nomor telepon tidak valid",
    }),
  address: Joi.string().allow(""),
  username_pppoe: Joi.string()
    .required()
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .messages({
      "string.empty": "Username harus diisi",
      "string.pattern.base":
        "Username hanya boleh mengandung huruf, angka, titik, underscore, dan dash",
      "any.required": "Username harus diisi",
    }),
  password_pppoe: Joi.string()
    .min(6)
    .allow("", null)
    .when("$isEditMode", {
      is: false,
      then: Joi.required().messages({
        "string.empty": "Password harus diisi",
        "any.required": "Password harus diisi",
      }),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.min": "Password minimal 6 karakter",
    }),
  router_id: Joi.number().required().messages({
    "any.required": "Router harus dipilih",
    "number.base": "Router harus dipilih",
  }),
  package_id: Joi.number().required().messages({
    "any.required": "Paket harus dipilih",
    "number.base": "Paket harus dipilih",
  }),
  expired_at: Joi.date().required().messages({
    "date.base": "Tanggal kadaluarsa harus diisi",
    "any.required": "Tanggal kadaluarsa harus diisi",
  }),
  status: Joi.string()
    .valid("active", "expired", "suspended")
    .default("active"),
  auto_renew: Joi.boolean().default(true),
});

export default function CustomerForm({ customer, onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: joiResolver(customerSchema, {
      context: { isEditMode: !!customer },
    }),
    defaultValues: customer
      ? {
          name: customer.name || "",
          phone: customer.phone || "",
          address: customer.address || "",
          username_pppoe: customer.username_pppoe || "",
          password_pppoe: "", // Kosong untuk edit
          router_id: customer.router_id || "",
          package_id: customer.package_id || "",
          expired_at: customer.expired_at
            ? new Date(customer.expired_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          status: customer.status || "active",
          auto_renew: customer.auto_renew === 1 || customer.auto_renew === true,
        }
      : {
          name: "",
          phone: "",
          address: "",
          username_pppoe: "",
          password_pppoe: "",
          router_id: "",
          package_id: "",
          expired_at: "",
          status: "active",
          auto_renew: true,
        },
    mode: "onChange",
  });

  const [packages, setPackages] = useState([]);
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatePassword, setGeneratePassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Watch values
  const selectedPackageId = watch("package_id");
  const autoRenewValue = watch("auto_renew");
  const expiredAtValue = watch("expired_at");

  // Debug
  useEffect(() => {
    console.log(
      "📊 auto_renew value:",
      autoRenewValue,
      "type:",
      typeof autoRenewValue
    );
    console.log(
      "📊 expired_at value:",
      expiredAtValue,
      "type:",
      typeof expiredAtValue
    );
    console.log("📊 Form errors:", errors);
  }, [autoRenewValue, expiredAtValue, errors]);

  // Clear error when form changes
  // useEffect(() => {
  //   setErrorMessage(null);
  //   setShowErrorDetails(false);
  // }, [watch()]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesRes, routersRes] = await Promise.all([
          api.get("/packages?is_active=true"),
          api.get("/routers?status=active"),
        ]);

        setPackages(packagesRes.data.data || []);
        setRouters(routersRes.data.data || []);
      } catch (error) {
        toast.error("Failed to fetch data");
      }
    };

    fetchData();

    if (!customer) {
      const defaultUsername = `user${Date.now().toString().slice(-6)}`;
      setValue("username_pppoe", defaultUsername);
    }
  }, [customer, setValue]);

  useEffect(() => {
    if (generatePassword && !customer) {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setValue("password_pppoe", password);
    }
  }, [generatePassword, setValue, customer]);

  useEffect(() => {
    if (!customer && selectedPackageId) {
      const selectedPackage = packages.find(
        (pkg) => pkg.id === parseInt(selectedPackageId)
      );
      if (selectedPackage) {
        const expiredDate = new Date();
        expiredDate.setDate(
          expiredDate.getDate() + (selectedPackage.duration_days || 30)
        );
        const expiredDateStr = expiredDate.toISOString().split("T")[0];
        setValue("expired_at", expiredDateStr, { shouldValidate: true });
        console.log("🔧 Auto-set expiration date:", expiredDateStr);
      }
    }
  }, [selectedPackageId, packages, setValue, customer]);

  const onSubmit = async (data) => {
    console.log("🔄 Submitting form data:", data);
    setErrorMessage(null);
    setShowErrorDetails(false);
    setLoading(true);

    try {
      const url = customer ? `/customers/${customer.id}` : "/customers";
      const method = customer ? "put" : "post";

      // Prepare payload
      const payload = {
        name: data.name,
        router_id: parseInt(data.router_id),
        package_id: parseInt(data.package_id),
        username_pppoe: data.username_pppoe,
        auto_renew: data.auto_renew ? 1 : 0,
      };

      // Tambah field opsional jika ada nilai
      if (data.phone) payload.phone = data.phone;
      if (data.address) payload.address = data.address;

      // Handle expired_at
      if (data.expired_at) {
        let expiredAt = data.expired_at;
        if (typeof expiredAt === "string" && expiredAt.includes("T")) {
          expiredAt = expiredAt.split("T")[0];
        }
        payload.expired_at = expiredAt;
      }

      // Tambah status jika ada (untuk edit)
      if (data.status) payload.status = data.status;

      // Hanya kirim password jika diberikan
      if (
        !customer ||
        (data.password_pppoe && data.password_pppoe.trim() !== "")
      ) {
        payload.password_pppoe = data.password_pppoe;
      }

      console.log("📤 Sending payload:", payload);

      const response = await api[method](url, payload);
      console.log("✅ Response:", response.data);

      toast.success(customer ? "Customer updated!" : "Customer created!");

      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (error) {
      // console.error("❌ Error saving customer:", error);
      // console.error("❌ Error response status:", error.response?.status);
      console.error("❌ Error response data:", error.response?.data);
      // console.error("❌ Error message:", error.message);

      // Extract error message - FIXED VERSION
      let errorTitle = "Gagal Membuat Customer";
      let errorMsg = "Terjadi kesalahan saat menyimpan data.";
      let errorDetails = "";

      // Check different error sources
      if (error.response?.data) {
        // Ada data dari response
        if (typeof error.response.data === "string") {
          errorMsg = error.response.data;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.data.error) {
          errorMsg = error.response.data.error;
        }
      } else if (error.response?.status === 503) {
        // Service Unavailable - MikroTik not reachable
        errorTitle = "Router Tidak Dapat Diakses";
        errorMsg =
          "MikroTik tidak dapat diakses. Pastikan MikroTik aktif dan terhubung ke jaringan.";
      } else if (error.message) {
        // Use error message from axios
        errorMsg = error.message;
      }

      // Clean up error message
      if (errorMsg.includes("Gagal terhubung ke router")) {
        errorTitle = "Koneksi Router Gagal";
        // Extract only the main message
        const lines = errorMsg.split("\n");
        errorMsg = lines[0] || errorMsg;
        if (lines.length > 1) {
          errorDetails = lines.slice(1).join("\n");
        }
      }

      // Set error state for UI display
      setErrorMessage({
        title: errorTitle,
        message: errorMsg,
        details: errorDetails || error.stack || "",
        statusCode: error.response?.status,
      });

      // Show toast with appropriate message
      if (error.response?.status === 503) {
        toast.error(
          <div className="flex items-start gap-2">
            <WifiOff className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Router Tidak Dapat Diakses</div>
              <div className="text-sm text-gray-600">
                Pastikan MikroTik aktif dan terhubung ke jaringan
              </div>
            </div>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Gagal Menyimpan</div>
              <div className="text-sm text-gray-600">{errorMsg}</div>
            </div>
          </div>,
          { duration: 5000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUsername = () => {
    const newUsername = `user${Date.now().toString().slice(-6)}`;
    setValue("username_pppoe", newUsername);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Rest of your form remains the same */}
      {/* Informasi Pribadi */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Informasi Pribadi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap *
            </label>
            <input
              type="text"
              {...register("name")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.name ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Nama pelanggan"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Telepon
            </label>
            <input
              type="tel"
              {...register("phone")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.phone ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="08xxxxxxxxxx"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <textarea
              {...register("address")}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Alamat lengkap"
            />
          </div>
        </div>
      </div>

      {/* Akun */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Akun PPPoE</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username PPPoE *
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  {...register("username_pppoe")}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.username_pppoe ? "border-red-300" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="username"
                />
              </div>
              {!customer && (
                <button
                  type="button"
                  onClick={handleGenerateUsername}
                  className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Generate
                </button>
              )}
            </div>
            {errors.username_pppoe && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username_pppoe.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Username akan digunakan langsung untuk akun PPPoE di MikroTik
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password PPPoE {!customer && "*"}
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  {...register("password_pppoe")}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.password_pppoe ? "border-red-300" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder={
                    customer ? "(kosongkan untuk tidak mengubah)" : "Password"
                  }
                />
              </div>
              {!customer && (
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-md border border-gray-300 min-w-fit">
                  <input
                    type="checkbox"
                    id="auto-generate"
                    checked={generatePassword}
                    onChange={(e) => setGeneratePassword(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="auto-generate"
                    className="text-sm text-gray-700 whitespace-nowrap flex items-center"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Auto
                  </label>
                </div>
              )}
            </div>
            {errors.password_pppoe && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password_pppoe.message}
              </p>
            )}
            {!customer && (
              <p className="mt-1 text-xs text-gray-500">
                Centang "Auto" untuk membuat password otomatis 8 karakter
              </p>
            )}
            {customer && (
              <p className="mt-1 text-xs text-gray-500">
                Kosongkan jika tidak ingin mengubah password
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Langganan */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Langganan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Router *
            </label>
            <select
              {...register("router_id")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.router_id ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Pilih Router</option>
              {routers.map((router) => (
                <option key={router.id} value={router.id}>
                  {router.name} ({router.ip_address})
                </option>
              ))}
            </select>
            {errors.router_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.router_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paket *
            </label>
            <select
              {...register("package_id")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.package_id ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Pilih Paket</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.duration_days} hari) - Rp{pkg.price}
                </option>
              ))}
            </select>
            {errors.package_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.package_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Kadaluarsa *
            </label>
            <input
              type="date"
              {...register("expired_at")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.expired_at ? "border-red-300" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.expired_at && (
              <p className="mt-1 text-sm text-red-600">
                {errors.expired_at.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Aktif</option>
              <option value="expired">Kadaluarsa</option>
              <option value="suspended">Ditangguhkan</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_renew"
              {...register("auto_renew")}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="auto_renew" className="ml-2 text-sm text-gray-700">
              Perpanjang otomatis
            </label>
          </div>
        </div>
        {errors.auto_renew && (
          <p className="mt-1 text-sm text-red-600">
            {errors.auto_renew.message}
          </p>
        )}
      </div>

      {/* Error Message Display - ALWAYS VISIBLE WHEN THERE'S AN ERROR */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0">
                {errorMessage.statusCode === 503 ? (
                  <WifiOff className="w-5 h-5 text-red-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-red-800">
                  {errorMessage.title}
                </h4>
                <p className="text-red-600 mt-1 whitespace-pre-line">
                  {errorMessage.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
              aria-label="Close error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tombol Aksi */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Batal
        </Button>
        <Button type="submit" loading={loading} disabled={!isValid || loading}>
          {customer ? "Update Pelanggan" : "Tambah Pelanggan"}
        </Button>
      </div>
    </form>
  );
}
