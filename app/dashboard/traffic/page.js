"use client";

import { Suspense } from "react";
import TrafficMonitor from "@/components/TrafficMonitor";
import { Card, CardContent } from "@/components/UI/Card";

export default function TrafficPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Network Traffic Monitor
        </h1>
        <p className="text-gray-600 mt-2">
          Real-time monitoring of network traffic and active PPPoE sessions
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading traffic data...</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <TrafficMonitor />
      </Suspense>
    </div>
  );
}
