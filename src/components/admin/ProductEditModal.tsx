"use client";

import { useState } from "react";
import { AdminProduct } from "@/types/admin-product";
import ImageUploader from "./ImageUploader";

interface Props {
  product: AdminProduct;
  onClose: () => void;
}

export default function ProductEditModal({
  product,
  onClose,
}: Props) {
  const [form, setForm] =
    useState<AdminProduct>(product);

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/update-product",
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
        alert("Product Updated");
        window.location.reload();
      } else {
        alert(
          result.message ||
            "Update Failed"
        );
      }
    } catch (error) {
      console.error(error);
      alert("Update Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">

      <div className="flex min-h-full items-center justify-center">

        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                Edit Product
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update product information
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
                Regular Price
              </label>

              <input
                className="w-full rounded-lg border p-3"
                type="number"
                placeholder="Enter Regular Price"
                value={form.regularPrice ?? 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    regularPrice: Number(
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

<ImageUploader
  label="Main Image"
  value={form.image}
  onChange={(url) =>
    setForm({
      ...form,
      image: url,
    })
  }
/>

<ImageUploader
  label="Gallery Image 1"
  value={form.galleryImage1 || ""}
  onChange={(url) =>
    setForm({
      ...form,
      galleryImage1: url,
    })
  }
/>

<ImageUploader
  label="Gallery Image 2"
  value={form.galleryImage2 || ""}
  onChange={(url) =>
    setForm({
      ...form,
      galleryImage2: url,
    })
  }
/>

<ImageUploader
  label="Gallery Image 3"
  value={form.galleryImage3 || ""}
  onChange={(url) =>
    setForm({
      ...form,
      galleryImage3: url,
    })
  }
/>

<ImageUploader
  label="Gallery Image 4"
  value={form.galleryImage4 || ""}
  onChange={(url) =>
    setForm({
      ...form,
      galleryImage4: url,
    })
  }
/>

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
<div className="rounded-xl border p-4">
  <h3 className="mb-4 font-semibold">
    Product Labels
  </h3>

  <div className="space-y-3">

    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={form.featured || false}
        onChange={(e) =>
          setForm({
            ...form,
            featured: e.target.checked,
          })
        }
      />
      <span>Featured Product</span>
    </label>

    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={form.bestSeller || false}
        onChange={(e) =>
          setForm({
            ...form,
            bestSeller: e.target.checked,
          })
        }
      />
      <span>Best Seller</span>
    </label>

    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={form.newArrival || false}
        onChange={(e) =>
          setForm({
            ...form,
            newArrival: e.target.checked,
          })
        }
      />
      <span>New Arrival</span>
    </label>

  </div>
</div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
            >
              {loading
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}