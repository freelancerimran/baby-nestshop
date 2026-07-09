"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Truck,
  BarChart3,
  Settings,
  BadgeDollarSign,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: Package,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: ShoppingBag,
  },
  {
    name: "Inventory",
    href: "/admin/inventory",
    icon: Boxes,
  },
  {
    name: "Fulfillment",
    href: "/admin/fulfillment",
    icon: Truck,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Facebook Pixel",
    href: "/admin/facebook-pixel",
    icon: BadgeDollarSign,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminMobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (!open) return null;

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] lg:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900">
            Baby Nest ERP
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu */}
        <div className="p-4">

          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-xl bg-red-500 px-4 py-3 font-medium text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}