"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export default function Notification({ message, level = "info", onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (level) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${getBgColor()} shadow-lg max-w-sm`}
    >
      <div className="flex items-start">
        {getIcon()}
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="ml-4 inline-flex text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
