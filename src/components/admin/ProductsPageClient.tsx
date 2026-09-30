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

  /*
   * ========================================
   * EXISTING FILTER LOGIC
   * DO NOT CHANGE
   * ========================================
   */

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
        product.status ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  /*
   * ========================================
   * PAGE
   * ========================================
   */

  return (
    <div className="min-h-full bg-slate-50/60 p-6 lg:p-8">

      {/* ========================================
          HEADER
          ======================================== */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Products
            </h1>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
              {products.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Manage your product catalog, pricing and inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M12 5v14M5 12h14"
              strokeLinecap="round"
            />
          </svg>

          Add Product
        </button>
      </div>

      {/* ========================================
          SEARCH / FILTER BAR
          ======================================== */}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row">

          {/* Search */}

          <div className="relative flex-1">

            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <path
                d="m20 20-4-4"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="text"
              placeholder="Search by Product Name, ID or Slug..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

          </div>

          {/* Status */}

          <div className="relative lg:w-52">

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
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

            <svg
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="m6 9 6 6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

          </div>

        </div>

        {/* Results */}

        <div className="mt-3 flex items-center justify-between">

          <p className="text-xs text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-600">
              {
                filteredProducts.length
              }
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-600">
              {products.length}
            </span>{" "}
            products
          </p>

          {(search ||
            statusFilter !==
              "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "All"
                );
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}

        </div>
      </div>

      {/* ========================================
          PRODUCTS TABLE
          ======================================== */}

      <ProductsTable
        products={
          filteredProducts
        }
      />

      {/* ========================================
          CREATE PRODUCT
          EXISTING
          ======================================== */}

      {open && (
        <ProductCreateModal
          onClose={() =>
            setOpen(false)
          }
        />
      )}

    </div>
  );
}