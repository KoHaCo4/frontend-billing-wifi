"use client";

import { useEffect, useState } from "react";
import Providers from "./providers";
import "./globals.css";

export default function RootLayout({ children }) {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Initializing application...",
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("🌐 App Mounted");

    // Skip loading untuk payment routes
    const currentPath = window.location.pathname;
    const skipLoadingPaths = ["/dashboard", "/auth/login", "/payment", "/pay"];

    const shouldSkipLoading = skipLoadingPaths.some((path) =>
      currentPath.startsWith(path),
    );

    if (shouldSkipLoading) {
      console.log("🚀 Skipping app loading for:", currentPath);
      setIsAppLoading(false);
      return;
    }

    // Simulate app loading sequence
    const loadingSequence = [
      { message: "Loading dependencies...", delay: 800 },
      { message: "Checking authentication...", delay: 1000 },
      { message: "Initializing services...", delay: 600 },
      { message: "Preparing interface...", delay: 400 },
    ];

    let currentStep = 0;

    const loadNextStep = () => {
      if (currentStep < loadingSequence.length) {
        setLoadingMessage(loadingSequence[currentStep].message);
        setTimeout(() => {
          currentStep++;
          loadNextStep();
        }, loadingSequence[currentStep]?.delay || 500);
      } else {
        setTimeout(() => {
          setIsAppLoading(false);
          console.log("✅ App loaded successfully");
        }, 300);
      }
    };

    loadNextStep();
  }, []);

  // Jika belum mounted, render minimal
  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
          <div style={{ display: "none" }}>Loading...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {isAppLoading ? (
            <div className="loading-overlay animate-fade-in">
              <div className="loading-content">
                <div className="wifi-loader">
                  <div className="wifi-circle wifi-circle-1"></div>
                  <div className="wifi-circle wifi-circle-2"></div>
                  <div className="wifi-circle wifi-circle-3"></div>
                  <div className="wifi-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 21C13.1 21 14 20.1 14 19C14 17.9 13.1 17 12 17C10.9 17 10 17.9 10 19C10 20.1 10.9 21 12 21ZM18 19C18 16.79 16.21 15 14 15H10C7.79 15 6 16.79 6 19H18ZM12 3C7.03 3 3 7.03 3 12H5C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12H21C21 7.03 16.97 3 12 3Z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mt-4 animate-pulse">
                  {loadingMessage}
                </h3>

                <div className="mt-6">
                  <div className="loading-progress-bar">
                    <div className="loading-progress-fill animate-progress"></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Please wait while we set up your dashboard
                  </p>
                </div>

                <div className="flex-center mt-6">
                  <div className="loading-dots">
                    <div
                      className="loading-dot animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="loading-dot animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="loading-dot animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 italic">
                    "Billing WiFi Management System"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="page-transition">{children}</div>
          )}
        </Providers>
      </body>
    </html>
  );
}
