"use client";

import Link from "next/link";

import { useQuickCart } from "@/lib/store/quick-cart";

export default function FloatingCartBar() {
  const {
    totalItems,
    subtotal,
  } = useQuickCart();

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-[9999] w-[95%] max-w-xl -translate-x-1/2">

      <div className="flex items-center justify-between rounded-2xl bg-teal-600 px-6 py-4 text-white shadow-2xl">

        <div>

          <p className="text-lg font-bold">
            🛒 {totalItems} টি পণ্য
          </p>

          <p className="text-sm text-teal-100">
            মোট ৳ {subtotal}
          </p>

        </div>

        <Link
          href="/quick-order"
          className="rounded-xl bg-white px-6 py-3 font-semibold text-teal-700 transition hover:bg-gray-100"
        >
          অর্ডার সম্পন্ন করুন
        </Link>

      </div>

    </div>
  );
}