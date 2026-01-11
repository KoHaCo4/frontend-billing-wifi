"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function TestEndpoints() {
  const [results, setResults] = useState({});

  useEffect(() => {
    const testEndpoints = async () => {
      const endpoints = [
        { name: "Customers", url: "/customers" },
        { name: "Invoices", url: "/invoices" },
        { name: "Packages", url: "/packages" },
        { name: "Routers", url: "/routers" },
        { name: "Auth Me", url: "/auth/me" },
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🧪 Testing ${endpoint.name}...`);
          const response = await api.get(endpoint.url);
          setResults((prev) => ({
            ...prev,
            [endpoint.name]: {
              status: "✅ Success",
              data: response.data,
              structure: Object.keys(response.data),
            },
          }));
        } catch (error) {
          setResults((prev) => ({
            ...prev,
            [endpoint.name]: {
              status: "❌ Error",
              error: error.message,
              response: error.response?.data,
            },
          }));
        }
      }
    };

    testEndpoints();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API Endpoints Test</h1>
      <div className="space-y-4">
        {Object.entries(results).map(([name, result]) => (
          <div key={name} className="p-4 border rounded-lg">
            <h3 className="font-bold text-lg">{name}</h3>
            <p
              className={
                result.status.includes("✅") ? "text-green-600" : "text-red-600"
              }
            >
              {result.status}
            </p>
            {result.data && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Structure: {JSON.stringify(result.structure)}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">
                    View Data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            {result.error && (
              <div className="mt-2">
                <p className="text-sm text-red-600">{result.error}</p>
                {result.response && (
                  <pre className="mt-2 p-2 bg-red-50 text-xs">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
