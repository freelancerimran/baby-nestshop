"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AdminProduct,
  ProductVariantForm,
} from "@/types/admin-product";
import ImageUploader from "./ImageUploader";

interface Props {
  onClose: () => void;
}

interface DraftVariant
  extends ProductVariantForm {
  tempId: string;
}

function createEmptyVariant(
  sortOrder: number
): DraftVariant {
  return {
    tempId:
      `${Date.now()}-${Math.random()}`,

    variantName: "",
    sku: "",
    price: null,

    realStock: 0,
    displayStock: 0,

    image: "",

    status: "Active",

    sortOrder,
  };
}

export default function ProductCreateModal({
  onClose,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [
    checkingPermissions,
    setCheckingPermissions,
  ] = useState(true);

  const [
    canManageVariants,
    setCanManageVariants,
  ] = useState(false);

  const [
    canManageStock,
    setCanManageStock,
  ] = useState(false);

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

  const [
    variants,
    setVariants,
  ] = useState<DraftVariant[]>([]);

  /*
  ==============================================
  LOAD PERMISSIONS
  ==============================================
  */

  useEffect(() => {
    let cancelled = false;

    async function loadPermissions() {
      try {
        const [
          variantResponse,
          stockResponse,
        ] = await Promise.all([
          fetch(
            "/api/admin/permissions/check?module=products&action=manage_variants",
            {
              cache: "no-store",
            }
          ),

          fetch(
            "/api/admin/permissions/check?module=products&action=manage_stock",
            {
              cache: "no-store",
            }
          ),
        ]);

        const variantResult =
          await variantResponse.json();

        const stockResult =
          await stockResponse.json();

        if (!cancelled) {
          setCanManageVariants(
            variantResult?.allowed === true
          );

          setCanManageStock(
            stockResult?.allowed === true
          );
        }
      } catch (error) {
        console.error(
          "LOAD PRODUCT PERMISSIONS ERROR:",
          error
        );
      } finally {
        if (!cancelled) {
          setCheckingPermissions(false);
        }
      }
    }

    loadPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  ==============================================
  VARIANT TOTAL STOCK
  ==============================================
  */

  const variantRealStockTotal =
    useMemo(() => {
      return variants.reduce(
        (total, variant) =>
          total +
          Math.max(
            0,
            Number(
              variant.realStock
            ) || 0
          ),
        0
      );
    }, [variants]);

  const variantDisplayStockTotal =
    useMemo(() => {
      return variants.reduce(
        (total, variant) =>
          total +
          Math.max(
            0,
            Number(
              variant.displayStock
            ) || 0
          ),
        0
      );
    }, [variants]);

  /*
  ==============================================
  ADD VARIANT
  ==============================================
  */

  function addVariant() {
    setVariants((current) => [
      ...current,
      createEmptyVariant(
        current.length + 1
      ),
    ]);
  }

  /*
  ==============================================
  UPDATE VARIANT
  ==============================================
  */

  function updateVariant(
    tempId: string,
    changes: Partial<ProductVariantForm>
  ) {
    setVariants((current) =>
      current.map((variant) =>
        variant.tempId === tempId
          ? {
              ...variant,
              ...changes,
            }
          : variant
      )
    );
  }

  /*
  ==============================================
  REMOVE VARIANT
  ==============================================
  */

  function removeVariant(
    tempId: string
  ) {
    setVariants((current) => {
      const next =
        current.filter(
          (variant) =>
            variant.tempId !==
            tempId
        );

      return next.map(
        (variant, index) => ({
          ...variant,
          sortOrder:
            index + 1,
        })
      );
    });
  }

  /*
  ==============================================
  MOVE VARIANT
  ==============================================
  */

  function moveVariant(
    index: number,
    direction: "up" | "down"
  ) {
    setVariants((current) => {
      const targetIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >=
          current.length
      ) {
        return current;
      }

      const next = [
        ...current,
      ];

      const temp =
        next[index];

      next[index] =
        next[targetIndex];

      next[targetIndex] =
        temp;

      return next.map(
        (variant, itemIndex) => ({
          ...variant,
          sortOrder:
            itemIndex + 1,
        })
      );
    });
  }

  /*
  ==============================================
  VALIDATE
  ==============================================
  */

  function validateForm() {
    if (
      !form.productName.trim()
    ) {
      alert(
        "Product Name is required."
      );

      return false;
    }

    if (
      Number(form.price) < 0
    ) {
      alert(
        "Price cannot be negative."
      );

      return false;
    }

    if (
      Number(
        form.regularPrice
      ) < 0
    ) {
      alert(
        "Regular Price cannot be negative."
      );

      return false;
    }

    /*
    ==========================================
    VARIANT VALIDATION
    ==========================================
    */

    const usedSkus =
      new Set<string>();

    for (
      let index = 0;
      index < variants.length;
      index++
    ) {
      const variant =
        variants[index];

      if (
        !variant.variantName.trim()
      ) {
        alert(
          `Variant ${index + 1}: Variant Name is required.`
        );

        return false;
      }

      if (
        Number(
          variant.realStock
        ) < 0 ||
        !Number.isInteger(
          Number(
            variant.realStock
          )
        )
      ) {
        alert(
          `Variant ${index + 1}: Real Stock must be a non-negative integer.`
        );

        return false;
      }

      if (
        Number(
          variant.displayStock
        ) < 0 ||
        !Number.isInteger(
          Number(
            variant.displayStock
          )
        )
      ) {
        alert(
          `Variant ${index + 1}: Display Stock must be a non-negative integer.`
        );

        return false;
      }

      if (
        variant.price !==
          null &&
        variant.price !==
          undefined &&
        Number(
          variant.price
        ) < 0
      ) {
        alert(
          `Variant ${index + 1}: Price cannot be negative.`
        );

        return false;
      }

      const sku =
        variant.sku
          .trim()
          .toUpperCase();

      if (sku) {
        if (
          usedSkus.has(sku)
        ) {
          alert(
            `Duplicate SKU found: ${sku}`
          );

          return false;
        }

        usedSkus.add(sku);
      }
    }

    return true;
  }

  /*
  ==============================================
  SAVE PRODUCT
  ==============================================
  */

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const finalSlug =
        form.slug?.trim()
          ? form.slug.trim()
          : form.productName
              .toLowerCase()
              .trim()
              .replace(
                /[^a-z0-9\s-]/g,
                ""
              )
              .replace(
                /\s+/g,
                "-"
              );

      /*
      ==========================================
      IMPORTANT:
      If variants exist, parent stock is
      automatically calculated from variants.
      ==========================================
      */

      const hasVariants =
        variants.length > 0;

      const finalRealStock =
        hasVariants
          ? variantRealStockTotal
          : Number(
              form.realStock
            ) || 0;

      const finalDisplayStock =
        hasVariants
          ? variantDisplayStockTotal
          : Number(
              form.displayStock
            ) || 0;

      const response =
        await fetch(
          "/api/admin/create-product",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...form,

                slug:
                  finalSlug,

                realStock:
                  finalRealStock,

                displayStock:
                  finalDisplayStock,

                variants:
                  variants.map(
                    (variant) => ({
                      variantName:
                        variant.variantName.trim(),

                      sku:
                        variant.sku
                          .trim()
                          .toUpperCase(),

 price:
  variant.price ===
    null ||
  variant.price ===
    undefined
    ? null
    : Number(
        variant.price
      ),

                      realStock:
                        Number(
                          variant.realStock
                        ) || 0,

                      displayStock:
                        Number(
                          variant.displayStock
                        ) || 0,

                      image:
                        variant.image
                          .trim(),

                      status:
                        variant.status ===
                        "Inactive"
                          ? "Inactive"
                          : "Active",

                      sortOrder:
                        Number(
                          variant.sortOrder
                        ) || 0,
                    })
                  ),
              }),
          }
        );

      const result =
        await response.json();

      if (
        result.success
      ) {
        alert(
          hasVariants
            ? "Product and Variants Created Successfully"
            : "Product Created Successfully"
        );

        window.location.reload();

        return;
      }

      alert(
        result.message ||
          "Create Failed"
      );
    } catch (error) {
      console.error(
        "CREATE PRODUCT ERROR:",
        error
      );

      alert(
        "Create Failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="flex min-h-full items-center justify-center">

        <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

          {/* ======================================
              HEADER
          ====================================== */}

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
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-xl"
            >
              ✕
            </button>

          </div>

          <div className="grid gap-4">

            {/* ====================================
                PRODUCT NAME
            ==================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Product Name
              </label>

              <input
                className="w-full rounded-lg border p-3"
                placeholder="Enter Product Name"
                value={
                  form.productName
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    productName:
                      e.target.value,
                  })
                }
              />
            </div>

            {/* ====================================
                PRICE
            ==================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Price
              </label>

              <input
                className="w-full rounded-lg border p-3"
                type="number"
                min="0"
                placeholder="Enter Price"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price:
                      Number(
                        e.target.value
                      ),
                  })
                }
              />
            </div>

            {/* ====================================
                REGULAR PRICE
            ==================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Regular Price
              </label>

              <input
                className="w-full rounded-lg border p-3"
                type="number"
                min="0"
                placeholder="Enter Regular Price"
                value={
                  form.regularPrice
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

            {/* ====================================
                STOCK
            ==================================== */}

            <div className="rounded-xl border p-4">

              <h3 className="mb-3 font-semibold">
                Product Stock
              </h3>

              {variants.length >
              0 ? (
                <div className="rounded-lg bg-gray-50 p-4">

                  <p className="text-sm text-gray-600">
                    Because this product
                    has variants, total
                    product stock is
                    calculated automatically
                    from variant stock.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <div className="rounded-lg border bg-white p-3">
                      <p className="text-xs text-gray-500">
                        Total Real Stock
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {
                          variantRealStockTotal
                        }
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-3">
                      <p className="text-xs text-gray-500">
                        Total Display Stock
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {
                          variantDisplayStockTotal
                        }
                      </p>
                    </div>

                  </div>

                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Real Stock
                    </label>

                    <input
                      className="w-full rounded-lg border p-3"
                      type="number"
                      min="0"
                      placeholder="Enter Real Stock"
                      value={
                        form.realStock
                      }
                      disabled={
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

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold">
                      Display Stock
                    </label>

                    <input
                      className="w-full rounded-lg border p-3"
                      type="number"
                      min="0"
                      placeholder="Enter Display Stock"
                      value={
                        form.displayStock
                      }
                      disabled={
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

                  {!canManageStock &&
                    !checkingPermissions && (
                      <p className="mt-3 text-sm text-red-600">
                        You do not have
                        permission to
                        manage stock.
                      </p>
                    )}
                </>
              )}

            </div>

            {/* ====================================
                PRODUCT VARIATIONS
            ==================================== */}

            {canManageVariants && (
              <div className="rounded-xl border p-4">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="font-semibold">
                      Product Variations
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Add designs, colors,
                      editions or other
                      product variants.
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Variant Access
                  </span>

                </div>

                {variants.length ===
                0 ? (
                  <div className="mt-4 rounded-lg border border-dashed p-5 text-center">

                    <p className="text-sm text-gray-500">
                      No variants added.
                    </p>

                    <button
                      type="button"
                      onClick={
                        addVariant
                      }
                      className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      + Add Variant
                    </button>

                  </div>
                ) : (
                  <div className="mt-4 space-y-4">

                    {variants.map(
                      (
                        variant,
                        index
                      ) => (
                        <div
                          key={
                            variant.tempId
                          }
                          className="rounded-xl border bg-gray-50 p-4"
                        >

                          <div className="mb-4 flex items-center justify-between">

                            <div>
                              <h4 className="font-semibold">
                                Variant{" "}
                                {index +
                                  1}
                              </h4>

                              <p className="text-xs text-gray-500">
                                Sort Order:{" "}
                                {
                                  variant.sortOrder
                                }
                              </p>
                            </div>

                            <div className="flex items-center gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  moveVariant(
                                    index,
                                    "up"
                                  )
                                }
                                disabled={
                                  index ===
                                  0
                                }
                                className="rounded-md border bg-white px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                ↑
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  moveVariant(
                                    index,
                                    "down"
                                  )
                                }
                                disabled={
                                  index ===
                                  variants.length -
                                    1
                                }
                                className="rounded-md border bg-white px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                ↓
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeVariant(
                                    variant.tempId
                                  )
                                }
                                className="rounded-md border border-red-200 bg-white px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>

                            </div>

                          </div>

                          <div className="grid gap-4 md:grid-cols-2">

                            {/* NAME */}

                            <div>
                              <label className="mb-2 block text-sm font-semibold">
                                Variant Name
                              </label>

                              <input
                                className="w-full rounded-lg border bg-white p-3"
                                placeholder="e.g. SEA"
                                value={
                                  variant.variantName
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateVariant(
                                    variant.tempId,
                                    {
                                      variantName:
                                        e.target.value,
                                    }
                                  )
                                }
                              />
                            </div>

                            {/* SKU */}

                            <div>
                              <label className="mb-2 block text-sm font-semibold">
                                SKU
                              </label>

                              <input
                                className="w-full rounded-lg border bg-white p-3"
                                placeholder="e.g. SEA-1"
                                value={
                                  variant.sku
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateVariant(
                                    variant.tempId,
                                    {
                                      sku:
                                        e.target.value.toUpperCase(),
                                    }
                                  )
                                }
                              />
                            </div>

                            {/* PRICE */}

                            <div>
                              <label className="mb-2 block text-sm font-semibold">
                                Variant Price
                              </label>

                              <input
                                className="w-full rounded-lg border bg-white p-3"
                                type="number"
                                min="0"
                                placeholder="Leave empty to use parent price"
                                value={
                                  variant.price ??
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateVariant(
                                    variant.tempId,
                                    {
                                      price:
                                        e.target.value ===
                                        ""
                                          ? null
                                          : Number(
                                              e.target.value
                                            ),
                                    }
                                  )
                                }
                              />

                              <p className="mt-1 text-xs text-gray-500">
                                Empty = use
                                parent product
                                price.
                              </p>
                            </div>

                            {/* STATUS */}

                            <div>
                              <label className="mb-2 block text-sm font-semibold">
                                Status
                              </label>

                              <select
                                className="w-full rounded-lg border bg-white p-3"
                                value={
                                  variant.status
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateVariant(
                                    variant.tempId,
                                    {
                                      status:
                                        e.target.value,
                                    }
                                  )
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

                            {/* REAL STOCK */}

                            <div>
                              <label className="mb-2 block text-sm font-semibold">
                                Real Stock
                              </label>

                              <input
                                className="w-full rounded-lg border bg-white p-3"
                                type="number"
                                min="0"
                                value={
                                  variant.realStock
                                }
                                disabled={
                                  !canManageStock
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateVariant(
                                    variant.tempId,
                                    {
                                      realStock:
                                        Number(
                                          e.target.value
                                        ),
                                    }
                                  )
                                }
                              />
                            </div>

                            {/* DISPLAY STOCK */}

                            <div>
                              <label className="mb-2 block text-sm font-semibold">
                                Display Stock
                              </label>

                              <input
                                className="w-full rounded-lg border bg-white p-3"
                                type="number"
                                min="0"
                                value={
                                  variant.displayStock
                                }
                                disabled={
                                  !canManageStock
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateVariant(
                                    variant.tempId,
                                    {
                                      displayStock:
                                        Number(
                                          e.target.value
                                        ),
                                    }
                                  )
                                }
                              />
                            </div>

                            {/* SORT ORDER */}

                            <div>
                              <label className="mb-2 block text-sm font-semibold">
                                Sort Order
                              </label>

                              <input
                                className="w-full rounded-lg border bg-white p-3"
                                type="number"
                                min="1"
                                value={
                                  variant.sortOrder
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateVariant(
                                    variant.tempId,
                                    {
                                      sortOrder:
                                        Math.max(
                                          1,
                                          Number(
                                            e.target.value
                                          ) || 1
                                        ),
                                    }
                                  )
                                }
                              />
                            </div>

                          </div>

                          {/* IMAGE */}

                          <div className="mt-4">

                            <ImageUploader
                              label="Variant Image"
                              value={
                                variant.image
                              }
                              onChange={(
                                url
                              ) =>
                                updateVariant(
                                  variant.tempId,
                                  {
                                    image:
                                      url,
                                  }
                                )
                              }
                            />

                          </div>

                        </div>
                      )
                    )}

                    <button
                      type="button"
                      onClick={
                        addVariant
                      }
                      className="w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm font-semibold hover:bg-gray-50"
                    >
                      + Add Another Variant
                    </button>

                    <div className="grid grid-cols-2 gap-3">

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Total Real Stock
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {
                            variantRealStockTotal
                          }
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Total Display Stock
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {
                            variantDisplayStockTotal
                          }
                        </p>
                      </div>

                    </div>

                  </div>
                )}

                {!canManageStock &&
                  variants.length >
                    0 && (
                    <p className="mt-3 text-sm text-red-600">
                      You can create variants,
                      but you do not have
                      permission to manage
                      variant stock.
                    </p>
                  )}

              </div>
            )}

            {/* ====================================
                SLUG
            ==================================== */}

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

            {/* ====================================
                IMAGES
            ==================================== */}

            <ImageUploader
              label="Main Image"
              value={
                form.image
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  image: url,
                })
              }
            />

            <ImageUploader
              label="Gallery Image 1"
              value={
                form.galleryImage1 ||
                ""
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  galleryImage1:
                    url,
                })
              }
            />

            <ImageUploader
              label="Gallery Image 2"
              value={
                form.galleryImage2 ||
                ""
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  galleryImage2:
                    url,
                })
              }
            />

            <ImageUploader
              label="Gallery Image 3"
              value={
                form.galleryImage3 ||
                ""
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  galleryImage3:
                    url,
                })
              }
            />

            <ImageUploader
              label="Gallery Image 4"
              value={
                form.galleryImage4 ||
                ""
              }
              onChange={(url) =>
                setForm({
                  ...form,
                  galleryImage4:
                    url,
                })
              }
            />

            {/* ====================================
                DESCRIPTION
            ==================================== */}

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

            {/* ====================================
                STATUS
            ==================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Status
              </label>

              <select
                className="w-full rounded-lg border p-3"
                value={
                  form.status
                }
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

            {/* ====================================
                LABELS
            ==================================== */}

            <div className="rounded-xl border p-4">

              <h3 className="mb-4 font-semibold">
                Product Labels
              </h3>

              <div className="space-y-3">

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

            {/* ====================================
                CREATE
            ==================================== */}

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                loading ||
                checkingPermissions
              }
              className="rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating..."
                : checkingPermissions
                  ? "Checking Access..."
                  : variants.length >
                      0
                    ? "Create Product & Variants"
                    : "Create Product"}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}