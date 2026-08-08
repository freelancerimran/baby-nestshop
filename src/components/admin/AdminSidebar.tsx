"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Truck,
  BarChart3,
  WalletCards,
  Settings,
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import AdminLogoutButton from "./AdminLogoutButton";

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
    name: "Finance",
    href: "/admin/finance",
    icon: WalletCards,
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

export default function AdminSidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  /*
  ========================================
  LOAD SIDEBAR STATE
  ========================================
  */

  useEffect(() => {
    setMounted(true);

    const savedState =
      localStorage.getItem(
        "baby-nest-admin-sidebar"
      );

    if (savedState === "collapsed") {
      setCollapsed(true);
    }
  }, []);

  /*
  ========================================
  TOGGLE SIDEBAR
  ========================================
  */

  function toggleSidebar() {
    const nextState = !collapsed;

    setCollapsed(nextState);

    localStorage.setItem(
      "baby-nest-admin-sidebar",
      nextState
        ? "collapsed"
        : "expanded"
    );
  }

  return (
    <aside
      className={`
        hidden
        lg:flex
        h-screen
        flex-shrink-0
        flex-col
        border-r
        border-gray-200
        bg-white
        transition-all
        duration-300
        ease-in-out
        relative
        ${collapsed ? "w-[72px]" : "w-[240px]"}
      `}
    >
      {/* ========================================
          BRAND
          ======================================== */}

      <div
        className={`
          relative
          flex
          min-h-[78px]
          items-center
          border-b
          border-gray-200
          transition-all
          duration-300
          ${
            collapsed
              ? "justify-center px-2"
              : "px-5"
          }
        `}
      >
        {collapsed ? (
          /* COLLAPSED BRAND */
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-sm"
            title="Baby Nest ERP"
          >
            BN
          </div>
        ) : (
          /* EXPANDED BRAND */
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-xl font-bold text-blue-600">
              Baby Nest ERP
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              Order & Inventory System
            </p>
          </div>
        )}

        {/* ========================================
            TOGGLE BUTTON
            ======================================== */}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className={`
            absolute
            top-1/2
            -translate-y-1/2
            z-20
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            border
            border-gray-200
            bg-white
            text-gray-500
            shadow-sm
            transition-all
            duration-200
            hover:bg-gray-50
            hover:text-blue-600
            ${
              collapsed
                ? "-right-3.5"
                : "-right-3.5"
            }
          `}
        >
          {collapsed ? (
            <ChevronRight size={15} />
          ) : (
            <ChevronLeft size={15} />
          )}
        </button>
      </div>

      {/* ========================================
          NAVIGATION
          ======================================== */}

      <nav
        className={`
          flex
          flex-1
          flex-col
          overflow-hidden
          transition-all
          duration-300
          ${
            collapsed
              ? "px-2 py-4"
              : "px-3 py-4"
          }
        `}
      >
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`
                  );

            return (
              <Link
                key={item.href}
                href={item.href}
                title={
                  collapsed
                    ? item.name
                    : undefined
                }
                className={`
                  group
                  relative
                  flex
                  h-11
                  items-center
                  rounded-xl
                  transition-all
                  duration-200
                  ${
                    collapsed
                      ? "justify-center px-0"
                      : "gap-3 px-3"
                  }
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <Icon
                  size={20}
                  strokeWidth={
                    isActive ? 2.2 : 1.9
                  }
                  className="flex-shrink-0"
                />

                {!collapsed && (
                  <span className="truncate whitespace-nowrap text-sm font-medium">
                    {item.name}
                  </span>
                )}

                {/* ====================================
                    CUSTOM TOOLTIP
                    ==================================== */}

                {collapsed && (
                  <span
                    className="
                      pointer-events-none
                      absolute
                      left-[calc(100%+12px)]
                      z-50
                      whitespace-nowrap
                      rounded-lg
                      bg-gray-900
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-white
                      opacity-0
                      shadow-lg
                      transition-opacity
                      duration-150
                      group-hover:opacity-100
                    "
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* ========================================
            LOGOUT
            ======================================== */}

        <div
          className={`
            mt-auto
            border-t
            border-gray-200
            pt-4
            ${
              collapsed
                ? "flex justify-center"
                : ""
            }
          `}
        >
          <div
            className={`
              transition-all
              duration-300
              ${
                collapsed
                  ? "w-11 overflow-hidden"
                  : "w-full"
              }
            `}
            title={
              collapsed
                ? "Logout"
                : undefined
            }
          >
            <AdminLogoutButton />
          </div>
        </div>
      </nav>
    </aside>
  );
}