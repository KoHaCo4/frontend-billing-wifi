"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchPaymentDetails();
      // Poll for status updates
      const interval = setInterval(fetchPaymentDetails, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/status/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const result = await response.json();
      if (result.success) {
        setPayment(result.data);
        // If payment is completed, redirect to success page
        if (
          result.data.status === "completed" ||
          result.data.status === "paid"
        ) {
          window.location.href = `/payment/success?order_id=${orderId}`;
        }
      }
    } catch (error) {
      console.error("Error fetching payment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Pending
        </h1>
        <p className="text-gray-600 mb-4">
          Your payment is being processed. Please complete the payment or wait
          for confirmation.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          This page will automatically update when the payment is completed.
        </p>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ) : (
          payment && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-gray-700 mb-4">
                Payment Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{payment.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    Rp {payment.amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {payment.status}
                  </span>
                </div>
              </div>
            </div>
          )
        )}

        <div className="space-y-3">
          <button
            onClick={fetchPaymentDetails}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
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
            Check Status Again
          </button>
          <Link
            href="/dashboard/billing/invoices"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition duration-200"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    </div>
  );
}
