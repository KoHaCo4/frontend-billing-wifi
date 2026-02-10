"use client";

// Pastikan file ini mengekspor named exports yang benar
export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`border-b border-gray-200 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

// Export default juga (untuk kompatibilitas)
const CardComponents = {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
};

export default CardComponents;
