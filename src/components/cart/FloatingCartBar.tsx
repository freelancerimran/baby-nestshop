"use client";

import Link from "next/link";

import { useQuickCart } from "@/lib/store/quick-cart";

export default function FloatingCartBar() {
  const items = useQuickCart(
    (state) => state.items
  );

  const isCartPopupOpen = useQuickCart(
    (state) => state.isCartPopupOpen
  );

  const closeCartPopup = useQuickCart(
    (state) => state.closeCartPopup
  );

  /*
   * ============================================================
   * CART VISIBILITY
   * ============================================================
   *
   * Rules:
   *
   * 0 products
   * → NEVER show the floating popup.
   *
   * 1 product
   * → Show when the customer has just added/opened the cart.
   *
   * 2+ products
   * → Show the floating cart.
   *
   * The first condition is intentionally checked separately
   * so an empty cart can never display this popup.
   * ============================================================
   */

  const differentProductCount =
    items.length;

  const hasProducts =
    differentProductCount > 0;

  const shouldShow =
    hasProducts &&
    (
      differentProductCount >= 2 ||
      isCartPopupOpen
    );

  /*
   * If there is no product in the cart,
   * the floating popup must disappear immediately.
   */
  if (!shouldShow) {
    return null;
  }

  /*
   * ============================================================
   * CART SUBTOTAL
   * ============================================================
   *
   * Variant selection happens later on /quick-order.
   * Therefore this remains the current product-level
   * cart subtotal.
   * ============================================================
   */

  const subtotal = items.reduce(
    (total, item) => {
      const quantity = Math.max(
        0,
        Number(item.quantity || 0)
      );

      const unitPrice = Math.max(
        0,
        Number(item.unitPrice || 0)
      );

      return (
        total +
        unitPrice * quantity
      );
    },
    0
  );

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div className="fixed bottom-5 left-1/2 z-[9999] w-[calc(100%-24px)] max-w-xl -translate-x-1/2">
      <div className="relative flex items-center justify-between gap-4 rounded-2xl bg-teal-600 px-5 py-4 text-white shadow-2xl ring-1 ring-black/5">

        {/* ==================================================
            CLOSE BUTTON
            ================================================== */}

        <button
          type="button"
          onClick={closeCartPopup}
          aria-label="কার্ট পপআপ বন্ধ করুন"
          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-600 shadow-md transition hover:bg-gray-100 active:scale-95"
        >
          ×
        </button>

        {/* ==================================================
            CART INFORMATION
            ================================================== */}

        <div className="min-w-0">
          <p className="text-base font-bold sm:text-lg">
            🛒 {differentProductCount} টি
            প্রোডাক্ট
          </p>

          <p className="mt-0.5 text-sm text-teal-100">
            মোট ৳{" "}
            {subtotal.toLocaleString(
              "en-BD"
            )}
          </p>
        </div>

        {/* ==================================================
            COMPLETE ORDER
            ================================================== */}

        <Link
          href="/quick-order"
          className="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-700 transition hover:bg-gray-100 active:scale-[0.98] sm:px-6 sm:text-base"
        >
          অর্ডার সম্পূর্ণ করুন
        </Link>
      </div>
    </div>
  );
}