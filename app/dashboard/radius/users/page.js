"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Plus, UserPlus, Download, Power, Pause, PowerOff } from "lucide-react";
import DataTable from "@/components/UI/DataTable";
import Modal from "@/components/UI/Modal";
import CustomerForm from "@/components/Customers/CustomerForm";
import Button from "@/components/UI/Button";
import StatusBadge from "@/components/UI/StatusBadge";
import { api } from "@/lib/api";

// API functions
const fetchCustomers = async () => {
  try {
    const response = await api.get("/customers");

    console.log("🔍 DEBUG Customers API Response:", {
      status: response.status,
      data: response.data,
      fullResponse: response,
    });

    // Handle multiple possible response structures
    let customers = [];
    let total = 0;
    let pagination = {};

    if (response.data && response.data.success !== false) {
      // Structure 1: { success: true, data: [...], pagination: {...} }
      if (Array.isArray(response.data.data)) {
        customers = response.data.data;
        total = response.data.pagination?.total || response.data.data.length;
        pagination = response.data.pagination || {};
      }
      // Structure 2: Direct array response
      else if (Array.isArray(response.data)) {
        customers = response.data;
        total = response.data.length;
      }
      // Structure 3: { customers: [...], total: ... }
      else if (
        response.data.customers &&
        Array.isArray(response.data.customers)
      ) {
        customers = response.data.customers;
        total = response.data.total || response.data.customers.length;
      }
    }

    console.log("✅ Processed customers:", customers.length, "items");

    return {
      customers,
      total,
      pagination,
    };
  } catch (error) {
    console.error("❌ Fetch customers error:", error);
    console.error("❌ Error details:", error.response?.data);
    toast.error("Failed to load customers");
    return { customers: [], total: 0, pagination: {} };
  }
};

// Deactivate customer function
const deactivateCustomer = async ({ customerId, reason }) => {
  try {
    const response = await api.post(`/customers/${customerId}/deactivate`, {
      reason: reason || "Deactivated by admin",
    });
    return response.data;
  } catch (error) {
    console.error("❌ Deactivate customer error:", error);
    throw error;
  }
};

// Activate customer function
const activateCustomer = async (customerId) => {
  try {
    const response = await api.post(`/customers/${customerId}/activate`);
    return response.data;
  } catch (error) {
    console.error("❌ Activate customer error:", error);
    throw error;
  }
};

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [customerToModify, setCustomerToModify] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");

  const queryClient = useQueryClient();

  // Fetch customers
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: deactivateCustomer,
    onSuccess: (data) => {
      toast.success(
        <div>
          <p className="font-medium">Customer deactivated</p>
          <p className="text-sm mt-1">PPPoE account has been disabled.</p>
        </div>
      );
      setShowDeactivateModal(false);
      setCustomerToModify(null);
      setDeactivateReason("");
      queryClient.invalidateQueries(["customers"]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to deactivate customer"
      );
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: activateCustomer,
    onSuccess: (data) => {
      toast.success(
        <div>
          <p className="font-medium">Customer activated</p>
          <p className="text-sm mt-1">PPPoE account has been enabled.</p>
        </div>
      );
      setShowActivateModal(false);
      setCustomerToModify(null);
      queryClient.invalidateQueries(["customers"]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to activate customer"
      );
    },
  });

  // Handle deactivate click
  const handleDeactivateClick = (customer) => {
    setCustomerToModify(customer);
    setShowDeactivateModal(true);
  };

  // Handle activate click
  const handleActivateClick = (customer) => {
    setCustomerToModify(customer);
    setShowActivateModal(true);
  };

  // Confirm deactivate
  const confirmDeactivate = () => {
    if (!customerToModify) return;
    deactivateMutation.mutate({
      customerId: customerToModify.id,
      reason: deactivateReason,
    });
  };

  // Confirm activate
  const confirmActivate = () => {
    if (!customerToModify) return;
    activateMutation.mutate(customerToModify.id);
  };

  // Columns definition
  const columns = [
    {
      key: "username_pppoe",
      label: "Username",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              {value}
            </code>
          </div>
          <div className="text-sm text-gray-700 mt-1">{row.name}</div>
          {row.phone && (
            <div className="text-xs text-gray-500">{row.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: "package",
      label: "Package",
      render: (_, row) => {
        if (row.package_name) {
          return (
            <div>
              <div className="font-medium">{row.package_name}</div>
              {row.price && (
                <div className="text-xs text-gray-500">
                  Rp {parseFloat(row.price).toLocaleString("id-ID")}
                </div>
              )}
            </div>
          );
        } else if (row.package?.name) {
          return row.package.name;
        }
        return "-";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value, row) => {
        const isActive = value === "active";
        const isSuspended = value === "suspended";
        const isExpired = value === "expired";
        const isInactive = value === "inactive";

        return (
          <div className="flex flex-col gap-1">
            <StatusBadge status={value} />
            {isActive && row.days_until_expiry < 3 && (
              <span className="text-xs text-yellow-600">
                ⚠️ Expires in {row.days_until_expiry} days
              </span>
            )}
            {isSuspended && (
              <span className="text-xs text-orange-600">⏸️ Auto-suspended</span>
            )}
            {isExpired && (
              <span className="text-xs text-red-600">❌ Needs renewal</span>
            )}
            {isInactive && (
              <span className="text-xs text-gray-600">
                • Manual deactivated
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "expired_at",
      label: "Expiration",
      render: (value, row) => {
        if (!value) {
          return <span className="text-gray-400">-</span>;
        }

        const expiredDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = expiredDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let statusClass = "text-green-600";
        let statusText = `${diffDays} days left`;

        if (diffDays < 0) {
          statusClass = "text-red-600";
          statusText = "Expired";
        } else if (diffDays === 0) {
          statusClass = "text-yellow-600";
          statusText = "Today";
        } else if (diffDays <= 3) {
          statusClass = "text-yellow-600";
          statusText = `${diffDays} days left`;
        }

        return (
          <div>
            <div className="font-medium">
              {expiredDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </div>
            <div className={`text-xs font-medium ${statusClass}`}>
              {statusText}
            </div>
          </div>
        );
      },
    },
    {
      key: "router",
      label: "Router",
      render: (_, row) => {
        if (row.router_name) {
          return (
            <div>
              <div className="text-sm">{row.router_name}</div>
              <div className="text-xs text-gray-500">{row.router_ip}</div>
            </div>
          );
        }
        return "-";
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isActive = row.status === "active";
        const isSuspended = row.status === "suspended";
        const isInactive = row.status === "inactive";
        const isExpired = row.status === "expired";

        return (
          <div className="flex gap-2">
            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomer(row);
                setIsModalOpen(true);
              }}
              className="text-blue-600 hover:text-blue-900 px-2 py-1 hover:bg-blue-50 rounded text-sm"
              title="Edit Customer"
            >
              Edit
            </button>

            {/* Status-specific Actions */}
            {isActive ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivateClick(row);
                  }}
                  className="text-orange-600 hover:text-orange-900 px-2 py-1 hover:bg-orange-50 rounded text-sm flex items-center gap-1"
                  title="Deactivate Customer"
                  disabled={deactivateMutation.isLoading}
                >
                  <PowerOff className="w-3 h-3" />
                  Deactivate
                </button>
                {/* Manual Suspend Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSuspendClick(row);
                  }}
                  className="text-yellow-600 hover:text-yellow-900 px-2 py-1 hover:bg-yellow-50 rounded text-sm flex items-center gap-1"
                  title="Suspend Customer"
                >
                  <Pause className="w-3 h-3" />
                  Suspend
                </button>
              </>
            ) : isSuspended || isInactive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivateClick(row);
                }}
                className="text-green-600 hover:text-green-900 px-2 py-1 hover:bg-green-50 rounded text-sm flex items-center gap-1"
                title="Activate Customer"
                disabled={activateMutation.isLoading}
              >
                <Power className="w-3 h-3" />
                {isExpired ? "Renew" : "Activate"}
              </button>
            ) : isExpired ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivateClick(row);
                }}
                className="text-green-600 hover:text-green-900 px-2 py-1 hover:bg-green-50 rounded text-sm flex items-center gap-1"
                title="Renew Customer"
                disabled={activateMutation.isLoading}
              >
                <RefreshCw className="w-3 h-3" />
                Renew
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  // Filter customers by status (optional feature)
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCustomers =
    data?.customers?.filter((customer) => {
      if (statusFilter === "all") return true;
      return customer.status === statusFilter;
    }) || [];

  const statusOptions = [
    { value: "all", label: "All", count: data?.customers?.length || 0 },
    {
      value: "active",
      label: "Active",
      count: data?.customers?.filter((c) => c.status === "active").length || 0,
    },
    {
      value: "suspended",
      label: "Suspended",
      count:
        data?.customers?.filter((c) => c.status === "suspended").length || 0,
    },
    {
      value: "inactive",
      label: "Inactive",
      count:
        data?.customers?.filter((c) => c.status === "inactive").length || 0,
    },
    {
      value: "expired",
      label: "Expired",
      count: data?.customers?.filter((c) => c.status === "expired").length || 0,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">
              {data?.total
                ? `Total: ${data.total} customers`
                : "Manage your WiFi customers"}
            </p>
          </div>

          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? option.value === "active"
                    ? "bg-green-500 text-white"
                    : option.value === "inactive"
                    ? "bg-gray-500 text-white"
                    : option.value === "expired"
                    ? "bg-red-500 text-white"
                    : "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {queryError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error loading customers</p>
          <p className="text-red-600 text-sm mt-1">{queryError.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total</h3>
          <p className="text-2xl font-bold mt-1">{data?.total || 0}</p>
          <p className="text-xs text-gray-500 mt-1">All customers</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Active</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {data?.customers?.filter((c) => c.status === "active").length || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Connected</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Suspended</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-orange-600">
            {data?.customers?.filter((c) => c.status === "suspended").length ||
              0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Auto-suspended</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Expired</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600">
            {data?.customers?.filter((c) => c.status === "expired").length || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Need renewal</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Inactive</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-gray-600">
            {data?.customers?.filter((c) => c.status === "inactive").length ||
              0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Deactivated</p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        loading={isLoading}
        searchable={true}
        searchPlaceholder="Search by name, username, or phone..."
        pagination={true}
        itemsPerPage={10}
        onRowClick={(row) => {
          setSelectedCustomer(row);
          setIsModalOpen(true);
        }}
        actions={[
          {
            label: "Export",
            icon: <Download className="w-4 h-4" />,
            variant: "outline",
            onClick: () => toast.success("Export feature coming soon"),
          },
        ]}
      />

      {/* Edit/Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(null);
        }}
        title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
        size="3xl"
      >
        <CustomerForm
          customer={selectedCustomer}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedCustomer(null);
            queryClient.invalidateQueries(["customers"]);
            toast.success("Customer data saved!");
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      </Modal>

      {/* Deactivate Customer Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setCustomerToModify(null);
          setDeactivateReason("");
        }}
        title="Deactivate Customer"
      >
        <div className="p-4">
          {customerToModify && (
            <>
              <div className="mb-4">
                <p className="text-gray-700">
                  Deactivate customer{" "}
                  <span className="font-semibold">{customerToModify.name}</span>
                  ?
                </p>

                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    ⚠️ <span className="font-medium">This will:</span>
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 list-disc pl-5">
                    <li>
                      Change status from{" "}
                      <span className="font-semibold">active</span> to{" "}
                      <span className="font-semibold">inactive</span>
                    </li>
                    <li>Disable PPPoE account on router</li>
                    <li>Preserve all customer data and history</li>
                    <li>Customer can be reactivated later</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Customer requested, Payment issues, etc."
                    rows="3"
                  />
                </div>

                {/* Customer Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    Customer Info:
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Username</p>
                      <p className="text-sm">
                        {customerToModify.username_pppoe}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Package</p>
                      <p className="text-sm">
                        {customerToModify.package_name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expires</p>
                      <p className="text-sm">
                        {customerToModify.expired_at
                          ? new Date(
                              customerToModify.expired_at
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Router</p>
                      <p className="text-sm">
                        {customerToModify.router_name || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setCustomerToModify(null);
                    setDeactivateReason("");
                  }}
                  disabled={deactivateMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  onClick={confirmDeactivate}
                  loading={deactivateMutation.isLoading}
                  disabled={deactivateMutation.isLoading}
                >
                  Deactivate Customer
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Activate Customer Modal */}
      <Modal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setCustomerToModify(null);
        }}
        title={
          customerToModify?.status === "expired"
            ? "Renew Customer"
            : "Activate Customer"
        }
      >
        <div className="p-4">
          {customerToModify && (
            <>
              <div className="mb-4">
                <p className="text-gray-700">
                  {customerToModify.status === "expired"
                    ? `Renew customer ${customerToModify.name}?`
                    : `Activate customer ${customerToModify.name}?`}
                </p>

                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ <span className="font-medium">This will:</span>
                  </p>
                  <ul className="text-sm text-green-700 mt-2 list-disc pl-5">
                    <li>
                      Change status from{" "}
                      <span className="font-semibold">
                        {customerToModify.status}
                      </span>{" "}
                      to <span className="font-semibold">active</span>
                    </li>
                    <li>Enable PPPoE account on router</li>
                    <li>Customer can connect to internet</li>
                  </ul>
                </div>

                {/* Customer Info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">
                    Customer Information:
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <p className="text-xs text-blue-600">Username</p>
                      <p className="text-sm font-medium">
                        {customerToModify.username_pppoe}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Package</p>
                      <p className="text-sm font-medium">
                        {customerToModify.package_name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Current Status</p>
                      <p className="text-sm font-medium capitalize">
                        {customerToModify.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Expiration</p>
                      <p className="text-sm font-medium">
                        {customerToModify.expired_at
                          ? new Date(
                              customerToModify.expired_at
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {customerToModify.status === "expired" && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-yellow-700">
                        ⚠️ Customer has expired. Consider creating an invoice
                        for renewal first.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActivateModal(false);
                    setCustomerToModify(null);
                  }}
                  disabled={activateMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={confirmActivate}
                  loading={activateMutation.isLoading}
                  disabled={activateMutation.isLoading}
                >
                  {customerToModify.status === "expired"
                    ? "Renew Customer"
                    : "Activate Customer"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
