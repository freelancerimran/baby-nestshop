"use client";

import { useEffect, useState } from "react";
import ProductCard from "../ProductCard";

type Product = {
  productId: number;
  productName: string;
  price: number;
  slug: string;
  image: string;
  displayStock: number;
};

type Props = {
  currentSlug: string;
};

export default function SimilarProducts({
  currentSlug,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          "/api/products"
        );

        const data = await response.json();

        const filteredProducts =
          (data.products || [])
            .filter(
              (item: Product) =>
                item.slug !== currentSlug
            )
            .slice(0, 4);

        setProducts(filteredProducts);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentSlug]);

  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="mb-8 text-3xl font-bold text-gray-900">
          You May Also Like
        </h2>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
          Loading...
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">

      <h2 className="mb-8 text-3xl font-bold text-gray-900">
        You May Also Like
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

        {products.map((product) => (
          <ProductCard
            key={product.productId}
            id={product.productId}
            slug={product.slug}
            name={product.productName}
            price={product.price}
            image={product.image || ""}
            stock={product.displayStock}
          />
        ))}

      </div>

    </section>
  );
}