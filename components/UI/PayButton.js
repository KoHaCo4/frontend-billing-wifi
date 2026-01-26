"use client";

import { useState } from "react";
import useMidtransSnap from "@/hooks/useMidtransSnap";

const PayButton = ({
  invoiceId,
  amount,
  description,
  onSuccess,
  onError,
  onPending,
  className = "",
  children,
  ...props
}) => {
  const { createPayment, openSnapPopup, isLoading, error } = useMidtransSnap();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Create payment transaction
      const paymentResult = await createPayment(invoiceId);

      // Open Snap popup
      openSnapPopup(paymentResult.data.snapToken, {
        onSuccess: (result) => {
          setIsProcessing(false);
          if (onSuccess) onSuccess(result);
          // Optional: Redirect to success page
          window.location.href = `/payment/success?order_id=${result.order_id}`;
        },
        onPending: (result) => {
          setIsProcessing(false);
          if (onPending) onPending(result);
          window.location.href = `/payment/pending?order_id=${result.order_id}`;
        },
        onError: (result) => {
          setIsProcessing(false);
          if (onError) onError(result);
          window.location.href = `/payment/error?order_id=${result.order_id}`;
        },
        onClose: () => {
          setIsProcessing(false);
          console.log("Payment popup closed");
        },
      });
    } catch (err) {
      console.error("Payment error:", err);
      setIsProcessing(false);
      if (onError) onError(err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || isProcessing}
      className={`${className} ${isLoading || isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      {...props}
    >
      {isProcessing ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      ) : (
        children || `Pay ${amount}`
      )}
    </button>
  );
};

export default PayButton;
