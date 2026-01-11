"use client";

import { useEffect } from "react";
import { Providers } from "./providers";
import "./globals.css";

export default function RootLayout({ children }) {
  useEffect(() => {
    console.log("🌐 App Mounted");
    console.log("📋 localStorage contents:");
    console.log(
      "- access_token:",
      localStorage.getItem("access_token") ? "✅ Present" : "❌ Missing"
    );
    console.log(
      "- refresh_token:",
      localStorage.getItem("refresh_token") ? "✅ Present" : "❌ Missing"
    );
    console.log("- admin:", localStorage.getItem("admin"));
  }, []);

  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
