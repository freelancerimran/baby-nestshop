"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Product } from "@/types/product";
import { CartVariant } from "@/types/cart";
import { useQuickCart } from "@/lib/store/quick-cart";

type ProductWithVariants = Product & {
  variants?: CartVariant[];
};

type Props = {
  product: ProductWithVariants;
  onBuyNow?: () => void;
};

export default function QuickCartButton({
  product,
  onBuyNow,
}: Props) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const addItem = useQuickCart(
    (state) => state.addItem
  );

  const syncItem = useQuickCart(
    (state) => state.syncItem
  );

  const openCartPopup = useQuickCart(
    (state) => state.openCartPopup
  );

  const cartIsInCart = useQuickCart(
    (state) =>
      state.isInCart(Number(product.id))
  );

  const isInCart =
    isHydrated && cartIsInCart;

  const activeVariants =
    (product.variants || []).filter(
      (variant) =>
        variant.status === "Active" &&
        Number(variant.realStock) > 0
    );

  const maxStock =
    activeVariants.length > 0
      ? activeVariants.reduce(
          (total, variant) =>
            total +
            Math.max(
              0,
              Number(variant.realStock)
            ),
          0
        )
      : Math.max(
          0,
          Number(product.displayStock || 0)
        );

  const cartItemData = {
    productId: Number(product.id),
    productName: product.name,
    slug: product.slug,
    image: product.image,
    unitPrice: Number(
      product.sellingPrice || 0
    ),
    quantity: 1,
    maxStock,
    deliveryInsideDhaka: Number(
      product.deliveryInsideDhaka || 0
    ),
    deliveryOutsideDhaka: Number(
      product.deliveryOutsideDhaka || 0
    ),
    variants: activeVariants,
  };

  /*
  ============================================================
  AUTOMATIC EXISTING CART SYNC
  ============================================================

  If this product already exists in the persisted cart,
  synchronize its latest product/variant data automatically
  when the product page is opened.

  syncItem() preserves the existing cart quantity.
  ============================================================
  */

  const autoSyncProductId =
    useRef<number | null>(null);

  useEffect(() => {
    const productId = Number(product.id);

    if (
      !isHydrated ||
      !isInCart ||
      autoSyncProductId.current === productId
    ) {
      return;
    }

    syncItem(cartItemData);

    autoSyncProductId.current = productId;
  }, [
    isHydrated,
    isInCart,
    product.id,
    syncItem,
  ]);

  const handleAddToCart = () => {
    /*
     * Existing product:
     * synchronize latest data without changing
     * the customer's existing cart quantity.
     */
    if (isInCart) {
      syncItem(cartItemData);
      openCartPopup();
      return;
    }

    if (maxStock <= 0) {
      return;
    }

    /*
     * Variant selection is intentionally NOT required
     * at Add to Cart time.
     *
     * All active variants are stored in the cart.
     * Selection happens later in Quick Order.
     */
    addItem(cartItemData);

    openCartPopup();
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow();
      return;
    }

    const orderForm =
      document.getElementById(
        "product-order-form"
      );

    if (!orderForm) {
      console.warn(
        "Product order form not found"
      );
      return;
    }

    orderForm.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="w-full">
      <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={maxStock <= 0}
          className={
            isInCart
              ? "flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] sm:text-base"
              : maxStock <= 0
                ? "flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-300 px-5 py-3.5 text-sm font-semibold text-gray-500 sm:text-base"
                : "flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-[0.98] sm:text-base"
          }
        >
          <span>
            {isInCart
              ? "✓"
              : maxStock <= 0
                ? "×"
                : "🛒"}
          </span>

          <span>
            {isInCart
              ? "Added to Cart"
              : maxStock <= 0
                ? "Out of Stock"
                : "Add to Cart"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98] sm:text-base"
        >
          <span>⚡</span>
          <span>Buy Now</span>
        </button>

      </div>

      <p className="mt-2 text-center text-xs leading-relaxed text-gray-500">
        🛒 একাধিক প্রোডাক্ট একসাথে
        অর্ডার করতে Add to Cart ব্যবহার
        করুন।
      </p>
    </div>
  );
}
