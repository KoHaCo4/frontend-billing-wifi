// components/Layout/LoadingOverlay.js
"use client";

import { useState, useEffect } from "react";
import Loading, { PageLoading } from "@/components/UI/Loading";

export default function LoadingOverlay({
  isLoading = false,
  message = "Loading...",
  type = "wifi",
}) {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setShow(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="loading-overlay animate-fade-in">
      <div className="loading-content animate-scale-in">
        <Loading
          type={type}
          size="lg"
          text={message}
          progress={progress}
          showProgress={true}
        />
      </div>
    </div>
  );
}
