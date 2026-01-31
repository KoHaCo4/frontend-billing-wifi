import { useEffect, useState } from "react";

export const useMidtransSnap = () => {
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    // Load Snap script dynamically
    if (typeof window !== "undefined" && !window.snap) {
      const script = document.createElement("script");
      script.src = "https://app.midtrans.com/snap/snap.js";
      script.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
      );
      script.async = true;

      script.onload = () => {
        console.log("Midtrans Snap script loaded");
        setSnap(window.snap);
      };

      script.onerror = () => {
        console.error("Failed to load Midtrans Snap script");
      };

      document.body.appendChild(script);
    } else if (window.snap) {
      setSnap(window.snap);
    }

    return () => {
      // Cleanup jika perlu
    };
  }, []);

  const initSnap = () => {
    if (window.snap) {
      setSnap(window.snap);
      return window.snap;
    }
    return null;
  };

  const createSnapTransaction = async (token, options = {}) => {
    if (!snap) {
      console.error("Snap not initialized");
      return null;
    }

    return new Promise((resolve, reject) => {
      snap.pay(token, {
        ...options,
        onSuccess: (result) => {
          console.log("Payment success:", result);
          if (options.onSuccess) options.onSuccess(result);
          resolve({ success: true, data: result });
        },
        onPending: (result) => {
          console.log("Payment pending:", result);
          if (options.onPending) options.onPending(result);
          resolve({ success: true, data: result });
        },
        onError: (result) => {
          console.log("Payment error:", result);
          if (options.onError) options.onError(result);
          reject(new Error("Payment failed"));
        },
        onClose: () => {
          console.log("Payment popup closed");
          if (options.onClose) options.onClose();
          resolve({ success: false, message: "Popup closed by user" });
        },
      });
    });
  };

  return {
    snap,
    initSnap,
    createSnapTransaction,
  };
};
