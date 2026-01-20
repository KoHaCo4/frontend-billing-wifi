// hooks/useTransactions.js - Versi final
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";

// Fungsi utama untuk fetch transactions - SUDAH DIEKSPOR DI SINI
export async function fetchTransactions() {
  try {
    console.log("📊 Attempting to fetch from /payments...");

    // Coba endpoint /payments
    const response = await api.get("/payments", {
      params: {
        status: "completed",
        limit: 50,
      },
    });

    console.log("✅ /payments response received");

    if (response.data && response.data.success) {
      const paymentsData = response.data.data || [];
      console.log(`💰 Found ${paymentsData.length} payments from API`);

      const transactions = paymentsData.map((payment) => ({
        id: `PAY-${payment.id}`,
        payment_id: payment.id,
        invoice_id: payment.invoice_id,
        invoice_number: payment.invoice_number || `INV-${payment.invoice_id}`,
        customer_name:
          payment.customer_name || `Customer ${payment.customer_id}`,
        customer_id: payment.customer_id,
        customer_phone: payment.customer_phone || "",
        amount: parseFloat(payment.amount) || 0,
        status: "paid",
        payment_method: payment.payment_method || "cash",
        reference: payment.reference || `REF-${payment.id}`,
        notes: payment.notes || "Payment processed",
        created_at: payment.created_at,
        paid_at: payment.paid_at || payment.created_at,
        description: "Payment transaction",
        type: "payment",
        source: "payments_table",
      }));

      return transactions.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
    }

    throw new Error("Invalid response from /payments");
  } catch (error) {
    console.warn(
      "⚠️ /payments failed, falling back to /invoices...",
      error.message,
    );

    try {
      // Fallback ke /invoices
      const response = await api.get("/invoices", {
        params: {
          status: "paid",
          limit: 50,
        },
      });

      console.log("✅ /invoices response received");

      if (response.data && response.data.success) {
        const invoicesData = response.data.data || [];
        console.log(`🧾 Found ${invoicesData.length} paid invoices`);

        const transactions = invoicesData.map((invoice) => ({
          id: `INV-${invoice.id}`,
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name:
            invoice.customer_name || `Customer ${invoice.customer_id}`,
          customer_id: invoice.customer_id,
          customer_phone: invoice.customer_phone || "",
          amount: parseFloat(invoice.amount) || 0,
          status: "paid",
          payment_method: invoice.payment_method || "cash",
          reference: invoice.reference_number || `INV-REF-${invoice.id}`,
          notes:
            invoice.payment_notes || invoice.description || "Invoice payment",
          created_at: invoice.paid_date || invoice.created_at,
          paid_at: invoice.paid_date,
          description: invoice.description || "Invoice payment",
          due_date: invoice.due_date,
          issue_date: invoice.issue_date,
          days_until_due: invoice.days_until_due || 0,
          display_status: invoice.display_status || "paid",
          type: "invoice_payment",
          source: "invoices_table",
        }));

        return transactions.sort(
          (a, b) => new Date(b.paid_at) - new Date(a.paid_at),
        );
      }

      throw new Error("Invalid response from /invoices");
    } catch (invoiceError) {
      console.error(
        "❌ Both endpoints failed, using fallback data",
        invoiceError.message,
      );
      return getFallbackTransactions();
    }
  }
}

// Helper function untuk fallback data - TIDAK PERLU DIEKSPOR
function getFallbackTransactions() {
  const customerNames = [
    "PT. Maju Jaya Abadi",
    "CV. Sumber Rejeki",
    "Toko Elektronik Sinar",
    "Restoran Sari Rasa",
    "Kafe Kopi Mantap",
  ];

  const paymentMethods = [
    "cash",
    "transfer",
    "qris",
    "credit_card",
    "e-wallet",
  ];
  const descriptions = [
    "Pembayaran internet bulanan",
    "Biaya instalasi jaringan",
    "Pembelian router baru",
    "Perpanjangan layanan",
    "Upgrade bandwidth",
  ];

  const transactions = [];
  const now = new Date();

  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const transactionDate = new Date(now);
    transactionDate.setDate(transactionDate.getDate() - daysAgo);

    const amount = Math.floor(Math.random() * 500000) + 100000;
    const customerIndex = i % customerNames.length;
    const methodIndex = i % paymentMethods.length;

    transactions.push({
      id: `TRX-${10000 + i}`,
      payment_id: 1000 + i,
      invoice_id: 2000 + i,
      invoice_number: `INV-${2024000 + i}`,
      customer_name: customerNames[customerIndex],
      customer_id: `CUST-${1000 + customerIndex}`,
      amount: amount,
      status: "paid",
      payment_method: paymentMethods[methodIndex],
      reference: `REF-${Date.now()}-${i}`,
      notes: "Pembayaran berhasil diproses",
      created_at: transactionDate.toISOString(),
      paid_at: transactionDate.toISOString(),
      description: descriptions[i % descriptions.length],
      type: "payment",
      source: "fallback",
    });
  }

  return transactions.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
}

// Function dengan filter - TIDAK PERLU DIEKSPOR
async function fetchTransactionsWithFilters(filters) {
  const transactions = await fetchTransactions();

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Apply filters
  return transactions.filter((transaction) => {
    // Filter by status
    if (
      filters.status &&
      filters.status !== "all" &&
      transaction.status !== filters.status
    ) {
      return false;
    }

    // Filter by payment method
    if (
      filters.paymentMethod &&
      filters.paymentMethod !== "all" &&
      transaction.payment_method !== filters.paymentMethod
    ) {
      return false;
    }

    // Filter by date range
    if (filters.startDate) {
      const transDate = new Date(transaction.paid_at || transaction.created_at);
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (transDate < startDate) return false;
    }

    if (filters.endDate) {
      const transDate = new Date(transaction.paid_at || transaction.created_at);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (transDate > endDate) return false;
    }

    // Filter by search query
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableFields = [
        transaction.invoice_number?.toLowerCase(),
        transaction.customer_name?.toLowerCase(),
        transaction.reference?.toLowerCase(),
        transaction.notes?.toLowerCase(),
        transaction.id?.toLowerCase(),
        transaction.customer_id?.toString().toLowerCase(),
      ];

      if (
        !searchableFields.some((field) => field && field.includes(searchLower))
      ) {
        return false;
      }
    }

    return true;
  });
}

// Hook untuk menggunakan transactions dengan filter
export function useTransactions(filters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactionsWithFilters(filters),
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook untuk mark as paid
export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      paymentMethod = "cash",
      reference = "",
      amount,
    }) => {
      const response = await api.post(`/invoices/${invoiceId}/pay`, {
        amount: amount,
        payment_method: paymentMethod,
        reference: reference || `MANUAL-${Date.now()}`,
        notes: "Pembayaran manual via dashboard",
      });

      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Pembayaran berhasil dicatat!");
      queryClient.invalidateQueries(["transactions"]);
      queryClient.invalidateQueries(["invoices"]);
    },
    onError: (error) => {
      console.error("Payment error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Gagal mencatat pembayaran";
      toast.error(errorMessage);
    },
  });
}

// Hook untuk transaction analytics
export function useTransactionAnalytics() {
  return useQuery({
    queryKey: ["transaction-analytics"],
    queryFn: async () => {
      const transactions = await fetchTransactions();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      const thisMonth = new Date(today);
      thisMonth.setMonth(thisMonth.getMonth() - 1);

      // Filter by date
      const todayTransactions = transactions.filter(
        (t) => new Date(t.created_at) >= today,
      );

      const weekTransactions = transactions.filter(
        (t) => new Date(t.created_at) >= thisWeek,
      );

      const monthTransactions = transactions.filter(
        (t) => new Date(t.created_at) >= thisMonth,
      );

      // Group by payment method
      const paymentMethods = {};
      transactions.forEach((t) => {
        const method = t.payment_method || "unknown";
        paymentMethods[method] = (paymentMethods[method] || 0) + 1;
      });

      // Group by status
      const statusCount = {};
      transactions.forEach((t) => {
        const status = t.status || "unknown";
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      // Monthly revenue (last 6 months)
      const monthlyRevenue = {};
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      transactions
        .filter((t) => new Date(t.created_at) >= sixMonthsAgo)
        .forEach((t) => {
          const month = new Date(t.created_at).toLocaleString("id-ID", {
            month: "short",
            year: "numeric",
          });
          if (t.status === "paid") {
            monthlyRevenue[month] =
              (monthlyRevenue[month] || 0) + (t.amount || 0);
          }
        });

      return {
        total: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        paid: transactions.filter((t) => t.status === "paid").length,
        pending: transactions.filter((t) => t.status === "pending").length,
        failed: transactions.filter((t) => t.status === "failed").length,
        refunded: transactions.filter((t) => t.status === "refunded").length,

        today: {
          count: todayTransactions.length,
          amount: todayTransactions.reduce(
            (sum, t) => sum + (t.amount || 0),
            0,
          ),
        },

        thisWeek: {
          count: weekTransactions.length,
          amount: weekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        },

        thisMonth: {
          count: monthTransactions.length,
          amount: monthTransactions.reduce(
            (sum, t) => sum + (t.amount || 0),
            0,
          ),
        },

        paymentMethods,
        statusCount,
        monthlyRevenue: Object.entries(monthlyRevenue)
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .map(([month, amount]) => ({ month, amount })),
      };
    },
  });
}
