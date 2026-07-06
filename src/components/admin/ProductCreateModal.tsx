"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminProduct } from "@/types/admin-product";
import ImageUploader from "./ImageUploader";

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
      regularPrice: 0,
      slug: "",
      description: "",
      image: "",

      galleryImage1: "",
      galleryImage2: "",
      galleryImage3: "",
      galleryImage4: "",
      featured: false,
      bestSeller: false,
      newArrival: false,
    });

async function handleSave() {
  try {
    setLoading(true);

    const finalSlug =
      form.slug?.trim()
        ? form.slug
        : form.productName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");

    const response = await fetch(
      "/api/admin/create-product",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          ...form,
          slug: finalSlug,
        }),
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="flex min-h-full items-center justify-center">

        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

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
                Regular Price
              </label>

              <input
                className="w-full rounded-lg border p-3"
                type="number"
                placeholder="Enter Regular Price"
                value={form.regularPrice}
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
                placeholder="Leave empty for auto slug"
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug:
                      e.target.value,
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
                ? "Creating..."
                : "Create Product"}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}