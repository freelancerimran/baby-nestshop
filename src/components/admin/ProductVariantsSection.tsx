"use client";

import { useEffect, useState } from "react";

import type {
  AdminProductVariant,
  ProductVariantForm,
} from "@/types/admin-product";

import ImageUploader from "./ImageUploader";

interface Props {
  productId: string;
}

const emptyForm: ProductVariantForm = {
  variantName: "",
  sku: "",
  price: null,
  realStock: 0,
  displayStock: 0,
  image: "",
  status: "Active",
  sortOrder: 0,
};

function normalizeVariant(
  value: Record<string, unknown>,
  productId: string
): AdminProductVariant {
  return {
    id: Number(value.id ?? 0),

    productId: String(
      value.productId ??
        value.product_id ??
        productId
    ),

    variantName: String(
      value.variantName ??
        value.variant_name ??
        ""
    ),

    sku:
      value.sku === null ||
      value.sku === undefined
        ? null
        : String(value.sku),

    price:
      value.price === null ||
      value.price === undefined
        ? null
        : Number(value.price),

    realStock: Number(
      value.realStock ??
        value.real_stock ??
        0
    ),

    displayStock: Number(
      value.displayStock ??
        value.display_stock ??
        0
    ),

    image:
      value.image === null ||
      value.image === undefined
        ? null
        : String(value.image),

    status: String(
      value.status ?? "Active"
    ),

    sortOrder: Number(
      value.sortOrder ??
        value.sort_order ??
        0
    ),

    createdAt: String(
      value.createdAt ??
        value.created_at ??
        ""
    ),

    updatedAt: String(
      value.updatedAt ??
        value.updated_at ??
        ""
    ),
  };
}

export default function ProductVariantsSection({
  productId,
}: Props) {
  const [variants, setVariants] =
    useState<AdminProductVariant[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [movingId, setMovingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    canManageVariants,
    setCanManageVariants,
  ] = useState(false);

  const [
    canManageStock,
    setCanManageStock,
  ] = useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingVariant,
    setEditingVariant,
  ] =
    useState<AdminProductVariant | null>(
      null
    );

  const [form, setForm] =
    useState<ProductVariantForm>(
      emptyForm
    );

  /*
  ==================================================
  CHECK PERMISSIONS
  ==================================================
  */

  useEffect(() => {
    let cancelled = false;

    async function checkPermissions() {
      try {
        const [
          variantsResponse,
          stockResponse,
        ] = await Promise.all([
          fetch(
            "/api/admin/permissions/check?module=products&action=manage_variants",
            {
              method: "GET",
              cache: "no-store",
            }
          ),

          fetch(
            "/api/admin/permissions/check?module=products&action=manage_stock",
            {
              method: "GET",
              cache: "no-store",
            }
          ),
        ]);

        const variantsResult =
          await variantsResponse.json();

        const stockResult =
          await stockResponse.json();

        if (cancelled) {
          return;
        }

        setCanManageVariants(
          variantsResponse.ok &&
            variantsResult?.success ===
              true &&
            variantsResult?.allowed ===
              true
        );

        setCanManageStock(
          stockResponse.ok &&
            stockResult?.success === true &&
            stockResult?.allowed === true
        );
      } catch (error) {
        console.error(
          "Variant permission check failed:",
          error
        );

        if (!cancelled) {
          setCanManageVariants(false);
          setCanManageStock(false);
        }
      }
    }

    checkPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  ==================================================
  LOAD VARIANTS
  ==================================================
  */

  async function loadVariants() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(
          productId
        )}/variants`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        result?.success !== true
      ) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Failed to load variants."
        );
      }

      const rows = Array.isArray(
        result?.variants
      )
        ? result.variants
        : [];

      const normalized = rows
        .map(
          (
            item: Record<
              string,
              unknown
            >
          ) =>
            normalizeVariant(
              item,
              productId
            )
        )
        .sort(
          (
            a: AdminProductVariant,
            b: AdminProductVariant
          ) => {
            if (
              a.sortOrder !==
              b.sortOrder
            ) {
              return (
                a.sortOrder -
                b.sortOrder
              );
            }

            return a.id - b.id;
          }
        );

      setVariants(normalized);
    } catch (error) {
      console.error(
        "Load variants failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load variants."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVariants();
  }, [productId]);

  /*
  ==================================================
  OPEN ADD
  ==================================================
  */

  function openAddForm() {
    setError("");
    setSuccess("");

    setEditingVariant(null);

    const nextOrder =
      variants.length === 0
        ? 1
        : Math.max(
            ...variants.map(
              (variant) =>
                variant.sortOrder
            )
          ) + 1;

    setForm({
      ...emptyForm,
      sortOrder: nextOrder,
    });

    setShowForm(true);
  }

  /*
  ==================================================
  OPEN EDIT
  ==================================================
  */

  function openEditForm(
    variant: AdminProductVariant
  ) {
    setError("");
    setSuccess("");

    setEditingVariant(variant);

    setForm({
      variantName:
        variant.variantName,

      sku:
        variant.sku ?? "",

      price:
        variant.price,

      realStock:
        variant.realStock,

      displayStock:
        variant.displayStock,

      image:
        variant.image ?? "",

      status:
        variant.status,

      sortOrder:
        variant.sortOrder,
    });

    setShowForm(true);
  }

  /*
  ==================================================
  CLOSE FORM
  ==================================================
  */

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingVariant(null);
    setForm(emptyForm);
  }

  /*
  ==================================================
  SAVE VARIANT
  ==================================================
  */

  async function handleSave() {
    setError("");
    setSuccess("");

    const variantName =
      form.variantName.trim();

    const sku =
      form.sku.trim();

    if (!variantName) {
      setError(
        "Variant name is required."
      );
      return;
    }

    if (
      form.realStock < 0 ||
      form.displayStock < 0
    ) {
      setError(
        "Stock cannot be negative."
      );
      return;
    }

    if (form.sortOrder < 0) {
      setError(
        "Sort Order cannot be negative."
      );
      return;
    }

    if (
      !canManageStock &&
      editingVariant &&
      (
        form.realStock !==
          editingVariant.realStock ||
        form.displayStock !==
          editingVariant.displayStock
      )
    ) {
      setError(
        "You do not have permission to change variant stock."
      );
      return;
    }

    if (
      !canManageStock &&
      !editingVariant &&
      (
        form.realStock !== 0 ||
        form.displayStock !== 0
      )
    ) {
      setError(
        "You do not have permission to set variant stock."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        variantName,

        sku:
          sku || null,

        price:
          form.price === null
            ? null
            : Number(form.price),

        realStock:
          Number(
            form.realStock
          ),

        displayStock:
          Number(
            form.displayStock
          ),

        image:
          form.image.trim() ||
          null,

        status:
          form.status,

        sortOrder:
          Number(
            form.sortOrder
          ),
      };

      const url =
        editingVariant
          ? `/api/admin/products/${encodeURIComponent(
              productId
            )}/variants/${
              editingVariant.id
            }`
          : `/api/admin/products/${encodeURIComponent(
              productId
            )}/variants`;

      const response = await fetch(
        url,
        {
          method:
            editingVariant
              ? "PATCH"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        result?.success !== true
      ) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Failed to save variant."
        );
      }

      setSuccess(
        editingVariant
          ? "Variant updated successfully."
          : "Variant created successfully."
      );

      setShowForm(false);
      setEditingVariant(null);
      setForm(emptyForm);

      await loadVariants();
    } catch (error) {
      console.error(
        "Save variant failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save variant."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  ==================================================
  TOGGLE STATUS
  ==================================================
  */

  async function toggleStatus(
    variant: AdminProductVariant
  ) {
    setError("");
    setSuccess("");

    const nextStatus =
      variant.status ===
      "Active"
        ? "Inactive"
        : "Active";

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(
          productId
        )}/variants/${variant.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              status:
                nextStatus,
            }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        result?.success !== true
      ) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Failed to update variant status."
        );
      }

      setSuccess(
        nextStatus === "Active"
          ? "Variant activated successfully."
          : "Variant deactivated successfully."
      );

      await loadVariants();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update variant status."
      );
    }
  }

  /*
  ==================================================
  DELETE VARIANT
  ==================================================
  */

  async function handleDelete(
    variant: AdminProductVariant
  ) {
    const confirmed =
      window.confirm(
        `Delete "${variant.variantName}"?\n\nIf this variant has already been used in an order, it will be deactivated instead of permanently deleted.`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(
          productId
        )}/variants/${variant.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        result?.success !== true
      ) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Failed to delete variant."
        );
      }

      if (
        result?.action ===
        "deactivated"
      ) {
        setSuccess(
          "Variant was already used in an order, so it was deactivated instead of deleted."
        );
      } else {
        setSuccess(
          "Variant deleted successfully."
        );
      }

      await loadVariants();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete variant."
      );
    }
  }

  /*
  ==================================================
  MOVE VARIANT UP / DOWN
  ==================================================
  */

  async function moveVariant(
    index: number,
    direction: "up" | "down"
  ) {
    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        variants.length
    ) {
      return;
    }

    const current =
      variants[index];

    const target =
      variants[targetIndex];

    setError("");
    setSuccess("");
    setMovingId(
      current.id
    );

    try {
      /*
       * Swap the two sort orders.
       */

      const currentOrder =
        current.sortOrder;

      const targetOrder =
        target.sortOrder;

      /*
       * If both somehow have the
       * same Sort Order, create
       * clean sequential values.
       */

      const newCurrentOrder =
        currentOrder ===
        targetOrder
          ? targetIndex + 1
          : targetOrder;

      const newTargetOrder =
        currentOrder ===
        targetOrder
          ? index + 1
          : currentOrder;

      const [
        currentResponse,
        targetResponse,
      ] = await Promise.all([
        fetch(
          `/api/admin/products/${encodeURIComponent(
            productId
          )}/variants/${current.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                sortOrder:
                  newCurrentOrder,
              }),
          }
        ),

        fetch(
          `/api/admin/products/${encodeURIComponent(
            productId
          )}/variants/${target.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                sortOrder:
                  newTargetOrder,
              }),
          }
        ),
      ]);

      const currentResult =
        await currentResponse.json();

      const targetResult =
        await targetResponse.json();

      if (
        !currentResponse.ok ||
        currentResult?.success !==
          true ||
        !targetResponse.ok ||
        targetResult?.success !==
          true
      ) {
        throw new Error(
          currentResult?.message ||
            currentResult?.error ||
            targetResult?.message ||
            targetResult?.error ||
            "Failed to reorder variants."
        );
      }

      setSuccess(
        `Variant moved ${
          direction === "up"
            ? "up"
            : "down"
        }.`
      );

      await loadVariants();
    } catch (error) {
      console.error(
        "Move variant failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to reorder variants."
      );
    } finally {
      setMovingId(null);
    }
  }

  /*
  ==================================================
  PERMISSION GUARD
  ==================================================
  */

  if (
    !loading &&
    !canManageVariants
  ) {
    return null;
  }

  /*
  ==================================================
  UI
  ==================================================
  */

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

      {/* HEADER */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Product Variations
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Manage variants,
            images, SKU, pricing,
            stock and display
            order.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          + Add Variant
        </button>

      </div>


      {/* PERMISSIONS */}

      <div className="mb-4 flex flex-wrap gap-2">

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          ✓ Variant Access
        </span>

        {canManageStock ? (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            ✓ Stock Access
          </span>
        ) : (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            🔒 Stock Restricted
          </span>
        )}

      </div>


      {/* ERROR */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* SUCCESS */}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}


      {/* ========================================
          ADD / EDIT FORM
      ======================================== */}

      {showForm && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h4 className="font-semibold text-gray-900">
                {editingVariant
                  ? "Edit Variant"
                  : "Add Variant"}
              </h4>

              <p className="mt-1 text-xs text-gray-500">
                {editingVariant
                  ? "Update this product variant."
                  : "Create a new product variant."}
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="text-xl text-gray-400 hover:text-gray-900"
            >
              ✕
            </button>

          </div>


          <div className="grid gap-4 md:grid-cols-2">

            {/* VARIANT NAME */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Variant Name *
              </label>

              <input
                type="text"
                value={
                  form.variantName
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    variantName:
                      e.target.value,
                  })
                }
                placeholder="Example: Sea"
                className="w-full rounded-lg border p-3 outline-none focus:border-gray-900"
              />
            </div>


            {/* SKU */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                SKU
              </label>

              <input
                type="text"
                value={form.sku}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sku:
                      e.target.value,
                  })
                }
                placeholder="Example: SEA-1"
                className="w-full rounded-lg border p-3 uppercase outline-none focus:border-gray-900"
              />

              <p className="mt-1 text-xs text-gray-500">
                SKU must be globally unique.
              </p>
            </div>


            {/* PRICE */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Variant Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.price === null
                    ? ""
                    : form.price
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    price:
                      e.target.value ===
                      ""
                        ? null
                        : Number(
                            e.target.value
                          ),
                  })
                }
                placeholder="Leave empty for parent price"
                className="w-full rounded-lg border p-3 outline-none focus:border-gray-900"
              />

              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use
                the main product price.
              </p>
            </div>


            {/* SORT ORDER */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Sort Order
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  form.sortOrder
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    sortOrder:
                      Math.max(
                        0,
                        Number(
                          e.target.value
                        )
                      ),
                  })
                }
                className="w-full rounded-lg border p-3 outline-none focus:border-gray-900"
              />

              <p className="mt-1 text-xs text-gray-500">
                Lower number shows
                first. You can also
                use ↑ / ↓ after saving.
              </p>
            </div>


            {/* REAL STOCK */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Real Stock
              </label>

              <input
                type="number"
                min="0"
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
                      Math.max(
                        0,
                        Number(
                          e.target.value
                        )
                      ),
                  })
                }
                className={`w-full rounded-lg border p-3 ${
                  canManageStock
                    ? ""
                    : "cursor-not-allowed bg-gray-100 text-gray-500"
                }`}
              />
            </div>


            {/* DISPLAY STOCK */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Display Stock
              </label>

              <input
                type="number"
                min="0"
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
                      Math.max(
                        0,
                        Number(
                          e.target.value
                        )
                      ),
                  })
                }
                className={`w-full rounded-lg border p-3 ${
                  canManageStock
                    ? ""
                    : "cursor-not-allowed bg-gray-100 text-gray-500"
                }`}
              />
            </div>


            {/* STATUS */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Status
              </label>

              <select
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
                className="w-full rounded-lg border p-3"
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>

          </div>


          {/* ========================================
              VARIANT IMAGE
          ======================================== */}

          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">

            <div className="mb-3">

              <h5 className="text-sm font-semibold text-gray-900">
                Variant Image
              </h5>

              <p className="mt-1 text-xs text-gray-500">
                Upload an image
                from your computer
                for this specific
                variant.
              </p>

            </div>


            <ImageUploader
              label="Choose Variant Image"
              value={form.image}
              onChange={(url) =>
                setForm({
                  ...form,
                  image: url,
                })
              }
            />


            {form.image && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">

                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Remove variant
                    image
                  </p>

                  <p className="mt-1 text-xs text-red-500">
                    This variant will
                    use no custom
                    image.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      image: "",
                    })
                  }
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Remove Image
                </button>

              </div>
            )}

          </div>


          {!canManageStock && (
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
              You can manage
              variants, but you do
              not have permission to
              change variant stock.
            </div>
          )}


          {/* FORM ACTIONS */}

          <div className="mt-5 flex justify-end gap-3">

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingVariant
                ? "Update Variant"
                : "Create Variant"}
            </button>

          </div>

        </div>
      )}


      {/* ========================================
          VARIANT LIST
      ======================================== */}

      {loading ? (
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-500">
          Loading variants...
        </div>
      ) : variants.length ===
        0 ? (
        <div className="rounded-lg border border-dashed bg-white p-6 text-center">

          <div className="text-2xl">
            🎨
          </div>

          <p className="mt-2 font-semibold text-gray-900">
            No variants yet
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Add color, design,
            size or style variants
            for this product.
          </p>

          <button
            type="button"
            onClick={openAddForm}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            + Add First Variant
          </button>

        </div>
      ) : (
        <div className="space-y-3">

          {variants.map(
            (
              variant,
              index
            ) => (
              <div
                key={variant.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  {/* LEFT */}

                  <div className="flex min-w-0 items-center gap-3">

                    {variant.image ? (
                      <img
                        src={
                          variant.image
                        }
                        alt={
                          variant.variantName
                        }
                        className="h-16 w-16 shrink-0 rounded-xl border object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                        🎨
                      </div>
                    )}


                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="font-semibold text-gray-900">
                          {
                            variant.variantName
                          }
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            variant.status ===
                            "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {
                            variant.status
                          }
                        </span>

                      </div>


                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">

                        <span>
                          SKU:{" "}
                          <strong className="text-gray-700">
                            {variant.sku ||
                              "—"}
                          </strong>
                        </span>

                        <span>
                          Price:{" "}
                          <strong className="text-gray-700">
                            {variant.price !==
                            null
                              ? `৳${Number(
                                  variant.price
                                ).toLocaleString(
                                  "en-BD"
                                )}`
                              : "Parent Price"}
                          </strong>
                        </span>

                        <span>
                          Real:{" "}
                          <strong className="text-gray-700">
                            {
                              variant.realStock
                            }
                          </strong>
                        </span>

                        <span>
                          Display:{" "}
                          <strong className="text-gray-700">
                            {
                              variant.displayStock
                            }
                          </strong>
                        </span>

                        <span>
                          Order:{" "}
                          <strong className="text-gray-700">
                            {
                              variant.sortOrder
                            }
                          </strong>
                        </span>

                      </div>

                    </div>

                  </div>


                  {/* ACTIONS */}

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">

                    {/* MOVE UP */}

                    <button
                      type="button"
                      title="Move Up"
                      disabled={
                        index === 0 ||
                        movingId !== null
                      }
                      onClick={() =>
                        moveVariant(
                          index,
                          "up"
                        )
                      }
                      className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑ Up
                    </button>


                    {/* MOVE DOWN */}

                    <button
                      type="button"
                      title="Move Down"
                      disabled={
                        index ===
                          variants.length -
                            1 ||
                        movingId !== null
                      }
                      onClick={() =>
                        moveVariant(
                          index,
                          "down"
                        )
                      }
                      className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓ Down
                    </button>


                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(
                          variant
                        )
                      }
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Edit
                    </button>


                    {/* STATUS */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleStatus(
                          variant
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        variant.status ===
                        "Active"
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {variant.status ===
                      "Active"
                        ? "Disable"
                        : "Activate"}
                    </button>


                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          variant
                        )
                      }
                      className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}