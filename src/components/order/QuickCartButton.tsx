"use client";

import { Product } from "@/types/product";
import { useQuickCart } from "@/lib/store/quick-cart";

type Props = {
  product: Product;
};

export default function QuickCartButton({
  product,
}: Props) {
  const addItem = useQuickCart(
    (state) => state.addItem
  );

  const isInCart = useQuickCart(
    (state) => state.isInCart(product.id)
  );

  const handleAddToCart = () => {
    console.log(
      JSON.stringify(product, null, 2)
    );

    addItem({
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      image: product.image,
      unitPrice: product.sellingPrice,
      quantity: 1,
      maxStock: product.displayStock || 1,

      deliveryInsideDhaka: Number(
        product.deliveryInsideDhaka
      ),

      deliveryOutsideDhaka: Number(
        product.deliveryOutsideDhaka
      ),
    });
  };

  const handleBuyNow = () => {
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
    <div className="grid w-full grid-cols-2 gap-2.5">
      
      {/* ================================
          ADD TO CART
          ================================ */}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isInCart}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition active:scale-[0.98] sm:text-base ${
          isInCart
            ? "bg-green-600 text-white"
            : "bg-orange-500 text-white hover:bg-orange-600"
        }`}
      >
        {isInCart
          ? "✅ Added to Cart"
          : "🛒 Add to Cart"}
      </button>

      {/* ================================
          BUY NOW
          ================================ */}

      <button
        type="button"
        onClick={handleBuyNow}
        className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98] sm:text-base"
      >
        ⚡ Buy Now
      </button>

    </div>
  );
}