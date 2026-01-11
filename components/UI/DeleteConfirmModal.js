// components/UI/DeleteConfirmModal.js
"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import Button from "./Button";
import { api } from "@/lib/api";

export default function DeleteConfirmModal({
  item,
  itemType = "package",
  onSuccess,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);

  // Labels berdasarkan tipe item
  const labels = {
    package: {
      title: "Delete Package",
      confirmText: "Delete Package",
      endpoint: "/packages",
      successMessage: "Package deleted successfully",
      usageCheckEndpoint: "/packages",
    },
    customer: {
      title: "Delete Customer",
      confirmText: "Delete Customer",
      endpoint: "/customers",
      successMessage: "Customer deleted successfully",
    },
    // Tambahkan tipe lain sesuai kebutuhan
  };

  const currentLabel = labels[itemType] || labels.package;

  // Cek penggunaan sebelum delete
  const checkUsage = async () => {
    if (itemType !== "package") return;

    try {
      setLoadingUsage(true);
      const response = await api.get(
        `${currentLabel.usageCheckEndpoint}/${item.id}/usage`
      );

      if (response.data.success) {
        setUsageInfo(response.data.data);
      }
    } catch (error) {
      console.error("Error checking usage:", error);
    } finally {
      setLoadingUsage(false);
    }
  };

  // Saat modal terbuka, cek penggunaan
  useState(() => {
    if (itemType === "package") {
      checkUsage();
    }
  }, []);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await api.delete(`${currentLabel.endpoint}/${item.id}`);

      if (response.data.success) {
        toast.success(response.data.message || currentLabel.successMessage);
        onSuccess();
      } else {
        // Jika ada error karena package digunakan
        if (response.data.data?.customerCount > 0) {
          toast.error(
            <div className="text-left">
              <p className="font-medium">{response.data.message}</p>
              <p className="text-sm mt-1">
                Package is used by {response.data.data.customerCount}{" "}
                customer(s)
              </p>
            </div>,
            { duration: 5000 }
          );
        } else {
          toast.error(response.data.message || "Failed to delete");
        }
      }
    } catch (error) {
      console.error("Delete error:", error);

      let errorMessage = "Failed to delete";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;

        // Tampilkan detail jika ada
        if (error.response.data.data?.customerCount) {
          toast.error(
            <div className="text-left">
              <p className="font-medium">{errorMessage}</p>
              <p className="text-sm mt-1">
                This package is currently used by{" "}
                {error.response.data.data.customerCount} customer(s).
                <br />
                <span className="text-blue-600">
                  Tip: You can deactivate the package instead.
                </span>
              </p>
            </div>,
            { duration: 6000 }
          );
          return;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);

    try {
      const response = await api.post(
        `${currentLabel.endpoint}/${item.id}/deactivate`
      );

      if (response.data.success) {
        toast.success("Package deactivated successfully");
        onSuccess();
      }
    } catch (error) {
      console.error("Deactivate error:", error);
      toast.error(error.response?.data?.message || "Failed to deactivate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentLabel.title}
          </h3>
          <p className="text-gray-600 mt-1">
            Are you sure you want to delete{" "}
            <span className="font-medium">{item.name}</span>?
          </p>
        </div>

        {/* Usage Warning (hanya untuk package) */}
        {itemType === "package" && usageInfo && usageInfo.totalUsage > 0 && (
          <div className="p-6 bg-yellow-50 border-y border-yellow-200">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-yellow-400 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-yellow-800 font-medium">
                  Cannot Delete This Package
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  This package is currently being used by{" "}
                  <span className="font-semibold">{usageInfo.totalUsage}</span>{" "}
                  customer(s).
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-yellow-700 text-sm">
                    <span className="font-medium">Options:</span>
                  </p>
                  <ul className="text-yellow-700 text-sm list-disc pl-4">
                    <li>Deactivate the package (recommended)</li>
                    <li>First reassign customers to another package</li>
                    <li>Contact support if you need to force delete</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {loadingUsage ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Checking package usage...</p>
            </div>
          ) : usageInfo && usageInfo.totalUsage > 0 ? (
            // Jika package digunakan, tampilkan opsi deactivate
            <div className="space-y-4">
              <p className="text-gray-600">
                You cannot delete this package because it's in use. Would you
                like to deactivate it instead?
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeactivate}
                  loading={loading}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  Deactivate Package
                </Button>
              </div>
            </div>
          ) : (
            // Jika bisa dihapus, tampilkan confirm delete
            <div className="space-y-4">
              <p className="text-gray-600">
                This action cannot be undone. All data related to this package
                will be permanently removed.
              </p>

              {itemType === "package" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm font-medium">
                    ⚠️ Warning: This will also remove the PPPoE profile from all
                    MikroTik routers.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  loading={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {currentLabel.confirmText}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
