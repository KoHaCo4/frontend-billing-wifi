"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wifi,
  Package,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    href: "/dashboard",
    color: "text-blue-600",
  },
  {
    title: "Customers",
    icon: <Users size={20} />,
    href: "/dashboard/customers",
    color: "text-green-600",
  },
  {
    title: "Routers",
    icon: <Wifi size={20} />,
    href: "/dashboard/routers",
    color: "text-purple-600",
  },
  {
    title: "Packages",
    icon: <Package size={20} />,
    href: "/dashboard/packages",
    color: "text-yellow-600",
  },
  {
    title: "Invoices",
    icon: <FileText size={20} />,
    href: "/dashboard/invoices",
    color: "text-red-600",
  },
  {
    title: "Settings",
    icon: <Settings size={20} />,
    href: "/dashboard/settings",
    color: "text-gray-600",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-16 w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)]">
      <div className="h-16 border-b border-gray-200 flex items-center px-4">
        <h1 className="text-xl font-bold text-gray-800">Billing WiFi</h1>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className={`${item.color}`}>{item.icon}</div>
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 max-w-64">
        <button
          onClick={logout}
          className="flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
