"use client";

import { useState } from "react";
import { AdminProduct } from "@/types/admin-product";

interface Props {
  onClose: () => void;
}

export default function ProductCreateModal({
  onClose,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [form, setForm] =
    useState<AdminProduct>({
      productId: "",
      productName: "",
      realStock: 0,
      displayStock: 0,
      status: "Active",
      price: 0,
      slug: "",
      description: "",
      image: "",
    });

  async function handleSave() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/create-product",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const result =
        await response.json();

      if (result.success) {
        alert("Product Created");
        window.location.reload();
      } else {
        alert(
          result.message ||
            "Create Failed"
        );
      }
    } catch (error) {
      console.error(error);
      alert("Create Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

      <div className="w-full max-w-2xl rounded-2xl bg-white p-6">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Create Product
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add a new product to inventory
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-xl"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4">

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Product Name
            </label>

            <input
              className="w-full rounded-lg border p-3"
              placeholder="Enter Product Name"
              value={form.productName}
              onChange={(e) =>
                setForm({
                  ...form,
                  productName:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Price
            </label>

            <input
              className="w-full rounded-lg border p-3"
              type="number"
              placeholder="Enter Price"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: Number(
                    e.target.value
                  ),
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Real Stock
            </label>

            <input
              className="w-full rounded-lg border p-3"
              type="number"
              placeholder="Enter Real Stock"
              value={form.realStock}
              onChange={(e) =>
                setForm({
                  ...form,
                  realStock: Number(
                    e.target.value
                  ),
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Display Stock
            </label>

            <input
              className="w-full rounded-lg border p-3"
              type="number"
              placeholder="Enter Display Stock"
              value={form.displayStock}
              onChange={(e) =>
                setForm({
                  ...form,
                  displayStock:
                    Number(
                      e.target.value
                    ),
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Slug
            </label>

            <input
              className="w-full rounded-lg border p-3"
              placeholder="Enter Slug"
              value={form.slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Image URL
            </label>

            <input
              className="w-full rounded-lg border p-3"
              placeholder="Enter Image URL"
              value={form.image}
              onChange={(e) =>
                setForm({
                  ...form,
                  image:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Description
            </label>

            <textarea
              rows={4}
              className="w-full rounded-lg border p-3"
              placeholder="Enter Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Status
            </label>

            <select
              className="w-full rounded-lg border p-3"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status:
                    e.target.value,
                })
              }
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
          >
            {loading
              ? "Creating..."
              : "Create Product"}
          </button>

        </div>
      </div>
    </div>
  );
}