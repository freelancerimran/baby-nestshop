"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProductCardProps = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
};

export default function ProductCard({
  id,
  slug,
  name,
  description,
  price,
}: ProductCardProps) {
  const [stock, setStock] = useState<number>(0);

  useEffect(() => {
    const loadStock = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        const currentProduct = data.products?.find(
          (item: { productId: number }) =>
            Number(item.productId) === id
        );

        if (currentProduct) {
          setStock(Number(currentProduct.displayStock));
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadStock();
  }, [id]);

  return (
    <Link href={`/product/${slug}`}>
      <div className="border rounded-xl p-6 shadow-sm hover:shadow-lg transition cursor-pointer">

        {stock > 0 && (
          <div
            className={`mb-3 inline-block rounded-lg px-3 py-1 text-sm font-semibold ${
              stock <= 5
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {stock <= 5
              ? `🚨 শেষ ${stock} টি বাকি`
              : `🔥 ${stock} টি বাকি`}
          </div>
        )}

        {stock <= 0 && (
          <div className="mb-3 inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
            ❌ স্টক শেষ
          </div>
        )}

        <h2 className="text-xl font-semibold">
          {name}
        </h2>

        <p className="mt-2 text-gray-600">
          {description}
        </p>

        <p className="mt-4 font-bold">
          ৳ {price}
        </p>
      </div>
    </Link>
  );
}