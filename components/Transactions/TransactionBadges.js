// components/Transactions/TransactionBadges.js
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  CreditCard,
  DollarSign,
  Smartphone,
  QrCode,
  Banknote,
} from "lucide-react";

// Status Badge untuk transactions
export function TransactionStatusBadge({ status }) {
  const config = {
    paid: {
      color: "bg-green-100 text-green-800 border border-green-200",
      icon: <CheckCircle className="w-3 h-3" />,
      label: "Paid",
    },
    pending: {
      color: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      icon: <Clock className="w-3 h-3" />,
      label: "Pending",
    },
    failed: {
      color: "bg-red-100 text-red-800 border border-red-200",
      icon: <XCircle className="w-3 h-3" />,
      label: "Failed",
    },
    refunded: {
      color: "bg-gray-100 text-gray-800 border border-gray-200",
      icon: <RefreshCw className="w-3 h-3" />,
      label: "Refunded",
    },
  };

  const { color, icon, label } = config[status] || {
    color: "bg-gray-100 text-gray-800 border border-gray-200",
    icon: <Clock className="w-3 h-3" />,
    label: status || "Unknown",
  };

  return (
    <div className="flex items-center">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
      >
        {icon}
        <span className="ml-1">{label}</span>
      </span>
    </div>
  );
}

// Payment Method Badge
export function PaymentMethodBadge({ method }) {
  const config = {
    bank_transfer: {
      color: "bg-blue-100 text-blue-800",
      icon: <Banknote className="w-3 h-3" />,
      label: "Bank Transfer",
    },
    cash: {
      color: "bg-green-100 text-green-800",
      icon: <DollarSign className="w-3 h-3" />,
      label: "Cash",
    },
    credit_card: {
      color: "bg-purple-100 text-purple-800",
      icon: <CreditCard className="w-3 h-3" />,
      label: "Credit Card",
    },
    "e-wallet": {
      color: "bg-yellow-100 text-yellow-800",
      icon: <Smartphone className="w-3 h-3" />,
      label: "E-Wallet",
    },
    qris: {
      color: "bg-indigo-100 text-indigo-800",
      icon: <QrCode className="w-3 h-3" />,
      label: "QRIS",
    },
    transfer: {
      color: "bg-cyan-100 text-cyan-800",
      icon: <Banknote className="w-3 h-3" />,
      label: "Transfer",
    },
  };

  const { color, icon, label } = config[method] || {
    color: "bg-gray-100 text-gray-800",
    icon: <DollarSign className="w-3 h-3" />,
    label: method ? method.replace("_", " ").toUpperCase() : "Unknown",
  };

  return (
    <div className="flex items-center">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${color}`}
      >
        {icon}
        <span className="ml-1">{label}</span>
      </span>
    </div>
  );
}
