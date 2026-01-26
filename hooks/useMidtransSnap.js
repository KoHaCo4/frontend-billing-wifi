import { useState, useEffect, useCallback } from "react";

const useMidtransSnap = () => {
  const [snap, setSnap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Snap.js script
  useEffect(() => {
    const loadSnapScript = async () => {
      try {
        // Get config from backend
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/config/snap`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          },
        );

        const config = await response.json();

        if (!config.success) {
          throw new Error("Failed to get Snap configuration");
        }

        // Check if script already loaded
        if (window.snap) {
          setSnap(window.snap);
          setIsLoading(false);
          return;
        }

        // Load script
        const script = document.createElement("script");
        script.src = config.data.isProduction
          ? "https://app.midtrans.com/snap/snap.js"
          : "https://app.sandbox.midtrans.com/snap/snap.js";
        script.setAttribute("data-client-key", config.data.clientKey);
        script.async = true;

        script.onload = () => {
          if (window.snap) {
            setSnap(window.snap);
            setIsLoading(false);
          } else {
            setError(new Error("Snap.js failed to load"));
            setIsLoading(false);
          }
        };

        script.onerror = () => {
          setError(new Error("Failed to load Snap.js script"));
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        setError(err);
        setIsLoading(false);
      }
    };

    loadSnapScript();
  }, []);

  // Create payment
  const createPayment = useCallback(async (invoiceId, options = {}) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/snap/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({ invoice_id: invoiceId }),
        },
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to create payment");
      }

      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  // Open Snap popup
  const openSnapPopup = useCallback(
    (snapToken, callbacks = {}) => {
      if (!snap) {
        throw new Error("Snap.js is not loaded");
      }

      const defaultCallbacks = {
        onSuccess: (result) => {
          console.log("Payment success:", result);
          if (callbacks.onSuccess) callbacks.onSuccess(result);
        },
        onPending: (result) => {
          console.log("Payment pending:", result);
          if (callbacks.onPending) callbacks.onPending(result);
        },
        onError: (result) => {
          console.log("Payment error:", result);
          if (callbacks.onError) callbacks.onError(result);
        },
        onClose: () => {
          console.log("Popup closed");
          if (callbacks.onClose) callbacks.onClose();
        },
      };

      snap.pay(snapToken, defaultCallbacks);
    },
    [snap],
  );

  // Check payment status
  const checkPaymentStatus = useCallback(async (orderId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/status/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        },
      );

      return await response.json();
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    snap,
    isLoading,
    error,
    createPayment,
    openSnapPopup,
    checkPaymentStatus,
  };
};

export default useMidtransSnap;
