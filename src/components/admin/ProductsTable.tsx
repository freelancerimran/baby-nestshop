"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AdminProduct } from "@/types/admin-product";
import ProductEditModal from "./ProductEditModal";

export default function ProductsTable({
  products,
}: {
  products: AdminProduct[];
}) {
  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<AdminProduct | null>(
    null
  );

  const [
    deleteProduct,
    setDeleteProduct,
  ] = useState<AdminProduct | null>(
    null
  );

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  /*
   * ========================================
   * DELETE PRODUCT
   * ========================================
   */

  async function handleDeleteProduct() {
    if (!deleteProduct) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      const response =
        await fetch(
          "/api/admin/delete-product",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              productId:
                deleteProduct.productId,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete product."
        );
      }

      /*
       * Close modal first.
       */

      setDeleteProduct(null);

      /*
       * Refresh server-side product data.
       */

      window.location.reload();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete product."
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * ========================================
   * STATUS BADGE
   * ========================================
   */

  function getStatusBadge(
    status: string
  ) {
    const active =
      status === "Active";

    return (
      <span
        className={
          active
            ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-100"
            : "inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-100"
        }
      >
        <span
          className={
            active
              ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
              : "h-1.5 w-1.5 rounded-full bg-red-500"
          }
        />

        {status}
      </span>
    );
  }

  /*
   * ========================================
   * PRODUCT BADGES
   * ========================================
   */

  function ProductBadges({
    product,
  }: {
    product: AdminProduct;
  }) {
    const badges: ReactNode[] =
      [];

    if (product.featured) {
      badges.push(
        <span
          key="featured"
          className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100"
        >
          ⭐ Featured
        </span>
      );
    }

    if (product.bestSeller) {
      badges.push(
        <span
          key="bestseller"
          className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 ring-1 ring-inset ring-red-100"
        >
          🔥 Best Seller
        </span>
      );
    }

    if (product.newArrival) {
      badges.push(
        <span
          key="new"
          className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600 ring-1 ring-inset ring-blue-100"
        >
          ✨ New Arrival
        </span>
      );
    }

    if (badges.length === 0) {
      return (
        <span className="text-xs text-slate-400">
          Standard product
        </span>
      );
    }

    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {badges}
      </div>
    );
  }

  /*
   * ========================================
   * TABLE
   * ========================================
   */

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Table Header */}

        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Product Catalog
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Manage products, pricing and inventory
              </p>
            </div>

            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {products.length} Products
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">

            <thead>
              <tr className="border-b border-slate-200 bg-white text-xs uppercase tracking-wider text-slate-500">
                <th className="w-20 px-5 py-4 text-left font-semibold">
                  ID
                </th>

                <th className="min-w-[320px] px-5 py-4 text-left font-semibold">
                  Product
                </th>

                <th className="w-32 px-5 py-4 text-left font-semibold">
                  Price
                </th>

                <th className="w-32 px-5 py-4 text-left font-semibold">
                  Real Stock
                </th>

                <th className="w-32 px-5 py-4 text-left font-semibold">
                  Display
                </th>

                <th className="w-32 px-5 py-4 text-left font-semibold">
                  Status
                </th>

                <th className="w-72 px-5 py-4 text-left font-semibold">
                  Slug
                </th>

                <th className="w-40 px-5 py-4 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {products.map(
                (product) => (
                  <tr
                    key={
                      product.productId
                    }
                    className="group transition-colors hover:bg-slate-50/70"
                  >

                    {/* ID */}

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-medium text-slate-400">
                        #{product.productId}
                      </span>
                    </td>

                    {/* Product */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                          {product.image ? (
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.productName
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <svg
                              width="19"
                              height="19"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              className="text-slate-400"
                            >
                              <path d="m21 8-9-5-9 5 9 5 9-5Z" />
                              <path d="m3 8 9 5 9-5" />
                              <path d="M3 8v8l9 5 9-5V8" />
                            </svg>
                          )}

                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800">
                            {
                              product.productName
                            }
                          </div>

                          <ProductBadges
                            product={
                              product
                            }
                          />
                        </div>

                      </div>
                    </td>

                    {/* Price */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">
                        ৳{" "}
                        {product.price}
                      </span>
                    </td>

                    {/* Real Stock */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-700">
                        {
                          product.realStock
                        }
                      </span>
                    </td>

                    {/* Display Stock */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-600">
                        {
                          product.displayStock
                        }
                      </span>
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      {getStatusBadge(
                        product.status
                      )}
                    </td>

                    {/* Slug */}

                    <td className="px-5 py-4">
                      <div
                        title={
                          product.slug
                        }
                        className="max-w-[260px] truncate rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 ring-1 ring-inset ring-slate-100"
                      >
                        {
                          product.slug
                        }
                      </div>
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">

                        {/* Edit */}

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                          onClick={() =>
                            setSelectedProduct(
                              product
                            )
                          }
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                          </svg>

                          Edit
                        </button>

                        {/* Delete */}

                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50"
                          onClick={() => {
                            setDeleteError("");
                            setDeleteProduct(
                              product
                            );
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 15H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>

                      </div>
                    </td>

                  </tr>
                )
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================
          EDIT MODAL
          EXISTING
          ======================================== */}

      {selectedProduct && (
        <ProductEditModal
          product={
            selectedProduct
          }
          onClose={() =>
            setSelectedProduct(
              null
            )
          }
        />
      )}

      {/* ========================================
          DELETE CONFIRMATION MODAL
          ======================================== */}

      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 9v4" />
                  <path
                    d="M12 17h.01"
                    strokeLinecap="round"
                  />
                  <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete Product?
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  This action cannot be undone.
                </p>
              </div>

            </div>

            {/* Modal Body */}

            <div className="px-6 py-5">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Product
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {
                    deleteProduct.productName
                  }
                </p>

                <p className="mt-1 font-mono text-xs text-slate-400">
                  ID:{" "}
                  {
                    deleteProduct.productId
                  }
                </p>

              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Are you sure you want to permanently
                delete this product? Any variants belonging
                to this product will also be removed.
              </p>

              {deleteError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {deleteError}
                </div>
              )}

            </div>

            {/* Modal Footer */}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteProduct(
                    null
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={
                  handleDeleteProduct
                }
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 15H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>

                    Delete Product
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}