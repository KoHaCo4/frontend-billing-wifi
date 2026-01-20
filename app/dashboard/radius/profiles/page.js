"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  Plus,
  Package,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
} from "lucide-react";
import DataTable from "@/components/UI/DataTable";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import PackageForm from "@/components/Packages/PackageForm";
import { api } from "@/lib/api";

// API functions
const fetchPackages = async ({ queryKey }) => {
  const [_, showInactive] = queryKey;
  try {
    const url = showInactive ? "/packages?all=true" : "/packages";
    const response = await api.get(url);

    if (response.data && response.data.success) {
      return {
        packages: response.data.data || [],
        total: response.data.data?.length || 0,
      };
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Fetch packages error:", error);
    throw error; // Re-throw untuk ditangani oleh useQuery
  }
};

export default function PackagesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);

  const queryClient = useQueryClient();

  // Fetch packages
  const {
    data: packagesData = { packages: [], total: 0 },
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["packages", showInactive],
    queryFn: fetchPackages,
    retry: 1,
  });

  // Delete mutation dengan error handling yang lebih baik
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        const response = await api.delete(`/packages/${id}`);
        return response.data;
      } catch (error) {
        // Tangkap error dan lempar dengan format yang konsisten
        const errorMessage =
          error.response?.data?.message || error.message || "Delete failed";
        const errorData = {
          message: errorMessage,
          response: error.response,
          status: error.response?.status,
        };
        throw errorData;
      }
    },
    onSuccess: (data) => {
      console.log("Delete success:", data);

      if (data.success) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-medium">Package deleted successfully!</span>
            {data.mikrotik_deletion && (
              <span className="text-sm">
                PPPoE profile removed from{" "}
                {data.mikrotik_deletion.success_count} router(s)
              </span>
            )}
          </div>,
          { duration: 4000 }
        );
        queryClient.invalidateQueries({ queryKey: ["packages"] });
        setIsDeleteModalOpen(false);
        setDeleteError(null);
        setPackageToDelete(null);
      } else {
        // Jika backend return success: false
        setDeleteError(data.message || "Failed to delete package");
      }
    },
    onError: (error) => {
      console.log("Delete error object:", error);

      // Extract error message dengan cara yang lebih aman
      let errorMessage = "Failed to delete package";
      let customerError = false;

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Check if it's a customer-related error
      customerError =
        errorMessage.toLowerCase().includes("customer") ||
        errorMessage.toLowerCase().includes("used by") ||
        errorMessage.toLowerCase().includes("cannot delete");

      console.log("Extracted error:", { errorMessage, customerError });

      setDeleteError(errorMessage);

      // Tampilkan toast error
      if (customerError) {
        toast.error(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium">Cannot Delete Package</span>
            </div>
            <p className="text-sm">{errorMessage}</p>
            <p className="text-xs text-gray-600 mt-1">
              ❌ Please reassign customers to another package first
            </p>
          </div>,
          {
            duration: 8000,
            position: "top-right",
          }
        );
      } else if (errorMessage) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-medium">Delete Failed</span>
            <span className="text-sm">{errorMessage}</span>
          </div>,
          {
            duration: 5000,
            position: "top-right",
          }
        );
      }
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await api.put(`/packages/${id}`, {
        is_active: !is_active,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Package status updated", { position: "top-right" });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Failed to update package status";
      toast.error(errorMessage, { position: "top-right" });
    },
  });

  // Handle delete click
  const handleDeleteClick = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (packageToDelete) {
      deleteMutation.mutate(packageToDelete.id);
    }
  };

  // Columns definition
  const columns = [
    {
      key: "name",
      label: "Package Name",
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              row.is_active ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <Package
              className={`w-5 h-5 ${
                row.is_active ? "text-blue-600" : "text-gray-600"
              }`}
            />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              {row.type === "pppoe" ? "PPPoE" : "Hotspot"} • {row.shared_users}{" "}
              user(s)
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (value) => (
        <div className="font-medium">
          Rp {parseFloat(value).toLocaleString("id-ID")}
        </div>
      ),
    },
    {
      key: "duration_days",
      label: "Duration",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>{value} days</span>
        </div>
      ),
    },
    {
      key: "rate_limit",
      label: "Speed",
      render: (value) => (
        <div className="text-sm font-medium">
          {value === "unlimited" ? "Unlimited" : value}
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (
              window.confirm(
                `Set package "${row.name}" to ${value ? "inactive" : "active"}?`
              )
            ) {
              toggleActiveMutation.mutate({
                id: row.id,
                is_active: value,
              });
            }
          }}
          className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 transition-colors ${
            value
              ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
              : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
          }`}
        >
          {value ? (
            <>
              <Eye className="w-3 h-3" />
              Active
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" />
              Inactive
            </>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPackage(row);
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            disabled={deleteMutation.isLoading}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Jika ada error fetching
  if (fetchError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Packages
          </h2>
          <p className="text-red-600 mb-4">
            {fetchError?.response?.data?.message ||
              fetchError?.message ||
              "Unable to load packages"}
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Internet Packages
            </h1>
            <p className="text-gray-600">
              {packagesData.total
                ? `Total: ${packagesData.total} packages`
                : "Manage your internet subscription packages"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowInactive(!showInactive)}
              className="flex items-center gap-2"
            >
              {showInactive ? (
                <>
                  <Eye className="w-4 h-4" />
                  Show Active Only
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Show All Packages
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setSelectedPackage(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Package
            </Button>
          </div>
        </div>
      </div>

      {showInactive && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Showing all packages (active and inactive)
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={packagesData.packages}
        loading={isLoading}
        searchable={true}
        pagination={true}
        searchPlaceholder="Search packages by name..."
        onRowClick={(row) => {
          setSelectedPackage(row);
          setIsModalOpen(true);
        }}
      />

      {/* Edit/Create Package Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPackage(null);
        }}
        title={selectedPackage ? "Edit Package" : "Add New Package"}
        size="lg"
      >
        <PackageForm
          package={selectedPackage}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedPackage(null);
            queryClient.invalidateQueries({ queryKey: ["packages"] });
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedPackage(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleteMutation.isLoading) {
            setIsDeleteModalOpen(false);
            setPackageToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Package"
        size="md"
      >
        <div className="p-4 space-y-4">
          {packageToDelete && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 mb-1">
                      {" "}
                      Peringatan: Tindakan ini tidak dapat dibatalkan!
                    </p>
                    <p className="text-sm text-red-700">
                      Anda akan menghapus paket{" "}
                      <span className="font-semibold">
                        "{packageToDelete.name}"
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-gray-700">
                  Tindakan ini juga akan menghapus profil PPPoE{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {packageToDelete.profile_name}
                  </code>{" "}
                  dari semua router MikroTik.
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>
                    Price: Rp{" "}
                    {parseFloat(packageToDelete.price).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {packageToDelete.duration_days} days</span>
                </div>
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-800">
                      Paket Tidak Dapat Dihapus
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mb-2">{deleteError}</p>
                  <p className="text-xs text-gray-600">
                    ⚠️ Silakan pindahkan pelanggan yang terdampak ke paket lain
                    sebelum menghapus paket ini.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setPackageToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleteMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleteMutation.isLoading}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? "Deleting..." : "Delete Package"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
