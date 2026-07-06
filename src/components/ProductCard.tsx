"use client";

import Link from "next/link";
import Image from "next/image";

type ProductCardProps = {
  id: number;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
};

export default function ProductCard({
  slug,
  name,
  price,
  image,
  stock = 0,
  featured,
  bestSeller,
  newArrival,
}: ProductCardProps) {
  const validImage =
    typeof image === "string" &&
    image.trim() !== "" &&
    (image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("/"));

  return (
    <Link href={`/product/${slug}`}>
      <div className="h-full cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

        {validImage ? (
          <div className="relative mb-4 h-56 overflow-hidden rounded-xl bg-gray-100">

            {featured && (
              <div className="absolute left-2 top-2 z-10 rounded-lg bg-yellow-500 px-2 py-1 text-xs font-bold text-white">
                ⭐ Featured
              </div>
            )}

            {bestSeller && (
              <div className="absolute right-2 top-2 z-10 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">
                🔥 Best Seller
              </div>
            )}

            {newArrival && (
              <div className="absolute left-2 bottom-2 z-10 rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-white">
                ✨ New Arrival
              </div>
            )}

            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="mb-4 flex h-56 items-center justify-center rounded-xl bg-gray-100">
            <div className="text-center">
              <div className="text-5xl">📚</div>

              <p className="mt-2 text-sm text-gray-500">
                No Image
              </p>
            </div>
          </div>
        )}

        {stock > 0 ? (
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
        ) : (
          <div className="mb-3 inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
            ❌ স্টক শেষ
          </div>
        )}

        <h2 className="line-clamp-2 text-lg font-semibold text-gray-900">
          {name}
        </h2>

        <p className="mt-2 text-2xl font-bold text-emerald-600">
          ৳ {price}
        </p>

        <div className="mt-4">
          <span className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
            View Product
          </span>
        </div>

      </div>
    </Link>
  );
}