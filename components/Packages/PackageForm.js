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

  // Watch values for real-time updates
  const packageName = watch("name");
  const profileName = watch("profile_name");
  const isActive = watch("is_active", true);

  // Generate profile name from package name
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

  // Reset form when package changes
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
      });
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
      });
    }
  }, [pkg, reset]);

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

      // Prepare payload sesuai dengan backend
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
      };

      console.log("📦 Payload to send:", payload);

      const url = pkg ? `/packages/${pkg.id}` : `/packages`;
      const method = pkg ? "put" : "post";

      const response = await api[method](url, payload);

      console.log("✅ Server response:", response.data);

      // Show success message with MikroTik info if available
      if (response.data.success) {
        const message = pkg ? "Package updated!" : "Package created!";

        if (response.data.data?.mikrotik_integration) {
          toast.success(
            <div>
              <div className="font-medium">{message}</div>
              <div className="text-sm">
                PPPoE profile:{" "}
                <span className="font-mono">
                  {response.data.data.mikrotik_integration.profile_name}
                </span>
              </div>
            </div>
          );
        } else {
          toast.success(message);
        }

        onSuccess();
      }
    } catch (error) {
      console.error("❌ Error saving package:", error);

      let errorMessage = "Failed to save package";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;

        // Handle specific errors
        if (errorMessage.includes("Duplicate entry")) {
          errorMessage = "Package name already exists";
        } else if (errorMessage.includes("required")) {
          errorMessage = "Please fill all required fields";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(`Error: ${errorMessage}`);
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
      toast.error("Please enter package name first");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Package Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Package Name *
          </label>
          <input
            type="text"
            {...register("name", {
              required: "Package name is required",
              minLength: { value: 2, message: "Minimum 2 characters" },
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.name
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="e.g., Paket 30 Hari"
            disabled={loading}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (Rp) *
          </label>
          <input
            type="number"
            {...register("price", {
              required: "Price is required",
              min: { value: 1, message: "Price must be greater than 0" },
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.price
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="e.g., 150000"
            disabled={loading}
          />
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
          )}
        </div>

        {/* Duration Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (Days) *
          </label>
          <input
            type="number"
            {...register("duration_days", {
              required: "Duration is required",
              min: { value: 1, message: "Duration must be at least 1 day" },
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.duration_days
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="e.g., 30"
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
            Shared Users *
          </label>
          <input
            type="number"
            {...register("shared_users", {
              required: "Shared users is required",
              min: { value: 1, message: "Minimum 1 user" },
              max: { value: 10, message: "Maximum 10 users" },
            })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.shared_users
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="e.g., 1"
            disabled={loading}
          />
          {errors.shared_users && (
            <p className="text-red-500 text-sm mt-1">
              {errors.shared_users.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Number of users allowed to share this connection
          </p>
        </div>

        {/* Rate Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate Limit *
          </label>
          <select
            {...register("rate_limit", { required: "Rate limit is required" })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.rate_limit
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={loading}
          >
            <option value="">Select Rate Limit</option>
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
            Connection Type *
          </label>
          <select
            {...register("type", { required: "Type is required" })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.type
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            disabled={loading}
          >
            <option value="">Select Type</option>
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
            MikroTik Profile Name *
            <span className="text-xs text-gray-500 ml-2">
              (Will be created on all active routers)
            </span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                {...register("profile_name", {
                  required: "Profile name is required",
                  pattern: {
                    value: /^[a-z0-9_]+$/,
                    message: "Only lowercase letters, numbers, and underscores",
                  },
                })}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  errors.profile_name
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="e.g., paket_30_hari"
                disabled={loading}
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateProfile}
              disabled={!packageName || loading || generatingProfile}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingProfile ? "Generating..." : "Auto Generate"}
            </button>
          </div>
          {errors.profile_name && (
            <p className="text-red-500 text-sm mt-1">
              {errors.profile_name.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This will be the PPPoE profile name on MikroTik routers
          </p>
        </div>

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
                Active Package
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {isActive
                  ? "This package will be available for customer selection"
                  : "This package will not appear in customer selection"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading} disabled={loading}>
          {pkg ? "Update Package" : "Create Package"}
        </Button>
      </div>
    </form>
  );
}
