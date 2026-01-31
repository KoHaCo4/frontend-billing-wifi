"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import LoadingOverlay from "@/components/Layout/LoadingOverlay";
import { toast } from "react-hot-toast";

export default function PublicPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = params.id;
  const snapRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [snapToken, setSnapToken] = useState(null);
  const [autoPay, setAutoPay] = useState(false);

  useEffect(() => {
    const auto = searchParams.get("auto");
    if (auto === "1" || auto === "true") {
      setAutoPay(true);
    }

    fetchPaymentData();

    // Load Midtrans Snap script dengan environment yang benar
    const midtransEnv = process.env.NEXT_PUBLIC_MIDTRANS_ENV || "sandbox";
    const scriptUrl =
      midtransEnv === "production"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

    console.log("🔧 Loading Midtrans script from:", scriptUrl);
    console.log("🔧 Environment:", midtransEnv);

    if (typeof window !== "undefined" && !window.snap) {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
      );
      script.async = true;
      script.onload = () => {
        console.log("✅ Midtrans Snap script loaded");
        snapRef.current = window.snap;
      };
      script.onerror = (error) => {
        console.error("❌ Failed to load Midtrans script:", error);
      };
      document.head.appendChild(script);
    } else if (window.snap) {
      snapRef.current = window.snap;
    }
  }, [paymentId]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching payment data for:", paymentId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment-links/page/${paymentId}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      console.log("📦 API Response:", result);

      if (!result.success) {
        throw new Error(result.message || "Invalid payment link");
      }

      setPaymentData(result.data);

      // Auto process payment jika parameter auto=true
      if (autoPay && !result.data.is_expired) {
        console.log("🚀 Auto-pay enabled, will process payment...");
        // Delay sedikit untuk memastikan script Midtrans sudah loaded
        setTimeout(() => {
          processPayment();
        }, 1500);
      }
    } catch (err) {
      console.error("❌ Error fetching payment data:", err);
      setError(err.message || "Gagal memuat data pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    try {
      if (!paymentData) {
        throw new Error("Data pembayaran tidak tersedia");
      }

      if (paymentData.is_expired) {
        throw new Error("Payment link telah kadaluarsa");
      }

      console.log("🔄 Processing payment for:", paymentData.payment_code);
      setProcessing(true);

      // Create Snap transaction
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment-links/snap/${paymentData.payment_code}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal membuat transaksi");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal membuat transaksi pembayaran");
      }

      console.log("✅ Snap token received:", result.data.snapToken);
      setSnapToken(result.data.snapToken);

      // Open Snap popup
      if (snapRef.current) {
        console.log("🎯 Opening Midtrans popup...");
        snapRef.current.pay(result.data.snapToken, {
          onSuccess: function (snapResult) {
            console.log("✅ Payment success:", snapResult);
            toast.success("Pembayaran berhasil!");
            router.push(`/payment/success?order_id=${snapResult.order_id}`);
          },
          onPending: function (snapResult) {
            console.log("⏳ Payment pending:", snapResult);
            toast.success("Pembayaran pending. Menunggu konfirmasi.");
            router.push(`/payment/pending?order_id=${snapResult.order_id}`);
          },
          onError: function (snapResult) {
            console.log("❌ Payment error:", snapResult);
            toast.error("Pembayaran gagal. Silakan coba lagi.");
            router.push(`/payment/error?order_id=${snapResult.order_id}`);
          },
          onClose: function () {
            console.log("🔒 Payment popup closed");
            setProcessing(false);
            toast.info("Popup pembayaran ditutup");
          },
        });
      } else {
        console.error("❌ Snap not initialized");
        throw new Error("Payment gateway tidak tersedia");
      }
    } catch (err) {
      console.error("❌ Payment processing error:", err);
      toast.error(err.message || "Terjadi kesalahan saat memproses pembayaran");
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return <LoadingOverlay message="Memuat data pembayaran..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Terjadi Kesalahan
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              VnsNetwork
            </h1>
            <p className="text-gray-600">Connect Your Future</p>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            {/* Status Banner */}
            {paymentData?.is_expired && (
              <div className="bg-red-500 text-white p-4 text-center">
                <p className="font-semibold">
                  ⚠️ Payment Link Telah Kadaluarsa
                </p>
              </div>
            )}

            {/* Invoice Info */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">No. Tagihan</span>
                  <span className="font-bold text-blue-600">
                    {paymentData?.invoice.invoice_number}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pelanggan</span>
                    <span className="font-semibold">
                      {paymentData?.customer.name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">No. Telepon</span>
                    <span className="font-semibold">
                      {paymentData?.customer.phone}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Paket</span>
                    <span className="font-semibold">
                      {paymentData?.invoice.package_name || "Internet WiFi"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Jatuh Tempo</span>
                    <span className="font-semibold">
                      {formatDate(paymentData?.invoice.due_date)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Berlaku hingga</span>
                    <span className="font-semibold">
                      {formatDate(paymentData?.invoice.expires_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-center py-6 border-t border-b border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Total Tagihan</div>
                <div className="text-4xl font-bold text-gray-800">
                  {formatCurrency(paymentData?.invoice.amount)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {paymentData?.invoice.description}
                </div>
              </div>

              {/* Pay Button */}
              <div className="mt-6">
                <button
                  onClick={processPayment}
                  disabled={processing || paymentData?.is_expired}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    processing || paymentData?.is_expired
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  } text-white shadow-lg hover:shadow-xl`}
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Memproses Pembayaran...
                    </div>
                  ) : paymentData?.is_expired ? (
                    "LINK KADALUARSA"
                  ) : (
                    "BAYAR SEKARANG"
                  )}
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-gray-50 p-6 border-t border-gray-200">
              <p className="text-center text-gray-600 text-sm mb-4">
                Metode Pembayaran Tersedia:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  "Bank Transfer",
                  "E-Wallet",
                  "QRIS",
                  "Minimarket",
                  "Credit Card",
                ].map((method, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm"
                  >
                    <span>{["🏦", "📱", "🔗", "🏪", "💳"][idx]}</span>
                    <span className="text-sm text-gray-700">{method}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-900 text-white p-6">
              <div className="text-center">
                <p className="font-bold mb-2">
                  VnsNetwork By PT. MEGA DATA PERKASA
                </p>
                <p className="text-sm text-gray-300 mb-4">
                  Jl. Masjid Kedung panjang 4/5, 59154
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    📞 Customer Service:{" "}
                    <a
                      href="https://wa.me/628895461944"
                      className="text-green-400 hover:underline"
                    >
                      0889-5461-944
                    </a>
                  </p>
                  <p>
                    🔧 Technical Support:{" "}
                    <a
                      href="https://wa.me/6285724733627"
                      className="text-green-400 hover:underline"
                    >
                      0857-2473-3627
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-pay Notice */}
          {autoPay && !paymentData?.is_expired && !processing && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center animate-pulse">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <p className="text-blue-600 font-medium">
                  Membuka pembayaran otomatis...
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-white rounded-xl p-4 text-sm text-gray-600 mb-6">
            <p className="font-semibold mb-2">📝 Informasi Penting:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Pembayaran akan diproses secara otomatis oleh Midtrans</li>
              <li>
                Link pembayaran berlaku hingga{" "}
                {formatDate(paymentData?.invoice.expires_at)}
              </li>
              <li>
                Status akan otomatis terupdate setelah pembayaran berhasil
              </li>
              <li>Hubungi customer service jika mengalami kendala</li>
            </ul>
          </div>

          {/* Debug Info (Development only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-100 rounded-xl p-4 text-xs font-mono">
              <p className="font-bold mb-2">🔧 Debug Info:</p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(paymentData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Toast Container */}
      <div id="toast-container"></div>
    </>
  );
}
