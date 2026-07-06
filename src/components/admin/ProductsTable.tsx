"use client";

import { AdminProduct } from "@/types/admin-product";
import { useState } from "react";
import ProductEditModal from "./ProductEditModal";

export default function ProductsTable({
  products,
}: {
  products: AdminProduct[];
}) {
  const [selectedProduct, setSelectedProduct] =
    useState<AdminProduct | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4 text-left">ID</th>
            <th className="p-4 text-left">Product</th>
            <th className="p-4 text-left">Price</th>
            <th className="p-4 text-left">Real Stock</th>
            <th className="p-4 text-left">Display Stock</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">Slug</th>
            <th className="p-4 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr
              key={product.productId}
              className="border-t"
            >
              <td className="p-4">
                {product.productId}
              </td>

              <td className="p-4">
                <div className="font-medium">
                  {product.productName}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">

                  {product.featured && (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                      ⭐ Featured
                    </span>
                  )}

                  {product.bestSeller && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                      🔥 Best Seller
                    </span>
                  )}

                  {product.newArrival && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      ✨ New Arrival
                    </span>
                  )}

                </div>
              </td>

              <td className="p-4">
                ৳ {product.price}
              </td>

              <td className="p-4">
                {product.realStock}
              </td>

              <td className="p-4">
                {product.displayStock}
              </td>

              <td className="p-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    product.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.status}
                </span>
              </td>

              <td className="p-4">
                {product.slug}
              </td>

              <td className="p-4">
                <button
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={() =>
                    setSelectedProduct(product)
                  }
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedProduct && (
        <ProductEditModal
          product={selectedProduct}
          onClose={() =>
            setSelectedProduct(null)
          }
        />
      )}
    </div>
  );
}