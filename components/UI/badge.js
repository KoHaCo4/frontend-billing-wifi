export function Badge({ children, variant = "default" }) {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-green-100 text-green-800";
      case "destructive":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVariantClasses()}`}
    >
      {children}
    </span>
  );
}
