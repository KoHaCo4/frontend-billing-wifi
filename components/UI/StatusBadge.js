"use client";

export default function StatusBadge({ status }) {
  const variants = {
    active: "bg-green-100 text-green-800 border-green-200",
    expired: "bg-red-100 text-red-800 border-red-200",
    suspended: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending: "bg-blue-100 text-blue-800 border-blue-200",
    paid: "bg-green-100 text-green-800 border-green-200",
    overdue: "bg-red-100 text-red-800 border-red-200",
  };
  const statusConfig = {
    // ... existing customer statuses
    active: { color: "bg-green-100 text-green-800", label: "Active" },
    inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
    // ... lainnya
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full border ${
        statusConfig[status]?.color || "bg-gray-100 text-gray-800"
      }`}
    >
      {statusConfig[status]?.label || status}
    </span>
  );
}
