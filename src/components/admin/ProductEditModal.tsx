"use client";

import { useEffect, useState } from "react";
import { AdminProduct } from "@/types/admin-product";
import ImageUploader from "./ImageUploader";
import ProductVariantsSection from "./ProductVariantsSection";

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

  const [checkingPermission, setCheckingPermission] =
    useState(true);

  const [canManageStock, setCanManageStock] =
    useState(false);

  /*
  ==================================================
  CHECK STOCK MANAGEMENT PERMISSION
  ==================================================
  */

  useEffect(() => {
    async function checkStockPermission() {
      try {
        const response = await fetch(
          "/api/admin/permissions/check?module=products&action=manage_stock",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (
          response.ok &&
          result.success
        ) {
          setCanManageStock(
            result.allowed === true
          );
        } else {
          setCanManageStock(false);
        }
      } catch (error) {
        console.error(
          "Stock permission check failed:",
          error
        );

        setCanManageStock(false);
      } finally {
        setCheckingPermission(false);
      }
    }

    checkStockPermission();
  }, []);

  /*
  ==================================================
  SAVE PRODUCT
  ==================================================
  */

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

  /*
  ==================================================
  RENDER
  ==================================================
  */

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">

      <div className="flex min-h-full items-center justify-center">

        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

          {/* ========================================
              HEADER
          ======================================== */}

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
              type="button"
              onClick={onClose}
              className="text-xl"
            >
              ✕
            </button>

          </div>


          <div className="grid gap-4">

            {/* ========================================
                PRODUCT NAME
            ======================================== */}

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


            {/* ========================================
                PRICE
            ======================================== */}

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


            {/* ========================================
                REGULAR PRICE
            ======================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Regular Price
              </label>

              <input
                className="w-full rounded-lg border p-3"
                type="number"
                placeholder="Enter Regular Price"
                value={
                  form.regularPrice ?? 0
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    regularPrice:
                      Number(
                        e.target.value
                      ),
                  })
                }
              />
            </div>


            {/* ========================================
                STOCK MANAGEMENT
            ======================================== */}

            <div
              className={`rounded-xl border p-4 ${
                canManageStock
                  ? "border-blue-200 bg-blue-50/30"
                  : "border-gray-200 bg-gray-50"
              }`}
            >

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h3 className="font-semibold">
                    Stock Management
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Manage real inventory and
                    customer-facing stock.
                  </p>
                </div>

                {!checkingPermission &&
                  !canManageStock && (
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
                      🔒 No Permission
                    </span>
                  )}

                {!checkingPermission &&
                  canManageStock && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      ✓ Stock Access
                    </span>
                  )}

              </div>


              {/* REAL STOCK */}

              <div className="mb-4">

                <label className="mb-2 block text-sm font-semibold">
                  Real Stock
                </label>

                <input
                  className={`w-full rounded-lg border p-3 ${
                    !canManageStock ||
                    checkingPermission
                      ? "cursor-not-allowed bg-gray-100 text-gray-500"
                      : ""
                  }`}
                  type="number"
                  min="0"
                  placeholder="Enter Real Stock"
                  value={form.realStock}
                  disabled={
                    checkingPermission ||
                    !canManageStock
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      realStock:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                />

              </div>


              {/* DISPLAY STOCK */}

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Display Stock
                </label>

                <input
                  className={`w-full rounded-lg border p-3 ${
                    !canManageStock ||
                    checkingPermission
                      ? "cursor-not-allowed bg-gray-100 text-gray-500"
                      : ""
                  }`}
                  type="number"
                  min="0"
                  placeholder="Enter Display Stock"
                  value={
                    form.displayStock
                  }
                  disabled={
                    checkingPermission ||
                    !canManageStock
                  }
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


              {!checkingPermission &&
                !canManageStock && (
                  <p className="mt-3 text-xs text-gray-500">
                    You can edit product
                    information, but you do not
                    have permission to change
                    stock.
                  </p>
                )}

            </div>


            {/* ========================================
                SLUG
            ======================================== */}

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


            {/* ========================================
                MAIN IMAGE
            ======================================== */}

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


            {/* ========================================
                GALLERY IMAGE 1
            ======================================== */}

            <ImageUploader
              label="Gallery Image 1"
              value={
                form.galleryImage1 || ""
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  galleryImage1: url,
                })
              }
            />


            {/* ========================================
                GALLERY IMAGE 2
            ======================================== */}

            <ImageUploader
              label="Gallery Image 2"
              value={
                form.galleryImage2 || ""
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  galleryImage2: url,
                })
              }
            />


            {/* ========================================
                GALLERY IMAGE 3
            ======================================== */}

            <ImageUploader
              label="Gallery Image 3"
              value={
                form.galleryImage3 || ""
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  galleryImage3: url,
                })
              }
            />


            {/* ========================================
                GALLERY IMAGE 4
            ======================================== */}

            <ImageUploader
              label="Gallery Image 4"
              value={
                form.galleryImage4 || ""
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  galleryImage4: url,
                })
              }
            />


            {/* ========================================
                DESCRIPTION
            ======================================== */}

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>

              <textarea
                rows={4}
                className="w-full rounded-lg border p-3"
                placeholder="Enter Description"
                value={
                  form.description
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
              />

            </div>


            {/* ========================================
                STATUS
            ======================================== */}

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


            {/* ========================================
                PRODUCT LABELS
            ======================================== */}

            <div className="rounded-xl border p-4">

              <h3 className="mb-4 font-semibold">
                Product Labels
              </h3>

              <div className="space-y-3">

                {/* FEATURED */}

                <label className="flex items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      form.featured ||
                      false
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        featured:
                          e.target.checked,
                      })
                    }
                  />

                  <span>
                    Featured Product
                  </span>

                </label>


                {/* BEST SELLER */}

                <label className="flex items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      form.bestSeller ||
                      false
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bestSeller:
                          e.target.checked,
                      })
                    }
                  />

                  <span>
                    Best Seller
                  </span>

                </label>


                {/* NEW ARRIVAL */}

                <label className="flex items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      form.newArrival ||
                      false
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        newArrival:
                          e.target.checked,
                      })
                    }
                  />

                  <span>
                    New Arrival
                  </span>

                </label>

              </div>

            </div>


            {/* ========================================
                PRODUCT VARIATIONS
            ======================================== */}

            <ProductVariantsSection
              productId={
                product.productId
              }
            />


            {/* ========================================
                SAVE BUTTON
            ======================================== */}

            <button
              type="button"
              onClick={handleSave}
              disabled={
                loading ||
                checkingPermission
              }
              className="rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : checkingPermission
                ? "Checking Permission..."
                : "Save Changes"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}