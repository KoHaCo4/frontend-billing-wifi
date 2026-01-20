// app/dashboard/billing/transactions/page.js
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
  Calendar,
  BarChart,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  FileText,
  Database,
  CalendarDays,
} from "lucide-react";
import DataTable from "@/components/UI/DataTable";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import {
  TransactionStatusBadge,
  PaymentMethodBadge,
} from "@/components/Transactions/TransactionBadges";
import {
  useTransactions,
  useMarkAsPaid,
  useTransactionAnalytics,
} from "@/hooks/useTransactions";
import { api } from "@/lib/api";

// Format currency helper
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Format date helper
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return date.toLocaleDateString("id-ID", options);
};

export default function TransactionPage() {
  // State untuk filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateRange, setShowDateRange] = useState(false);

  // State untuk modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");

  // Prepare filters
  const filters = useMemo(() => {
    const filterObj = {};

    if (statusFilter !== "all") filterObj.status = statusFilter;
    if (paymentMethodFilter !== "all")
      filterObj.paymentMethod = paymentMethodFilter;
    if (search) filterObj.search = search;
    if (startDate) filterObj.startDate = startDate;
    if (endDate) filterObj.endDate = endDate;

    return filterObj;
  }, [statusFilter, paymentMethodFilter, search, startDate, endDate]);

  // Gunakan custom hooks
  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTransactions(filters);

  const { data: analytics, isLoading: isLoadingAnalytics } =
    useTransactionAnalytics();

  const { mutate: markAsPaid, isLoading: isMarkingAsPaid } = useMarkAsPaid();

  // Hitung statistik dari filtered data
  const filteredStats = useMemo(() => {
    const total = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0,
    );
    const paid = transactions.filter((t) => t.status === "paid").length;
    const pending = transactions.filter((t) => t.status === "pending").length;
    const failed = transactions.filter((t) => t.status === "failed").length;
    const refunded = transactions.filter((t) => t.status === "refunded").length;

    // Group by payment method
    const paymentMethods = {};
    transactions.forEach((t) => {
      const method = t.payment_method || "unknown";
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    return {
      total,
      totalAmount,
      paid,
      pending,
      failed,
      refunded,
      paymentMethods,
    };
  }, [transactions]);

  // Columns untuk DataTable
  const columns = [
    {
      key: "id",
      label: "Transaction ID",
      render: (value, row) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-gray-900">{value}</div>
          <div className="flex items-center gap-2 mt-1">
            {row.source === "payments_table" && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                Payment
              </span>
            )}
            {row.source === "invoices_table" && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                Invoice
              </span>
            )}
            {row.source === "logs_table" && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                Log
              </span>
            )}
          </div>
          {row.invoice_number && (
            <div className="text-xs text-gray-500 mt-1">
              Invoice: {row.invoice_number}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "customer_name",
      label: "Customer",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value || "N/A"}</div>
          {row.customer_id && (
            <div className="text-xs text-gray-500 mt-0.5">
              ID: {row.customer_id}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) => (
        <div className="font-bold text-gray-900">{formatCurrency(value)}</div>
      ),
    },
    {
      key: "payment_method",
      label: "Payment Method",
      render: (value) => <PaymentMethodBadge method={value} />,
    },
    {
      key: "created_at",
      label: "Date",
      render: (value) => (
        <div className="text-sm">{formatDate(value, true)}</div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <TransactionStatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row);
              setShowDetailModal(true);
            }}
            className="text-blue-600 hover:text-blue-900 text-sm px-2 py-1 hover:bg-blue-50 rounded flex items-center gap-1"
            title="View Details"
          >
            <Eye className="w-3 h-3" />
            View
          </button>

          {row.status === "pending" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTransaction(row);
                setShowMarkPaidModal(true);
              }}
              className="text-green-600 hover:text-green-900 text-sm px-2 py-1 hover:bg-green-50 rounded flex items-center gap-1"
              title="Mark as Paid"
            >
              <CheckCircle className="w-3 h-3" />
              Pay
            </button>
          )}
        </div>
      ),
    },
  ];

  // Handle export data
  const handleExport = () => {
    const exportData = transactions.map((t) => ({
      "Transaction ID": t.id,
      "Invoice Number": t.invoice_number || "",
      Customer: t.customer_name,
      Amount: t.amount,
      Status: t.status,
      "Payment Method": t.payment_method,
      Reference: t.reference || "",
      Date: formatDate(t.created_at, true),
      Description: t.description || "",
      Source: t.source || "unknown",
    }));

    const csvContent = [
      Object.keys(exportData[0] || {}).join(","),
      ...exportData.map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${exportData.length} transactions`);
  };

  // Handle mark as paid
  const handleConfirmMarkAsPaid = () => {
    if (!selectedTransaction) return;

    markAsPaid({
      transactionId: selectedTransaction.invoice_id
        ? `INV-${selectedTransaction.invoice_id}`
        : selectedTransaction.id,
      paymentMethod: paymentMethod,
      reference: reference || `MANUAL-${Date.now()}`,
    });

    setShowMarkPaidModal(false);
    setSelectedTransaction(null);
    setPaymentMethod("cash");
    setReference("");
  };

  // Handle date range filter
  const handleDateRangeApply = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }
    setDateFilter("custom");
  };

  const handleDateRangeClear = () => {
    setStartDate("");
    setEndDate("");
    setDateFilter("all");
  };

  // Data source breakdown
  const dataSources = {
    payments_table: transactions.filter((t) => t.source === "payments_table")
      .length,
    invoices_table: transactions.filter((t) => t.source === "invoices_table")
      .length,
    logs_table: transactions.filter((t) => t.source === "logs_table").length,
    fallback: transactions.filter((t) => t.source === "fallback").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Transactions
          </h1>
          <p className="text-gray-600">
            Track and manage all payment transactions from database
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Value</p>
              <p className="text-2xl font-bold mt-1 text-blue-900">
                {formatCurrency(filteredStats.totalAmount)}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <Database className="w-4 h-4 mr-1" />
            <span>{filteredStats.total} transactions</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Completed</p>
              <p className="text-2xl font-bold mt-1 text-green-900">
                {filteredStats.paid}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4">
            {filteredStats.total > 0
              ? Math.round((filteredStats.paid / filteredStats.total) * 100)
              : 0}
            % success rate
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Pending</p>
              <p className="text-2xl font-bold mt-1 text-yellow-900">
                {filteredStats.pending}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-yellow-600 mt-4">Need attention</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Payment Methods
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {Object.keys(filteredStats.paymentMethods).length}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">Different methods used</p>
        </div>
      </div>

      {/* Analytics Summary */}
      {!isLoadingAnalytics && analytics && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Transaction Analytics</h3>
            <CalendarDays className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Today</p>
              <p className="text-lg font-bold mt-1">
                {analytics.today.count} transactions
              </p>
              <p className="text-sm text-blue-600">
                {formatCurrency(analytics.today.amount)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">This Week</p>
              <p className="text-lg font-bold mt-1">
                {analytics.thisWeek.count} transactions
              </p>
              <p className="text-sm text-green-600">
                {formatCurrency(analytics.thisWeek.amount)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">This Month</p>
              <p className="text-lg font-bold mt-1">
                {analytics.thisMonth.count} transactions
              </p>
              <p className="text-sm text-purple-600">
                {formatCurrency(analytics.thisMonth.amount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Sources Breakdown */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Data Sources</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(dataSources).map(
            ([source, count]) =>
              count > 0 && (
                <div
                  key={source}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    {source === "payments_table" && (
                      <Database className="w-4 h-4 text-blue-600 mr-2" />
                    )}
                    {source === "invoices_table" && (
                      <FileText className="w-4 h-4 text-green-600 mr-2" />
                    )}
                    {source === "logs_table" && (
                      <BarChart className="w-4 h-4 text-purple-600 mr-2" />
                    )}
                    {source === "fallback" && (
                      <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">
                      {source
                        .replace("_table", "")
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              ),
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by ID, invoice, customer, or reference..."
              className="pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Group */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <select
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="qris">QRIS</option>
              <option value="credit_card">Credit Card</option>
              <option value="e-wallet">E-Wallet</option>
            </select>

            {/* Date Filter */}
            <select
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== "custom") {
                  setShowDateRange(false);
                  setStartDate("");
                  setEndDate("");
                } else {
                  setShowDateRange(true);
                }
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Clear Filters */}
            {(search ||
              statusFilter !== "all" ||
              paymentMethodFilter !== "all" ||
              dateFilter !== "all" ||
              startDate ||
              endDate) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPaymentMethodFilter("all");
                  setDateFilter("all");
                  setStartDate("");
                  setEndDate("");
                  setShowDateRange(false);
                }}
                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range */}
        {showDateRange && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleDateRangeApply}
                  className="whitespace-nowrap"
                >
                  Apply Range
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDateRangeClear}
                  className="whitespace-nowrap"
                >
                  Clear
                </Button>
              </div>
            </div>
            {startDate && endDate && (
              <p className="text-sm text-gray-600 mt-2">
                Showing transactions from {formatDate(startDate)} to{" "}
                {formatDate(endDate)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-medium text-gray-900">Payment Transactions</h3>
          <div className="text-sm text-gray-600">
            Showing {transactions.length} of {filteredStats.total} filtered
            transactions
          </div>
        </div>

        <DataTable
          columns={columns}
          data={transactions}
          loading={isLoading}
          searchable={false}
          pagination={true}
          itemsPerPage={15}
          onRowClick={(row) => {
            setSelectedTransaction(row);
            setShowDetailModal(true);
          }}
        />

        {/* Table Footer */}
        {!isLoading && transactions.length > 0 && (
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Total value:{" "}
                <span className="font-bold">
                  {formatCurrency(filteredStats.totalAmount)}
                </span>
                <span className="mx-2">•</span>
                <span className="font-medium">{filteredStats.paid} paid</span>
                {filteredStats.pending > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="font-medium text-yellow-600">
                      {filteredStats.pending} pending
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Database className="w-4 h-4 mr-2" />
                Data from:{" "}
                {Object.entries(dataSources)
                  .filter(([_, count]) => count > 0)
                  .map(
                    ([source, count]) =>
                      `${source.replace("_table", "")}: ${count}`,
                  )
                  .join(", ")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {isError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {error?.message || "Error loading transactions"}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Using combined data from multiple sources.</p>
                <p className="mt-1">
                  Check API endpoints: /payments, /invoices, /logs
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      <Modal
        isOpen={showMarkPaidModal}
        onClose={() => {
          setShowMarkPaidModal(false);
          setSelectedTransaction(null);
          setReference("");
        }}
        title="Record Payment"
      >
        <div className="p-4">
          {selectedTransaction && (
            <>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Record payment for this transaction:
                </p>

                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Transaction ID</p>
                      <p className="font-medium">{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Invoice</p>
                      <p className="font-medium">
                        {selectedTransaction.invoice_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">
                        {selectedTransaction.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-bold text-lg">
                        {formatCurrency(selectedTransaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        "cash",
                        "transfer",
                        "qris",
                        "e-wallet",
                        "credit_card",
                      ].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 ${
                            paymentMethod === method
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <PaymentMethodBadge method={method} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="TRF-123456, CASH-001, etc."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Bank transfer reference, receipt number, etc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMarkPaidModal(false);
                    setSelectedTransaction(null);
                    setReference("");
                  }}
                  disabled={isMarkingAsPaid}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmMarkAsPaid}
                  loading={isMarkingAsPaid}
                  disabled={isMarkingAsPaid}
                >
                  Record Payment
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTransaction(null);
        }}
        title="Transaction Details"
        size="lg"
      >
        {selectedTransaction && (
          <div className="p-4 space-y-6">
            {/* Header Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg">
                    {selectedTransaction.id}
                  </h4>
                  <p className="text-gray-600 mt-1">
                    {selectedTransaction.description || "Payment transaction"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        selectedTransaction.source === "payments_table"
                          ? "bg-blue-100 text-blue-800"
                          : selectedTransaction.source === "invoices_table"
                            ? "bg-green-100 text-green-800"
                            : selectedTransaction.source === "logs_table"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedTransaction.source
                        ?.replace("_table", "")
                        .toUpperCase()}
                    </span>
                    <TransactionStatusBadge
                      status={selectedTransaction.status}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                  <p className="text-sm text-gray-600">Amount</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Customer
                </p>
                <p className="font-medium text-gray-900">
                  {selectedTransaction.customer_name}
                </p>
                {selectedTransaction.customer_id && (
                  <p className="text-sm text-gray-600 mt-1">
                    ID: {selectedTransaction.customer_id}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Invoice Number
                </p>
                <p className="font-medium text-gray-900">
                  {selectedTransaction.invoice_number || "N/A"}
                </p>
                {selectedTransaction.invoice_id && (
                  <p className="text-sm text-gray-600 mt-1">
                    Invoice ID: {selectedTransaction.invoice_id}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Payment Method
                </p>
                <div className="mt-1">
                  <PaymentMethodBadge
                    method={selectedTransaction.payment_method}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Reference
                </p>
                <p className="font-medium text-gray-900">
                  {selectedTransaction.reference || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Transaction Date
                </p>
                <p className="font-medium text-gray-900">
                  {formatDate(selectedTransaction.created_at, true)}
                </p>
              </div>

              {selectedTransaction.paid_at && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Paid Date
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedTransaction.paid_at, true)}
                  </p>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-700">
                  {selectedTransaction.notes || "No additional notes provided."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(selectedTransaction.id);
                  toast.success("Transaction ID copied!");
                }}
              >
                Copy ID
              </Button>

              {selectedTransaction.status === "pending" && (
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowMarkPaidModal(true);
                  }}
                >
                  Record Payment
                </Button>
              )}

              <Button
                variant="primary"
                onClick={() => {
                  toast.success("Receipt generation feature coming soon!");
                }}
              >
                Generate Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
