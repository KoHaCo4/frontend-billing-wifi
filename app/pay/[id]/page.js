"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function PayRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = params.id;

  useEffect(() => {
    // Redirect ke halaman payment yang benar
    const auto = searchParams.get("auto") === "1" ? "?auto=1" : "";
    router.replace(`/payment/${paymentId}${auto}`);
  }, [paymentId, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Mengarahkan ke halaman pembayaran...</p>
      </div>
    </div>
  );
}
