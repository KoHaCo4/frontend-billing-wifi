"use client";

import { useEffect, useState } from "react";
import {
  Search,
  UserPlus,
  Download,
  Power,
  Pause,
  PowerOff,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api"; // Sesuaikan dengan path Anda

export default function BillingMemberPage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    setError(null);
    try {
      // Menggunakan endpoint yang sama seperti CustomerPage
      const response = await api.get("/customers");

      console.log("📊 API Response:", response.data);

      // Handle different response structures
      let customers = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          customers = response.data.data;
        } else if (Array.isArray(response.data.customers)) {
          customers = response.data.customers;
        } else if (Array.isArray(response.data)) {
          customers = response.data;
        }
      }

      console.log("✅ Processed customers:", customers.length);

      // Map data to match Billing Member format
      const mappedMembers = customers.map((customer) => ({
        user_id: customer.id || customer.customer_id,
        name: customer.name || "-",
        internet: customer.username_pppoe || customer.username || "-",
        whatsapp: customer.phone || "-",
        active_date: customer.created_at
          ? new Date(customer.created_at).toLocaleDateString("id-ID")
          : "-",
        next_invoice: customer.expired_at
          ? new Date(customer.expired_at).toLocaleDateString("id-ID")
          : "-",
        payment_type: getPaymentType(customer), // Extract from package or other info
        status: customer.status || "unknown",
        // Keep original data for reference
        original_data: customer,
      }));

      setMembers(mappedMembers);
    } catch (err) {
      console.error("❌ Error fetching members:", err);
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  // Helper function to determine payment type
  function getPaymentType(customer) {
    if (customer.payment_type) return customer.payment_type;

    // Try to extract from package name
    const packageName = customer.package_name || customer.package?.name || "";

    if (
      packageName.toLowerCase().includes("monthly") ||
      packageName.toLowerCase().includes("bulanan")
    ) {
      return "monthly";
    } else if (
      packageName.toLowerCase().includes("yearly") ||
      packageName.toLowerCase().includes("tahunan")
    ) {
      return "yearly";
    } else if (
      packageName.toLowerCase().includes("daily") ||
      packageName.toLowerCase().includes("harian")
    ) {
      return "daily";
    }

    return "monthly"; // default
  }

  // Filter members
  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.internet.toLowerCase().includes(search.toLowerCase()) ||
      m.whatsapp.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || m.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Status statistics
  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    expired: members.filter((m) => m.status === "expired").length,
    suspended: members.filter((m) => m.status === "suspended").length,
    inactive: members.filter((m) => m.status === "inactive").length,
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      expired: { color: "bg-red-100 text-red-800", label: "Expired" },
      suspended: { color: "bg-orange-100 text-orange-800", label: "Suspended" },
      inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
    };

    const { color, label } = config[status] || {
      color: "bg-gray-100 text-gray-800",
      label: status || "Unknown",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // Payment type badge
  const PaymentBadge = ({ type }) => {
    const config = {
      monthly: { color: "bg-blue-100 text-blue-800", label: "Monthly" },
      yearly: { color: "bg-purple-100 text-purple-800", label: "Yearly" },
      daily: { color: "bg-cyan-100 text-cyan-800", label: "Daily" },
    };

    const { color, label } = config[type] || {
      color: "bg-gray-100 text-gray-800",
      label: type || "Unknown",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // Action buttons similar to CustomerPage
  const handleAction = (member, action) => {
    console.log(`${action} member:`, member);
    // Implement your action logic here
    alert(`${action} action for ${member.name}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing / Member</h1>
          <p className="text-gray-600">Manage customer billing and members</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fetchMembers()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => alert("Export feature coming soon")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total</h3>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">All Members</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Active</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {stats.active}
          </p>
          <p className="text-xs text-gray-500 mt-1">Connected</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Suspended</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-orange-600">
            {stats.suspended}
          </p>
          <p className="text-xs text-gray-500 mt-1">Paused</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Expired</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600">
            {stats.expired}
          </p>
          <p className="text-xs text-gray-500 mt-1">Need Renewal</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Inactive</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-gray-600">
            {stats.inactive}
          </p>
          <p className="text-xs text-gray-500 mt-1">Deactivated</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error loading members</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchMembers()}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username, or phone..."
              className="pl-9 pr-3 py-2 border rounded-md w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: "all", label: "All", count: stats.total },
              { value: "active", label: "Active", count: stats.active },
              { value: "expired", label: "Expired", count: stats.expired },
              {
                value: "suspended",
                label: "Suspended",
                count: stats.suspended,
              },
              { value: "inactive", label: "Inactive", count: stats.inactive },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === option.value
                    ? option.value === "active"
                      ? "bg-green-500 text-white"
                      : option.value === "expired"
                      ? "bg-red-500 text-white"
                      : option.value === "suspended"
                      ? "bg-orange-500 text-white"
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  User ID
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  Full Name
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  Internet
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  WhatsApp
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  Active Date
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  Next Invoice
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  Payment
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <p className="mt-2 text-gray-600">Loading members...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-700 font-medium">
                        No members found
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {search || statusFilter !== "all"
                          ? "Try adjusting your search or filter"
                          : "No members available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.user_id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {m.user_id}
                      </code>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{m.name}</td>
                    <td className="p-4">
                      <div className="font-medium">{m.internet}</div>
                      {m.original_data?.package_name && (
                        <div className="text-xs text-gray-500">
                          {m.original_data.package_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {m.whatsapp !== "-" ? (
                        <a
                          href={`https://wa.me/${m.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 hover:underline"
                        >
                          {m.whatsapp}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 text-gray-700">{m.active_date}</td>
                    <td className="p-4">
                      <div className="font-medium">{m.next_invoice}</div>
                      {m.original_data?.expired_at && (
                        <div className="text-xs text-gray-500">
                          {(() => {
                            const expiredDate = new Date(
                              m.original_data.expired_at
                            );
                            const today = new Date();
                            const diffTime =
                              expiredDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24)
                            );

                            if (diffDays < 0) {
                              return (
                                <span className="text-red-600">Expired</span>
                              );
                            } else if (diffDays === 0) {
                              return (
                                <span className="text-yellow-600">Today</span>
                              );
                            } else if (diffDays <= 3) {
                              return (
                                <span className="text-yellow-600">
                                  {diffDays} days left
                                </span>
                              );
                            } else {
                              return (
                                <span className="text-green-600">
                                  {diffDays} days left
                                </span>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <PaymentBadge type={m.payment_type} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(m, "view")}
                          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 hover:bg-blue-50 rounded"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAction(m, "invoice")}
                          className="text-green-600 hover:text-green-800 text-sm px-2 py-1 hover:bg-green-50 rounded"
                        >
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filtered.length > 0 && (
          <div className="border-t bg-gray-50 px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{filtered.length}</span>{" "}
                of <span className="font-medium">{members.length}</span> members
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => alert("Previous page")}
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => alert("Next page")}
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
