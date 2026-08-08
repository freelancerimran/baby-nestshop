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

const handleAdd = () => {
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

deliveryInsideDhaka: Number(product.deliveryInsideDhaka),
deliveryOutsideDhaka: Number(product.deliveryOutsideDhaka),
  });
};
  
  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isInCart}
      className={`w-full rounded-xl py-3 font-semibold transition ${
        isInCart
          ? "bg-green-600 text-white"
          : "bg-orange-500 text-white hover:bg-orange-600"
      }`}
    >
      {isInCart
        ? "✅ Added to Order"
        : "🛒 Add to Order"}
    </button>
  );
}