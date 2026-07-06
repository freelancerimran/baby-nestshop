"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  Search,
} from "lucide-react";

interface Props {
  logo: string;
  siteName: string;
}

export default function HeaderClient({
  logo,
  siteName,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <>
      {/* Top Bar */}
      <div className="hidden bg-emerald-600 text-white lg:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-center gap-8 px-6 text-sm font-medium">
          <span>
            🚚 Free Delivery Over ৳999
          </span>

          <span className="opacity-40">
            |
          </span>

          <span>
            📚 Educational Books &
            Learning Toys
          </span>

          <span className="opacity-40">
            |
          </span>

          <span>
            ⭐ Trusted By Parents
            Across Bangladesh
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            {logo ? (
              <img
                src={logo}
                alt={siteName}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white">
                📚
              </div>
            )}

            <div>
              <h2 className="truncate text-xl font-bold text-gray-900">
                {siteName}
              </h2>

              <p className="hidden text-xs text-gray-500 sm:block">
                Learn • Play • Grow
              </p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden items-center gap-8 lg:flex">
            <Link
              href="/"
              className="font-medium text-emerald-600"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="font-medium text-gray-700 hover:text-emerald-600"
            >
              Shop
            </Link>

            <Link
              href="/track-order"
              className="font-medium text-gray-700 hover:text-emerald-600"
            >
              Track Order
            </Link>

            <Link
              href="/faq"
              className="font-medium text-gray-700 hover:text-emerald-600"
            >
              FAQ
            </Link>

            <Link
              href="/contact"
              className="font-medium text-gray-700 hover:text-emerald-600"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Right */}
          <div className="hidden items-center gap-4 lg:flex">

            <div className="flex items-center rounded-full border border-gray-200 px-4 py-2">
              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                placeholder="Search products..."
                className="ml-2 w-44 border-none bg-transparent text-sm outline-none"
              />
            </div>

            <Link
              href="/shop"
              className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Shop Now
            </Link>

          </div>

          {/* Mobile Menu Button */}
{/* Mobile Menu Button */}
{!mobileMenuOpen && (
  <button
    onClick={() =>
      setMobileMenuOpen(true)
    }
    className="rounded-xl p-2 transition hover:bg-gray-100 lg:hidden"
  >
    <Menu size={30} />
  </button>
)}

        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">

          {/* Premium Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          />

          {/* Drawer */}
          <div className="absolute inset-0 z-[9999] bg-white overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 z-20 border-b border-gray-100 bg-white">

              <div className="flex items-center justify-between px-6 py-5">

  <div className="flex min-w-0 flex-1 items-center gap-3">

    {logo ? (
      <img
        src={logo}
        alt={siteName}
        className="h-12 w-12 shrink-0 rounded-xl border border-gray-100 object-cover"
      />
    ) : (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white">
        📚
      </div>
    )}

    <div className="min-w-0">
      <h2 className="truncate text-xl font-bold text-gray-900">
        {siteName}
      </h2>

      <p className="text-xs text-gray-500">
        Learn • Play • Grow
      </p>
    </div>

  </div>

<button
  type="button"
  onClick={() =>
    setMobileMenuOpen(false)
  }
  className="relative z-[10000] ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
>
    <X
      size={26}
      className="text-gray-700"
    />
  </button>

</div>

            </div>

            {/* Search */}
            <div className="px-6 pt-6">

              <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">

                <Search
                  size={18}
                  className="text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Search products..."
                  className="ml-3 w-full bg-transparent text-sm outline-none"
                />

              </div>

            </div>

            {/* Menu Items */}
            <div className="px-6 py-8">

              <div className="space-y-3">

                <Link
                  href="/"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="block rounded-2xl bg-emerald-50 px-5 py-4 text-lg font-semibold text-emerald-600"
                >
                  Home
                </Link>

                <Link
                  href="/shop"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="block rounded-2xl px-5 py-4 text-lg font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Shop
                </Link>

                <Link
                  href="/track-order"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="block rounded-2xl px-5 py-4 text-lg font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Track Order
                </Link>

                <Link
                  href="/faq"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="block rounded-2xl px-5 py-4 text-lg font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  FAQ
                </Link>

                <Link
                  href="/contact"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="block rounded-2xl px-5 py-4 text-lg font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Contact
                </Link>

              </div>

              {/* CTA */}
              <div className="mt-8">

                <Link
                  href="/shop"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="block w-full rounded-2xl bg-emerald-600 py-4 text-center text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                >
                  Shop Now
                </Link>

              </div>

              {/* Trust Card */}
              <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                <p className="font-semibold text-emerald-700">
                  ⭐ Trusted By Parents
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Educational Books & Learning Toys
                </p>

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}