// components/UI/Notifications.js
"use client";

import { Bell, AlertCircle, Clock, DollarSign } from "lucide-react";

export default function Notifications({
  expiringSoon = [],
  overdueInvoices = [],
  pendingInvoices = [],
  loading = false,
}) {
  const totalNotifications =
    expiringSoon.length + overdueInvoices.length + pendingInvoices.length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        </div>
        {totalNotifications > 0 && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {totalNotifications} new
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Overdue Invoices */}
        {overdueInvoices.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800">Tunggakan Kritis</h4>
                <p className="text-sm text-red-600 mt-1">
                  {overdueInvoices.length} invoice telah melewati jatuh tempo
                </p>
                <div className="mt-2 space-y-2">
                  {overdueInvoices.slice(0, 3).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="text-sm bg-white/50 p-2 rounded"
                    >
                      <span className="font-medium">
                        {invoice.customer_name}
                      </span>{" "}
                      -{" "}
                      <span className="text-red-700">
                        Rp {invoice.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Invoices */}
        {pendingInvoices.length > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800">
                  Menunggu Pembayaran
                </h4>
                <p className="text-sm text-orange-600 mt-1">
                  {pendingInvoices.length} invoice belum dibayar
                </p>
                <div className="mt-2 space-y-2">
                  {pendingInvoices.slice(0, 3).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="text-sm bg-white/50 p-2 rounded"
                    >
                      <span className="font-medium">
                        {invoice.customer_name}
                      </span>{" "}
                      -{" "}
                      <span className="text-orange-700">
                        Rp {invoice.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expiring Soon */}
        {expiringSoon.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800">Akan Kadaluarsa</h4>
                <p className="text-sm text-yellow-600 mt-1">
                  {expiringSoon.length} pelanggan akan kadaluarsa dalam 7 hari
                </p>
                <div className="mt-2 space-y-2">
                  {expiringSoon.slice(0, 3).map((customer) => (
                    <div
                      key={customer.id}
                      className="text-sm bg-white/50 p-2 rounded"
                    >
                      <span className="font-medium">{customer.name}</span> -{" "}
                      <span className="text-yellow-700">
                        {new Date(customer.expired_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {totalNotifications === 0 && (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada notifikasi baru</p>
            <p className="text-sm text-gray-400 mt-1">
              Semua dalam kondisi baik
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
