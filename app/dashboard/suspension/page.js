"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  UserX,
  RefreshCw,
  Calendar,
  Wifi,
  WifiOff,
} from "lucide-react";
import Button from "@/components/UI/Button";
import Card from "@/components/UI/Card";

export default function SuspensionDashboard() {
  const [triggerLoading, setTriggerLoading] = useState(false);

  // Fetch suspension stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["suspension-stats"],
    queryFn: async () => {
      const response = await api.get("/suspension/stats");
      return response.data.data;
    },
  });

  // Fetch expiring soon
  const { data: expiring, refetch: refetchExpiring } = useQuery({
    queryKey: ["expiring-soon"],
    queryFn: async () => {
      const response = await api.get("/suspension/expiring-soon?days=3");
      return response.data.data;
    },
  });

  const triggerAutoSuspend = async () => {
    if (
      !confirm(
        "Run auto-suspend job now? This will suspend all expired customers."
      )
    ) {
      return;
    }

    setTriggerLoading(true);
    try {
      const response = await api.post("/suspension/trigger-auto-suspend");
      alert(
        `Auto-suspend triggered: ${response.data.data.suspended} customers suspended`
      );
      refetchStats();
    } catch (error) {
      alert("Failed to trigger auto-suspend");
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Suspension Management
            </h1>
            <p className="text-gray-600">Auto-suspend system and monitoring</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                refetchStats();
                refetchExpiring();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button
              variant="warning"
              onClick={triggerAutoSuspend}
              loading={triggerLoading}
              disabled={triggerLoading}
            >
              <UserX className="w-4 h-4 mr-2" />
              Run Auto-Suspend Now
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Suspended</p>
              <p className="text-3xl font-bold mt-1">
                {stats?.total_suspended || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <WifiOff className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Customers currently suspended
          </p>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Recently Auto-Suspended</p>
              <p className="text-3xl font-bold mt-1 text-orange-600">
                {stats?.recent_auto_suspended || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <UserX className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expired Not Suspended</p>
              <p className="text-3xl font-bold mt-1 text-yellow-600">
                {stats?.expired_not_suspended || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Beyond {stats?.grace_period_days || 3} days grace period
          </p>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Grace Period</p>
              <p className="text-3xl font-bold mt-1">
                {stats?.grace_period_days || 3} days
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Before auto-suspension</p>
        </Card>
      </div>

      {/* Expiring Soon Table */}
      {expiring && expiring.count > 0 && (
        <Card className="mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <h2 className="text-lg font-semibold">
                  Customers Expiring Soon
                </h2>
                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  {expiring.count} customers
                </span>
              </div>
              <span className="text-sm text-gray-500">
                Within next {expiring.threshold_days} days
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Expiration Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Days Left
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Router
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expiring.customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {customer.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {customer.username_pppoe}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">
                        {new Date(customer.expired_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.days_left <= 1
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {customer.days_left}{" "}
                        {customer.days_left === 1 ? "day" : "days"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {customer.router_name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Auto-Suspend Schedule Info */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Auto-Suspend Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Current Schedule
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Daily at 01:00 AM</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>
                    Grace period: {stats?.grace_period_days || 3} days
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span>Expiring check: Daily at 09:00 AM</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                What Auto-Suspend Does
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>Checks for customers with expired subscription</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>
                    Skips customers with pending invoices (grace period)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>Disables PPPoE account on MikroTik router</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>Updates customer status to "suspended"</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1">•</div>
                  <span>Auto-reactivates when invoice is paid</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
