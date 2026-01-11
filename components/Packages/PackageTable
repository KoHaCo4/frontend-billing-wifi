"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import Button from "@/components/UI/Button";
import { api } from "@/lib/api";
import Modal from "@/components/UI/Modal";
import PackageForm from "./PackageForm";

export default function PackageTable({ packages: initialPackages, refreshData }) {
  const [packages, setPackages] = useState(initialPackages || []);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const handleDeleteClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      const response = await api.delete(`/packages/${selectedPackage.id}`);

      if (response.data.success) {
        toast.success("Package deleted successfully!");
        
        // Refresh data
        await refreshData();
      } else {
        // Tampilkan error dari backend
        toast.error(response.data.message || "Failed to delete package");
      }
    } catch (error) {
      console.error("Delete error:", error);
      
      // Handle specific error codes
      if (error.response?.data?.code === "PACKAGE_IN_USE") {
        toast.error(
          <div>
            <p className="font-medium">Cannot delete package</p>
            <p className="text-sm mt-1">{error.response.data.message}</p>
            <p className="text-xs mt-2 text-gray-600">
              ❌ Please reassign customers to another package first
            </p>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(error.response?.data?.message || "Failed to delete package");
      }
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setSelectedPackage(null);
    }
  };

  const handleEditClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowEditModal(true);
  };

  const handleFormSuccess = () => {
    setShowEditModal(false);
    setSelectedPackage(null);
    refreshData();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {pkg.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {pkg.type === 'pppoe' ? 'PPPoE' : 'Hotspot'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {pkg.profile_name}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(pkg.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {pkg.duration_days} days
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {pkg.rate_limit === 'unlimited' ? 'Unlimited' : pkg.rate_limit}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(pkg.is_active)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(pkg)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteClick(pkg)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Package"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete package{" "}
            <span className="font-semibold">{selectedPackage?.name}</span>?
          </p>
          
          {selectedPackage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">
                ⚠️ <span className="font-medium">Warning:</span> This action cannot be undone.
                The PPPoE profile <code className="bg-red-100 px-1 rounded">{selectedPackage.profile_name}</code> 
                will also be removed from all MikroTik routers.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={loading}
            >
              Delete Package
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Package Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Package"
        size="lg"
      >
        <div className="p-4">
          {selectedPackage && (
            <PackageForm
              package={selectedPackage}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </div>
      </Modal>
    </>
  );
}