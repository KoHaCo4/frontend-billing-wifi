"use client";

import React from "react";
import {
  UserPlus,
  FileText,
  Calendar,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const QuickActions = () => {
  const router = useRouter();

  const actions = [
    {
      id: 1,
      title: "Tambah Pelanggan",
      description: "Buat akun PPPoE baru",
      icon: UserPlus,
      color: "bg-blue-500",
      onClick: () => router.push("/dashboard/customers?action=create"),
    },
    {
      id: 2,
      title: "Buat Invoice",
      description: "Generate tagihan baru",
      icon: FileText,
      color: "bg-green-500",
      onClick: () => router.push("/dashboard/invoices?action=create"),
    },
    {
      id: 3,
      title: "Perpanjang Paket",
      description: "Extend masa aktif",
      icon: Calendar,
      color: "bg-purple-500",
      onClick: () => {
        toast.success("Pilih pelanggan untuk diperpanjang");
        router.push("/dashboard/customers");
      },
    },
    {
      id: 4,
      title: "Export Laporan",
      description: "Download data Excel",
      icon: Download,
      color: "bg-orange-500",
      onClick: () => toast.success("Fitur export akan segera hadir!"),
    },
    {
      id: 5,
      title: "Refresh Data",
      description: "Sync dengan database",
      icon: RefreshCw,
      color: "bg-indigo-500",
      onClick: () => {
        toast.success("Data diperbarui");
        window.location.reload();
      },
    },
    {
      id: 6,
      title: "Pengaturan",
      description: "Konfigurasi sistem",
      icon: Settings,
      color: "bg-gray-500",
      onClick: () => router.push("/dashboard/settings"),
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Aksi Cepat</h3>
        </div>
        <span className="text-sm text-gray-500">{actions.length} aksi</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="group flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all hover:shadow-sm"
          >
            <div
              className={`p-3 rounded-full ${action.color} mb-3 group-hover:scale-110 transition-transform`}
            >
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-gray-900 text-center mb-1">
              {action.title}
            </h4>
            <p className="text-xs text-gray-500 text-center">
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
