"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentError() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Pembayaran Gagal
          </h1>

          <p className="text-gray-600 mb-6">
            Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi atau
            gunakan metode pembayaran lain.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Order:</span>
                  <span className="font-mono font-semibold">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-red-600">Gagal</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href={`https://wa.me/628895461944?text=Halo,%20saya%20mengalami%20kendala%20pembayaran%20dengan%20Order%20ID:%20${orderId || ""}`}
              target="_blank"
              className="block w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
            >
              Minta Bantuan Customer Service
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Coba Lagi
            </button>

            <Link
              href="/"
              className="block w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Kembali ke Beranda
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Jika masalah berlanjut, silakan hubungi:
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                📞 Customer Service:{" "}
                <a href="tel:628895461944" className="text-blue-600">
                  0889-5461-944
                </a>
              </p>
              <p>
                🔧 Support:{" "}
                <a href="tel:6285724733627" className="text-blue-600">
                  0857-2473-3627
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
