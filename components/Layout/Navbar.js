"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Search,
  BellOff,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = () => {
    const path = pathname;

    if (path === "/dashboard") return "Dashboard Utama";
    if (path.includes("/dashboard/billing/customers")) return "Pelanggan";
    if (path.includes("/dashboard/billing/invoices")) return "Invoice";
    if (path.includes("/dashboard/billing/packages")) return "Paket Layanan";
    if (path.includes("/dashboard/billing/routers")) return "Manajemen Router";
    if (path.includes("/dashboard/billing/suspension")) return "Suspensi";
    if (path.includes("/dashboard/billing/test")) return "Test Sistem";
    if (path.includes("/dashboard/billing/settings"))
      return "Pengaturan Billing";

    if (path.includes("/dashboard/radius/users")) return "User RADIUS";
    if (path.includes("/dashboard/radius/vouchers")) return "Voucher";
    if (path.includes("/dashboard/radius/sessions")) return "Sesi Aktif";
    if (path.includes("/dashboard/radius/logs")) return "Log RADIUS";
    if (path.includes("/dashboard/radius/profiles")) return "Profiles";
    if (path.includes("/dashboard/radius/statistics"))
      return "Statistik RADIUS";
    if (path.includes("/dashboard/radius/settings")) return "Pengaturan RADIUS";

    return "Dashboard";
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-200 bg-white z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side: Menu toggle & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="font-medium text-gray-900">WiFi Billing</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium">{getPageTitle()}</span>
          </div>

          <div className="md:hidden">
            <span className="font-medium text-gray-900">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center: Search (desktop only) */}
        <div className="hidden md:block flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search customers, invoices, users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hidden md:block">
            <Sun className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 relative"
            >
              <BellOff className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-gray-900">
                    <p>Fitur belum tersedia</p>
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hidden md:block">
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role || "Super Admin"}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    href="/dashboard/billing/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help & Support
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
