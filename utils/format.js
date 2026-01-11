import { format, formatDistance, formatRelative, subDays } from "date-fns";
import { id } from "date-fns/locale";

// Format currency
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (date, formatStr = "dd MMM yyyy") => {
  if (!date) return "-";
  try {
    return format(new Date(date), formatStr, { locale: id });
  } catch (error) {
    return "-";
  }
};

// Format date time
export const formatDateTime = (date) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: id });
};

// Format relative time (e.g., "2 days ago")
export const formatRelativeTime = (date) => {
  if (!date) return "-";
  return formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    locale: id,
  });
};

// Format percentage
export const formatPercentage = (value, total) => {
  if (!total || total === 0) return "0%";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

// Format number with thousands separator
export const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return "-";
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, "");
  // Format: 0812-3456-7890
  if (cleaned.length === 12) {
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  // Format: 081-2345-6789
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  // Format: 0812-345-678
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
  }
  return phone;
};

// Truncate text
export const truncateText = (text, length = 50) => {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

// Get status color - KEEP OLD VERSION FOR COMPATIBILITY
export const getStatusColor = (status) => {
  // WARNA LAMA untuk kompatibilitas dengan kode yang sudah ada
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "expired":
    case "overdue":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "suspended":
      return "bg-gray-100 text-gray-800"; // Tetap abu-abu untuk kompatibilitas
    case "paid":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Format bytes to human readable
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// FUNGSI LEGACY untuk backward compatibility (jika diperlukan)
// Tapi jangan diekspor dengan nama yang sama
// Gunakan nama berbeda atau jangan diekspor jika tidak diperlukan

// Jika Anda ingin tetap punya fungsi lama dengan nama yang sama,
// Anda harus memilih salah satu versi
