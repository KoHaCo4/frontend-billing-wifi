"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Plus, Download, Eye, CheckCircle, Trash2, Filter } from "lucide-react";
import DataTable from "@/components/UI/DataTable";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import StatusBadge from "@/components/UI/StatusBadge";
import InvoiceForm from "@/components/Invoices/InvoiceForm";
import { api } from "@/lib/api";

// API functions dengan filter status
const fetchInvoices = async (statusFilter = "all") => {
  try {
    console.log("📦 Fetching invoices with filter:", statusFilter);

    // Tambahkan parameter status jika bukan 'all'
    const params = {};
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    const response = await api.get("/invoices", { params });

    console.log("✅ Invoice API Response:", {
      success: response.data.success,
      dataLength: response.data.data?.length,
      pagination: response.data.pagination,
    });

    // Urutkan data: pending dulu, lalu created_at terbaru
    let invoices = response.data.data || [];

    // Urutkan berdasarkan:
    // 1. Status: pending > overdue > paid > cancelled
    // 2. Tanggal: terbaru ke terlama
    invoices.sort((a, b) => {
      // Priority order untuk status
      const statusOrder = {
        pending: 1,
        overdue: 2,
        paid: 3,
        cancelled: 4,
      };

      const statusA = a.display_status || a.status;
      const statusB = b.display_status || b.status;

      // Jika status berbeda, urutkan berdasarkan priority
      if (statusOrder[statusA] !== statusOrder[statusB]) {
        return statusOrder[statusA] - statusOrder[statusB];
      }

      // Jika status sama, urutkan berdasarkan created_at (terbaru dulu)
      const dateA = new Date(a.created_at || a.issue_date);
      const dateB = new Date(b.created_at || b.issue_date);
      return dateB - dateA;
    });

    return {
      invoices: invoices,
      total: response.data.pagination?.total || 0,
      filteredCount: invoices.length,
    };
  } catch (error) {
    console.error("❌ Fetch invoices error:", error);

    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    }

    toast.error("Failed to load invoices");
    return { invoices: [], total: 0, filteredCount: 0 };
  }
};

// Function untuk mark invoice as paid
const payInvoice = async ({ invoiceId, amount, payment_method = "cash" }) => {
  try {
    console.log("💳 Paying invoice with data:", {
      invoiceId,
      amount,
      payment_method,
    });

    // Convert amount to number
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Invalid payment amount");
    }

    const response = await api.post(`/invoices/${invoiceId}/pay`, {
      amount: paymentAmount,
      payment_method,
      reference: `PAY-${Date.now()}`,
      notes: "Payment processed via dashboard",
    });

    console.log("✅ Payment response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Pay invoice error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

export default function InvoicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewMode, setViewMode] = useState("form");
  const [showPayConfirmModal, setShowPayConfirmModal] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  // Fungsi untuk handle klik tombol bayar
  const handlePayClick = (invoice) => {
    setInvoiceToPay(invoice);
    setShowPayConfirmModal(true);
  };

  // Fungsi untuk konfirmasi pembayaran
  const confirmPayment = () => {
    if (!invoiceToPay) return;

    payMutation.mutate({
      invoiceId: invoiceToPay.id,
      amount: invoiceToPay.amount,
      payment_method: paymentMethod,
    });

    setShowPayConfirmModal(false);
    setInvoiceToPay(null);
  };

  // Fetch invoices dengan filter status
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: () => fetchInvoices(statusFilter),
    refetchOnWindowFocus: false,
  });

  // Filter invoices berdasarkan search query
  const filteredInvoices =
    data?.invoices?.filter((invoice) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        invoice.invoice_number?.toLowerCase().includes(query) ||
        invoice.customer_name?.toLowerCase().includes(query) ||
        invoice.customer_phone?.toLowerCase().includes(query) ||
        invoice.description?.toLowerCase().includes(query)
      );
    }) || [];

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: payInvoice,
    onSuccess: (data) => {
      // Tampilkan informasi perpanjangan jika ada
      if (data.data?.customer_extended) {
        toast.success(
          <div>
            <p className="font-medium">Invoice paid successfully!</p>
            <p className="text-sm mt-1">
              Customer subscription has been extended.
            </p>
          </div>
        );
      } else {
        toast.success("Invoice paid successfully!");
      }

      queryClient.invalidateQueries(["invoices"]);
      queryClient.invalidateQueries(["customers"]);
    },
    onError: (error) => {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Failed to process payment");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await api.delete(`/invoices/${invoiceId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      queryClient.invalidateQueries(["invoices"]);
    },
    onError: (error) => {
      console.error("Delete invoice error:", error);

      if (error.response?.data?.code === "HAS_PAYMENTS") {
        toast.error(
          <div>
            <p className="font-medium">Cannot Delete Invoice</p>
            <p className="text-sm mt-1">{error.response.data.message}</p>
            <p className="text-xs mt-2 text-gray-600">
              ❌ Please cancel the invoice instead, or delete payments first.
            </p>
            <button
              onClick={() => {
                if (error.response?.data?.code === "HAS_PAYMENTS") {
                  // Offer to cancel instead
                  if (
                    confirm("Would you like to cancel this invoice instead?")
                  ) {
                    cancelMutation.mutate(error.config.url.split("/").pop());
                  }
                }
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Cancel Invoice Instead
            </button>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to delete invoice"
        );
      }
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await api.post(`/invoices/${invoiceId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Invoice cancelled successfully");
      queryClient.invalidateQueries(["invoices"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to cancel invoice");
    },
  });

  // Statistik berdasarkan data yang difilter
  const getStatistics = () => {
    const invoices = data?.invoices || [];
    return {
      total: invoices.length,
      pending: invoices.filter((i) => i.status === "pending").length,
      paid: invoices.filter((i) => i.status === "paid").length,
      overdue: invoices.filter((i) => i.display_status === "overdue").length,
      cancelled: invoices.filter((i) => i.status === "cancelled").length,
    };
  };

  const stats = getStatistics();

  // Columns definition
  const columns = [
    {
      key: "invoice_number",
      label: "Invoice Number",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.customer_name || "N/A"}
          </div>
          {row.customer_phone && (
            <div className="text-xs text-gray-400">{row.customer_phone}</div>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) => `Rp ${parseFloat(value).toLocaleString("id-ID")}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value, row) => {
        const status = row.display_status || value;
        const isOverdue = status === "overdue";
        const isPending = status === "pending";

        return (
          <div className="flex flex-col gap-1">
            <StatusBadge status={status} />
            {isPending && (
              <span className="text-xs text-yellow-600">• Needs action</span>
            )}
            {isOverdue && (
              <span className="text-xs text-red-600">• Urgent</span>
            )}
          </div>
        );
      },
    },
    {
      key: "issue_date",
      label: "Issue Date",
      render: (value) => new Date(value).toLocaleDateString("id-ID"),
    },
    {
      key: "due_date",
      label: "Due Date",
      render: (value, row) => {
        const isOverdue = row.days_until_due < 0;
        return (
          <div>
            <div className={isOverdue ? "text-red-600 font-medium" : ""}>
              {new Date(value).toLocaleDateString("id-ID")}
            </div>
            {isOverdue && (
              <div className="text-xs text-red-600">
                Overdue by {-row.days_until_due} days
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isPaid = row.status === "paid";
        const isPending = row.status === "pending";
        const isCancelled = row.status === "cancelled";

        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedInvoice(row);
                setViewMode("detail");
                setIsModalOpen(true);
              }}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {isPending && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePayClick(row);
                  }}
                  className="text-green-600 hover:text-green-900 p-1"
                  title="Mark as Paid"
                  disabled={payMutation.isLoading}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Cancel invoice ${row.invoice_number}?`)) {
                      cancelMutation.mutate(row.id);
                    }
                  }}
                  className="text-orange-600 hover:text-orange-900 p-1"
                  title="Cancel Invoice"
                  disabled={cancelMutation.isLoading}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete invoice ${row.invoice_number}?`)) {
                  deleteMutation.mutate(row.id);
                }
              }}
              className="text-red-600 hover:text-red-900 p-1"
              title="Delete Invoice"
              disabled={deleteMutation.isLoading || isPaid || isCancelled}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All Invoices", color: "gray" },
    { value: "pending", label: "Pending", color: "yellow" },
    { value: "overdue", label: "Overdue", color: "red" },
    { value: "paid", label: "Paid", color: "green" },
    { value: "cancelled", label: "Cancelled", color: "gray" },
  ];

  // Tampilkan error state
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Invoices</h3>
          <p className="text-red-600 text-sm mt-1">
            {error.message || "Unknown error occurred"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600">
              Manage customer invoices and payments
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                toast.success("Export feature coming soon!");
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => {
                setSelectedInvoice(null);
                setViewMode("form");
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusFilter === option.value
                    ? option.value === "all"
                      ? "bg-gray-800 text-white"
                      : option.value === "pending"
                      ? "bg-yellow-500 text-white"
                      : option.value === "overdue"
                      ? "bg-red-500 text-white"
                      : option.value === "paid"
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Filter className="w-3 h-3" />
                {option.label}
                {statusFilter === option.value && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {option.value === "all"
                      ? stats.total
                      : option.value === "pending"
                      ? stats.pending
                      : option.value === "overdue"
                      ? stats.overdue
                      : option.value === "paid"
                      ? stats.paid
                      : stats.cancelled}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search invoices, customers, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center text-sm text-blue-800">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <span className="font-semibold">{stats.pending} pending</span> and{" "}
            <span className="font-semibold text-red-600">
              {stats.overdue} overdue
            </span>{" "}
            invoices need your attention. New invoices appear at the top.
          </span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={filteredInvoices}
          loading={isLoading}
          searchable={false} // We're using custom search
          pagination={true}
          itemsPerPage={10}
          onRowClick={(row) => {
            setSelectedInvoice(row);
            setViewMode("detail");
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* Statistics Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total</h3>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">All invoices</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-yellow-600">
            {stats.pending}
          </p>
          <p className="text-xs text-gray-500 mt-1">Need action</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600">
            {stats.overdue}
          </p>
          <p className="text-xs text-gray-500 mt-1">Urgent attention</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <h3 className="text-sm font-medium text-gray-500">Paid</h3>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.paid}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Cancelled</h3>
          <p className="text-2xl font-bold mt-1 text-gray-600">
            {stats.cancelled}
          </p>
          <p className="text-xs text-gray-500 mt-1">Voided invoices</p>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={showPayConfirmModal}
        onClose={() => {
          setShowPayConfirmModal(false);
          setInvoiceToPay(null);
        }}
        title="Confirm Payment"
      >
        <div className="p-4">
          {invoiceToPay && (
            <>
              <div className="mb-4">
                <p className="text-gray-700">
                  Are you sure you want to mark invoice{" "}
                  <span className="font-semibold">
                    {invoiceToPay.invoice_number}
                  </span>{" "}
                  as paid?
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">
                        {invoiceToPay.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-medium">
                        Rp{" "}
                        {parseFloat(invoiceToPay.amount).toLocaleString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Payment Method
                      </p>
                      <div className="flex gap-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="payment_method"
                            value="cash"
                            checked={paymentMethod === "cash"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-2"
                          />
                          <span>Cash</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="payment_method"
                            value="transfer"
                            checked={paymentMethod === "transfer"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-2"
                          />
                          <span>Transfer</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="payment_method"
                            value="qris"
                            checked={paymentMethod === "qris"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-2"
                          />
                          <span>QRIS</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPayConfirmModal(false);
                    setInvoiceToPay(null);
                  }}
                  disabled={payMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPayment}
                  loading={payMutation.isLoading}
                  disabled={payMutation.isLoading}
                >
                  Confirm Payment
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Invoice Detail/Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInvoice(null);
          setViewMode("form");
        }}
        title={
          viewMode === "form"
            ? selectedInvoice
              ? "Edit Invoice"
              : "Create Invoice"
            : `Invoice ${selectedInvoice?.invoice_number}`
        }
        size={viewMode === "detail" ? "lg" : "md"}
      >
        {viewMode === "form" ? (
          <InvoiceForm
            invoice={selectedInvoice}
            onSuccess={() => {
              setIsModalOpen(false);
              setSelectedInvoice(null);
              queryClient.invalidateQueries(["invoices"]);
            }}
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedInvoice(null);
            }}
          />
        ) : (
          <InvoiceDetail invoice={selectedInvoice} />
        )}
      </Modal>
    </div>
  );
}

// Invoice Detail Component
function InvoiceDetail({ invoice }) {
  if (!invoice) return <div>No invoice data</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Invoice Number</p>
          <p className="font-medium">{invoice.invoice_number}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <div className="mt-1">
            <StatusBadge status={invoice.display_status || invoice.status} />
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">Customer</p>
          <p className="font-medium">{invoice.customer_name || "N/A"}</p>
          {invoice.customer_phone && (
            <p className="text-sm text-gray-500">{invoice.customer_phone}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600">Amount</p>
          <p className="font-medium">
            Rp {parseFloat(invoice.amount).toLocaleString("id-ID")}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Issue Date</p>
          <p className="font-medium">
            {new Date(invoice.issue_date).toLocaleDateString("id-ID")}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Due Date</p>
          <p className="font-medium">
            {new Date(invoice.due_date).toLocaleDateString("id-ID")}
          </p>
          {invoice.days_until_due < 0 && (
            <p className="text-xs text-red-600">
              Overdue by {-invoice.days_until_due} days
            </p>
          )}
        </div>
        {invoice.paid_date && (
          <div>
            <p className="text-sm text-gray-600">Paid Date</p>
            <p className="font-medium">
              {new Date(invoice.paid_date).toLocaleDateString("id-ID")}
            </p>
          </div>
        )}
        {invoice.created_at && (
          <div>
            <p className="text-sm text-gray-600">Created At</p>
            <p className="font-medium">
              {new Date(invoice.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
        )}
      </div>

      {invoice.description && (
        <div>
          <p className="text-sm text-gray-600">Description</p>
          <p className="mt-1 p-3 bg-gray-50 rounded-lg">
            {invoice.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            window.open(`/api/invoices/${invoice.id}/print`, "_blank");
            toast.success("Print feature coming soon!");
          }}
        >
          Print Invoice
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(invoice.invoice_number);
            toast.success("Invoice number copied!");
          }}
        >
          Copy Invoice Number
        </Button>
      </div>
    </div>
  );
}
