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

  const [statusFilter, setStatusFilter] =
    useState("All");

  const filteredProducts =
    products.filter((product) => {
      const searchTerm =
        search.toLowerCase();

      const matchesSearch =
        product.productName
          .toLowerCase()
          .includes(searchTerm) ||
        product.productId
          .toString()
          .includes(searchTerm) ||
        product.slug
          .toLowerCase()
          .includes(searchTerm);

      const matchesStatus =
        statusFilter === "All" ||
        product.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
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

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by Product Name, ID or Slug..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">
            All Products
          </option>

          <option value="Active">
            Active Products
          </option>

          <option value="Inactive">
            Inactive Products
          </option>
        </select>
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