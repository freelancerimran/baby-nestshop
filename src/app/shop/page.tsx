export const dynamic = "force-dynamic";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "Active")
    .order("product_id", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
  }>;
}) {
  const products = await getProducts();

  const params = await searchParams;

  const search =
    params.search?.toLowerCase().trim() || "";

  const filteredProducts =
    search.length > 0
      ? products.filter((product) =>
          product.product_name
            ?.toLowerCase()
            .includes(search)
        )
      : products;

  return (
    <div className="bg-gray-50">

      {/* Hero Section */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">

          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            📚 Educational Books & Learning Toys
          </span>

          <h1 className="mt-6 text-4xl font-bold text-gray-900 md:text-5xl">
            Shop Our Collection
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600">
            Discover educational books, busy books, puzzle books,
            activity books and learning toys carefully selected to help
            children learn, explore and grow through play.
          </p>

          <div className="mt-8 inline-flex rounded-full bg-white px-5 py-3 shadow-sm">
            <span className="font-medium text-gray-700">
              {filteredProducts.length} Products Available
            </span>
          </div>

          {search && (
            <div className="mt-4">
              <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Search Result For: "{search}"
              </span>
            </div>
          )}

        </div>
      </section>

      {/* Products Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-12 text-center">

            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              Our Products
            </span>

            <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {search ? "Search Results" : "All Products"}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Browse our complete collection of educational books and
              learning toys designed for curious young minds.
            </p>

          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-24 text-center">

              <div className="text-6xl">
                🔍
              </div>

              <h3 className="mt-6 text-2xl font-bold text-gray-900">
                No Products Found
              </h3>

              <p className="mt-3 text-gray-500">
                We couldn't find any products matching your search.
              </p>

            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.product_id}
                  id={Number(product.product_id)}
                  slug={product.slug}
                  name={product.product_name}
                  price={Number(product.price)}
                  image={product.image || ""}
                  stock={Number(product.display_stock || 0)}
                  featured={product.featured}
                  bestSeller={product.best_seller}
                  newArrival={product.new_arrival}
                />
              ))}

            </div>
          )}

        </div>
      </section>

      {/* Trust Section */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6">

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">
                📚
              </div>

              <h3 className="mb-3 text-xl font-semibold">
                Educational Products
              </h3>

              <p className="text-gray-600">
                Carefully selected products designed to support learning and development.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">
                🚚
              </div>

              <h3 className="mb-3 text-xl font-semibold">
                Fast Delivery
              </h3>

              <p className="text-gray-600">
                Reliable delivery service across Bangladesh.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">
                ⭐
              </div>

              <h3 className="mb-3 text-xl font-semibold">
                Trusted By Parents
              </h3>

              <p className="text-gray-600">
                Loved by families who value quality educational products.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6">

          <div className="rounded-3xl bg-emerald-600 p-12 text-center text-white">

            <h2 className="mb-4 text-4xl font-bold">
              Need Help Choosing The Right Product?
            </h2>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-emerald-100">
              Our team is happy to help you choose the perfect educational
              book or learning toy for your child.
            </p>

            <Link
              href="/contact"
              className="inline-flex rounded-xl bg-white px-8 py-4 font-semibold text-emerald-600"
            >
              Contact Us
            </Link>

          </div>

        </div>
      </section>

    </div>
  );
}