import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  console.log("🔍 Middleware checking:", pathname);

  // Public routes yang TIDAK perlu autentikasi
  const publicPaths = [
    "/auth/login",
    "/auth",
    "/payment",
    "/pay",
    "/payment/success",
    "/payment/error",
    "/payment/pending",
    "/_next",
    "/public",
    "/favicon.ico",
    "/api/auth",
    "/",
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some((path) => {
    if (path === "/payment" || path === "/pay" || path === "/auth") {
      return pathname.startsWith(path);
    }
    return pathname === path;
  });

  // Jika route public, izinkan akses TANPA cek token
  if (isPublicPath) {
    console.log("✅ Public route allowed:", pathname);
    return NextResponse.next();
  }

  // Untuk route protected (dashboard, dll), middleware HANYA redirect jika DASHBOARD
  // Untuk route lain, biarkan client-side AuthContext yang handle
  if (pathname.startsWith("/dashboard")) {
    console.log("📊 Dashboard route detected in middleware");

    // Coba cek cookies dulu (jika ada)
    const tokenFromCookies =
      request.cookies.get("access_token")?.value ||
      request.cookies.get("accessToken")?.value ||
      request.cookies.get("token")?.value;

    if (!tokenFromCookies) {
      console.log(
        "⚠️  No token in cookies, allowing access (will be handled by AuthContext)",
      );
      // JANGAN redirect, biarkan AuthContext di client yang handle
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match semua route kecuali:
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
