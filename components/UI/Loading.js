// components/UI/Loading.js
"use client";

import { useEffect, useState } from "react";
import "./Loading.css"; // File CSS khusus untuk komponen ini

export default function Loading({
  type = "spinner",
  size = "md",
  text = "Loading...",
  fullPage = false,
  progress = 0,
  showProgress = false,
  className = "",
}) {
  const [loadingText, setLoadingText] = useState(text);
  const [dots, setDots] = useState("");

  // Animasi teks loading dengan dots
  useEffect(() => {
    if (type === "dots" || type === "text") {
      const interval = setInterval(() => {
        setDots((prev) => {
          if (prev.length >= 3) return "";
          return prev + ".";
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [type]);

  // Untuk progress loading
  useEffect(() => {
    if (showProgress && progress < 100) {
      const timer = setTimeout(() => {
        // Simulate progress
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress, showProgress]);

  const renderLoader = () => {
    switch (type) {
      case "spinner":
        return (
          <div
            className={`loading-spinner loading-spinner-${size} ${className}`}
          >
            <div className="animate-spin"></div>
          </div>
        );

      case "dots":
        return (
          <div className={`loading-dots ${className}`}>
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
        );

      case "wifi":
        return (
          <div className={`wifi-loader ${className}`}>
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
        );

      case "progress":
        return (
          <div className={`loading-progress ${className}`}>
            <div className="loading-progress-bar">
              <div
                className="loading-progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {showProgress && (
              <div className="text-sm text-gray-600 mt-2">{progress}%</div>
            )}
          </div>
        );

      case "skeleton":
        return (
          <div
            className={`skeleton ${className}`}
            style={{ width: "100%", height: "100%" }}
          ></div>
        );

      default:
        return (
          <div
            className={`loading-spinner loading-spinner-${size} ${className}`}
          >
            <div className="animate-spin"></div>
          </div>
        );
    }
  };

  const content = (
    <div className="flex-col-center space-y-4">
      {renderLoader()}
      {text && (
        <div className="text-center">
          <p className="text-gray-700 font-medium">
            {text}
            {dots}
          </p>
          {type === "text" && (
            <p className="text-sm text-gray-500 mt-1">Please wait...</p>
          )}
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="loading-overlay animate-fade-in">
        <div className="loading-content animate-scale-in">
          {content}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 italic">
              "Billing WiFi System"
            </p>
          </div>
        </div>
      </div>
    );
  }

  return content;
}

// Variasi loading lainnya
export function LoadingSpinner(props) {
  return <Loading type="spinner" {...props} />;
}

export function LoadingDots(props) {
  return <Loading type="dots" {...props} />;
}

export function LoadingWifi(props) {
  return <Loading type="wifi" {...props} />;
}

export function LoadingProgress(props) {
  return <Loading type="progress" {...props} />;
}

export function LoadingSkeleton(props) {
  return <Loading type="skeleton" {...props} />;
}

export function PageLoading() {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <LoadingWifi size="lg" />
        <h3 className="text-xl font-semibold text-gray-800 mt-4 animate-pulse">
          Loading Billing WiFi
        </h3>
        <div className="mt-6">
          <LoadingProgress showProgress={true} progress={0} />
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Preparing your dashboard...
        </p>
      </div>
    </div>
  );
}
