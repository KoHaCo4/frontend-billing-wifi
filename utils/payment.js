/**
 * Payment utility functions
 */

// Format currency for display
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Get payment status badge
export const getPaymentStatus = (status) => {
  const statusMap = {
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
      icon: "⏳",
    },
    completed: {
      label: "Completed",
      color: "bg-green-100 text-green-800",
      icon: "✅",
    },
    paid: {
      label: "Paid",
      color: "bg-green-100 text-green-800",
      icon: "✅",
    },
    failed: {
      label: "Failed",
      color: "bg-red-100 text-red-800",
      icon: "❌",
    },
    expired: {
      label: "Expired",
      color: "bg-gray-100 text-gray-800",
      icon: "⏰",
    },
  };

  return (
    statusMap[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
      icon: "❓",
    }
  );
};

// Get payment method info
export const getPaymentMethodInfo = (method) => {
  const methods = {
    midtrans: {
      name: "Online Payment",
      icon: "💳",
      description: "Bayar via berbagai metode online",
    },
    cash: {
      name: "Tunai",
      icon: "💰",
      description: "Bayar langsung di loket",
    },
    transfer: {
      name: "Transfer Bank",
      icon: "🏦",
      description: "Transfer ke rekening bank",
    },
    qris: {
      name: "QRIS",
      icon: "📱",
      description: "Scan QR code untuk pembayaran",
    },
    gopay: {
      name: "GoPay",
      icon: "🟢",
      description: "Bayar via GoPay",
    },
    shopeepay: {
      name: "ShopeePay",
      icon: "🛍️",
      description: "Bayar via ShopeePay",
    },
    credit_card: {
      name: "Kartu Kredit",
      icon: "💳",
      description: "Bayar dengan kartu kredit",
    },
  };

  return (
    methods[method] || {
      name: method,
      icon: "💸",
      description: "Pembayaran",
    }
  );
};

// Create payment transaction
export const createPaymentTransaction = async (invoiceId) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/payments/snap/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    },
  );

  return await response.json();
};

// Check payment status
export const checkPaymentStatus = async (orderId) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/payments/status/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );

  return await response.json();
};

// Get payment methods
export const getPaymentMethods = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/payments/methods/all`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );

  return await response.json();
};
