"use client";

import { useState } from "react";
import { AdminProduct } from "@/types/admin-product";
import ProductsTable from "./ProductsTable";
import ProductCreateModal from "./ProductCreateModal";

export default function ProductsPageClient({
  products,
}: {
  products: AdminProduct[];
}) {
  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const filteredProducts =
    products.filter((product) => {
      const searchTerm =
        search.toLowerCase();

      return (
        product.productName
          .toLowerCase()
          .includes(searchTerm) ||

        product.productId
          .toString()
          .includes(searchTerm) ||

        product.slug
          .toLowerCase()
          .includes(searchTerm)
      );
    });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Products
        </h1>

        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Product Name, ID or Slug..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ProductsTable
        products={filteredProducts}
      />

      {open && (
        <ProductCreateModal
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}