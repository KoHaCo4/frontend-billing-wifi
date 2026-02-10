"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Users,
  CreditCard,
  Package,
  Wifi,
  Clock,
  Settings,
  Activity,
  Ticket,
  FileText,
  BarChart,
  Shield,
  ChevronDown,
  ChevronRight,
  Database,
  LogOut,
  Bell,
  AlertCircle,
  Monitor,
} from "lucide-react";

// Menu untuk kategori Billing
const billingMenu = [
  { name: "Member", href: "/dashboard/billing/members", icon: Users },
  { name: "Invoice", href: "/dashboard/billing/invoices", icon: CreditCard },
  { name: "Suspensi", href: "/dashboard/billing/suspension", icon: Clock },
  {
    name: "Transactions",
    href: "/dashboard/billing/transactions",
    icon: Activity,
  },
  { name: "Pengaturan", href: "/dashboard/billing/settings", icon: Settings },
];

// Menu untuk kategori Radius
const radiusMenu = [
  { name: "User RADIUS", href: "/dashboard/radius/users", icon: Users },
  { name: "Sesi Aktif", href: "/dashboard/radius/sessions", icon: Activity },
  { name: "Log RADIUS", href: "/dashboard/radius/logs", icon: FileText },
  { name: "Profiles", href: "/dashboard/radius/profiles", icon: Shield },
  { name: "Radius", href: "/dashboard/radius/radius", icon: Wifi },
  { name: "Statistics", href: "/dashboard/radius/statistics", icon: BarChart },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const [billingOpen, setBillingOpen] = useState(true);
  const [radiusOpen, setRadiusOpen] = useState(false);

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 h-screen pt-4 bg-white border-r
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="p-2">
          {/* Dashboard Utama */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname === "/dashboard"
                  ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-500"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Home className="h-5 w-5" />
              Dashboard Utama
            </Link>
          </div>

          <div className="mb-6">
            <Link
              href="/dashboard/traffic"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname === "/dashboard/traffic"
                  ? "bg-blue-50 text-blue-700 border-l-4 border-l-blue-500"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Monitor className="h-5 w-5" />
              Traffic Monitor
            </Link>
          </div>

          {/* Kategori Billing */}
          <div className="mb-6">
            <button
              onClick={() => setBillingOpen(!billingOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 rounded">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <span>Billing Management</span>
              </div>
              {billingOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {billingOpen && (
              <nav className="mt-2 space-y-1 pl-9">
                {billingMenu.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Kategori Radius */}
          <div className="mb-6">
            <button
              onClick={() => setRadiusOpen(!radiusOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-purple-50 rounded">
                  <Wifi className="h-4 w-4 text-purple-600" />
                </div>
                <span>Radius Management</span>
              </div>
              {radiusOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {radiusOpen && (
              <nav className="mt-2 space-y-1 pl-9">
                {radiusMenu.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-purple-50 text-purple-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* System Status */}
          <div className="mt-8 px-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              System Status
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Billing System</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">RADIUS Server</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 px-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Stats
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Total Customers</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Active Sessions</span>
                <span className="font-medium text-green-600">42</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Pending Invoices</span>
                <span className="font-medium text-orange-600">23</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
