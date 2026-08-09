"use client";

import { useEffect, useMemo, useState } from "react";

import {
  TicketPercent,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Loader2,
  CalendarDays,
  Users,
  Package,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Product {
  productId: string;
  productName: string;
  price?: number;
  salePrice?: number;
  image?: string;
  status?: string;
}

interface CouponProduct {
  id: number;
  product_id: string;
}

interface Coupon {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  minimum_order_amount: number;
  created_at: string;
  updated_at?: string;
  coupon_products?: CouponProduct[];
}

interface CouponForm {
  code: string;
  discountValue: string;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  minimumOrderAmount: string;
  applyToAll: boolean;
  productIds: string[];
}

const emptyForm: CouponForm = {
  code: "",
  discountValue: "",
  isActive: true,
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  minimumOrderAmount: "",
  applyToAll: true,
  productIds: [],
};

function formatMoney(value: number) {
  return `৳${Number(value || 0).toLocaleString(
    "en-US"
  )}`;
}

function formatDate(value: string | null) {
  if (!value) return "No expiry";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCouponStatus(coupon: Coupon) {
  if (!coupon.is_active) {
    return {
      label: "Inactive",
      className:
        "bg-slate-100 text-slate-600",
    };
  }

  const now = new Date();

  if (
    coupon.starts_at &&
    new Date(coupon.starts_at) > now
  ) {
    return {
      label: "Scheduled",
      className:
        "bg-amber-100 text-amber-700",
    };
  }

  if (
    coupon.expires_at &&
    new Date(coupon.expires_at) < now
  ) {
    return {
      label: "Expired",
      className:
        "bg-red-100 text-red-700",
    };
  }

  if (
    coupon.usage_limit !== null &&
    coupon.used_count >= coupon.usage_limit
  ) {
    return {
      label: "Limit Reached",
      className:
        "bg-orange-100 text-orange-700",
    };
  }

  return {
    label: "Active",
    className:
      "bg-emerald-100 text-emerald-700",
  };
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(
    []
  );

  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCoupon, setEditingCoupon] =
    useState<Coupon | null>(null);

  const [form, setForm] =
    useState<CouponForm>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [productSearch, setProductSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        couponsResponse,
        productsResponse,
      ] = await Promise.all([
        fetch("/api/admin/coupons", {
          cache: "no-store",
        }),
        fetch("/api/admin/products", {
          cache: "no-store",
        }),
      ]);

      const couponsData =
        await couponsResponse.json();

      const productsData =
        await productsResponse.json();

      if (!couponsResponse.ok) {
        throw new Error(
          couponsData.error ||
            "Failed to load coupons"
        );
      }

      if (!productsResponse.ok) {
        throw new Error(
          productsData.error ||
            "Failed to load products"
        );
      }

      setCoupons(
        couponsData.coupons || []
      );

      setProducts(
        productsData.products || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCoupon(null);
    setForm(emptyForm);
    setProductSearch("");
    setError("");
    setModalOpen(true);
  }

  function openEditModal(
    coupon: Coupon
  ) {
    const selectedProducts =
      coupon.coupon_products?.map(
        (item) =>
          String(item.product_id)
      ) || [];

    setEditingCoupon(coupon);

    setForm({
      code: coupon.code || "",

      discountValue:
        String(
          coupon.discount_value ?? ""
        ),

      isActive:
        coupon.is_active ?? true,

      startsAt:
        coupon.starts_at
          ? toDateTimeLocal(
              coupon.starts_at
            )
          : "",

      expiresAt:
        coupon.expires_at
          ? toDateTimeLocal(
              coupon.expires_at
            )
          : "",

      usageLimit:
        coupon.usage_limit !==
        null
          ? String(
              coupon.usage_limit
            )
          : "",

      minimumOrderAmount:
        coupon.minimum_order_amount
          ? String(
              coupon.minimum_order_amount
            )
          : "",

      applyToAll:
        selectedProducts.length ===
        0,

      productIds:
        selectedProducts,
    });

    setProductSearch("");
    setError("");
    setModalOpen(true);
  }

  function toDateTimeLocal(
    value: string
  ) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const offset =
      date.getTimezoneOffset();

    const localDate =
      new Date(
        date.getTime() -
          offset * 60 * 1000
      );

    return localDate
      .toISOString()
      .slice(0, 16);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingCoupon(null);
    setForm(emptyForm);
    setProductSearch("");
    setError("");
  }

  function updateForm(
    changes: Partial<CouponForm>
  ) {
    setForm((previous) => ({
      ...previous,
      ...changes,
    }));
  }

  function toggleProduct(
    productId: string
  ) {
    setForm((previous) => {
      const exists =
        previous.productIds.includes(
          productId
        );

      return {
        ...previous,
        productIds: exists
          ? previous.productIds.filter(
              (id) =>
                id !== productId
            )
          : [
              ...previous.productIds,
              productId,
            ],
      };
    });
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    const cleanCode =
      form.code
        .trim()
        .toUpperCase();

    const discount =
      Number(
        form.discountValue
      );

    const minimumOrder =
      Number(
        form.minimumOrderAmount ||
          0
      );

    if (!cleanCode) {
      setError(
        "Please enter a coupon code."
      );
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      setError(
        "Coupon code can contain only letters, numbers, - and _."
      );
      return;
    }

    if (
      !Number.isFinite(discount) ||
      discount <= 0
    ) {
      setError(
        "Please enter a valid discount amount."
      );
      return;
    }

    if (
      !Number.isFinite(
        minimumOrder
      ) ||
      minimumOrder < 0
    ) {
      setError(
        "Please enter a valid minimum order amount."
      );
      return;
    }

    if (
      form.startsAt &&
      form.expiresAt &&
      new Date(
        form.expiresAt
      ) <=
        new Date(
          form.startsAt
        )
    ) {
      setError(
        "Expiry date must be after start date."
      );
      return;
    }

    if (
      !form.applyToAll &&
      form.productIds.length === 0
    ) {
      setError(
        "Please select at least one product."
      );
      return;
    }

    const payload = {
      code: cleanCode,

      discountType: "fixed",

      discountValue: discount,

      isActive:
        form.isActive,

      startsAt:
        form.startsAt
          ? new Date(
              form.startsAt
            ).toISOString()
          : null,

      expiresAt:
        form.expiresAt
          ? new Date(
              form.expiresAt
            ).toISOString()
          : null,

      usageLimit:
        form.usageLimit.trim() ||
        null,

      minimumOrderAmount:
        minimumOrder,

      productIds:
        form.applyToAll
          ? []
          : form.productIds,
    };

    try {
      setSaving(true);

      const response =
        await fetch(
          editingCoupon
            ? `/api/admin/coupons/${editingCoupon.id}`
            : "/api/admin/coupons",
          {
            method:
              editingCoupon
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to save coupon"
        );
      }

      setSuccess(
        editingCoupon
          ? "Coupon updated successfully."
          : "Coupon created successfully."
      );

      await loadData();

      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save coupon"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    coupon: Coupon
  ) {
    const confirmed =
      window.confirm(
        `Delete coupon "${coupon.code}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        coupon.id
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/coupons/${coupon.id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to delete coupon"
        );
      }

      setCoupons(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              coupon.id
          )
      );

      setSuccess(
        "Coupon deleted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete coupon"
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(
    coupon: Coupon
  ) {
    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/coupons/${coupon.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              code: coupon.code,

              discountType:
                "fixed",

              discountValue:
                coupon.discount_value,

              isActive:
                !coupon.is_active,

              startsAt:
                coupon.starts_at,

              expiresAt:
                coupon.expires_at,

              usageLimit:
                coupon.usage_limit,

              minimumOrderAmount:
                coupon.minimum_order_amount,

              productIds:
                coupon.coupon_products?.map(
                  (item) =>
                    String(
                      item.product_id
                    )
                ) || [],
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to update coupon"
        );
      }

      setCoupons(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              coupon.id
                ? {
                    ...item,
                    is_active:
                      !item.is_active,
                  }
                : item
          )
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update coupon"
      );
    }
  }

  const filteredCoupons =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return coupons;
      }

      return coupons.filter(
        (coupon) =>
          coupon.code
            .toLowerCase()
            .includes(query)
      );
    }, [
      coupons,
      search,
    ]);

  const filteredProducts =
    useMemo(() => {
      const query =
        productSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
          product.productName
            .toLowerCase()
            .includes(query) ||
          product.productId
            .toLowerCase()
            .includes(query)
      );
    }, [
      products,
      productSearch,
    ]);

  const activeCount =
    coupons.filter(
      (coupon) =>
        coupon.is_active
    ).length;

  const totalUsed =
    coupons.reduce(
      (sum, coupon) =>
        sum +
        Number(
          coupon.used_count || 0
        ),
      0
    );

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* =========================================
          HEADER
          ========================================= */}

      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <TicketPercent
                size={25}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Coupons
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage promotional discounts
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={
            openCreateModal
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus size={19} />

          Create Coupon
        </button>

      </div>

      {/* =========================================
          ALERTS
          ========================================= */}

      {(error ||
        success) && (
        <div className="mb-6">

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

        </div>
      )}

      {/* =========================================
          SUMMARY CARDS
          ========================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Coupons
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {coupons.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TicketPercent
                size={22}
              />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Coupons
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {activeCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Check size={22} />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Uses
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {totalUsed}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users size={22} />
            </div>

          </div>
        </div>

      </div>

      {/* =========================================
          SEARCH
          ========================================= */}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="relative max-w-md">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search coupon code..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />

        </div>

      </div>

      {/* =========================================
          TABLE
          ========================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">

            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />

              Loading coupons...
            </div>

          </div>
        ) : filteredCoupons.length ===
          0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <TicketPercent
                size={30}
              />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              No coupons found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Create your first coupon to start offering discounts to customers.
            </p>

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />

              Create Coupon
            </button>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Coupon
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Discount
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Products
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Usage
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Expiry
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredCoupons.map(
                  (coupon) => {
                    const status =
                      getCouponStatus(
                        coupon
                      );

                    const selectedCount =
                      coupon
                        .coupon_products
                        ?.length ||
                      0;

                    const usageText =
                      coupon.usage_limit ===
                      null
                        ? `${coupon.used_count} / ∞`
                        : `${coupon.used_count} / ${coupon.usage_limit}`;

                    return (
                      <tr
                        key={
                          coupon.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* Coupon */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <TicketPercent
                                size={19}
                              />
                            </div>

                            <div>
                              <p className="font-bold tracking-wide text-slate-900">
                                {
                                  coupon.code
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Minimum{" "}
                                {formatMoney(
                                  coupon.minimum_order_amount
                                )}
                              </p>
                            </div>

                          </div>

                        </td>

                        {/* Discount */}

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                            -
                            {formatMoney(
                              coupon.discount_value
                            )}
                          </span>

                        </td>

                        {/* Products */}

                        <td className="px-5 py-4">

                          {selectedCount ===
                          0 ? (
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                              <Package
                                size={16}
                              />

                              All Products
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                              <Package
                                size={16}
                              />

                              {selectedCount}{" "}
                              {selectedCount ===
                              1
                                ? "Product"
                                : "Products"}
                            </div>
                          )}

                        </td>

                        {/* Usage */}

                        <td className="px-5 py-4">

                          <div className="text-sm font-semibold text-slate-700">
                            {usageText}
                          </div>

                        </td>

                        {/* Expiry */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2 text-sm text-slate-600">

                            <CalendarDays
                              size={16}
                              className="text-slate-400"
                            />

                            {formatDate(
                              coupon.expires_at
                            )}

                          </div>

                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                          >
                            {
                              status.label
                            }
                          </span>

                        </td>

                        {/* Actions */}

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                toggleActive(
                                  coupon
                                )
                              }
                              title={
                                coupon.is_active
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              className={`rounded-lg p-2 transition ${
                                coupon.is_active
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-slate-400 hover:bg-slate-100"
                              }`}
                            >
                              {coupon.is_active ? (
                                <ToggleRight
                                  size={21}
                                />
                              ) : (
                                <ToggleLeft
                                  size={21}
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  coupon
                                )
                              }
                              title="Edit"
                              className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                            >
                              <Pencil
                                size={18}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  coupon
                                )
                              }
                              disabled={
                                deletingId ===
                                coupon.id
                              }
                              title="Delete"
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId ===
                              coupon.id ? (
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={18}
                                />
                              )}
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =========================================
          CREATE / EDIT MODAL
          ========================================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <TicketPercent
                    size={21}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingCoupon
                      ? "Edit Coupon"
                      : "Create Coupon"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    Configure your promotional discount
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={21} />
              </button>

            </div>

            {/* Modal Body */}

            <div className="overflow-y-auto p-6">

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">

                {/* Coupon Code */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Coupon Code
                  </label>

                  <input
                    value={
                      form.code
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm({
                        code: event
                          .target
                          .value
                          .toUpperCase(),
                      })
                    }
                    placeholder="e.g. BABY20"
                    maxLength={30}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold uppercase tracking-wider outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                {/* Discount */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Discount Amount
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={
                        form.discountValue
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm({
                          discountValue:
                            event
                              .target
                              .value,
                        })
                      }
                      placeholder="20"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Fixed amount discount
                  </p>

                </div>

                {/* Minimum Order */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Minimum Order Amount
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.minimumOrderAmount
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm({
                          minimumOrderAmount:
                            event
                              .target
                              .value,
                        })
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    0 means no minimum
                  </p>

                </div>

                {/* Start Date */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Date
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.startsAt
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm({
                        startsAt:
                          event
                            .target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Leave empty to start immediately
                  </p>

                </div>

                {/* Expiry Date */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Expiry Date
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.expiresAt
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm({
                        expiresAt:
                          event
                            .target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Leave empty for no expiry
                  </p>

                </div>

                {/* Usage Limit */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Usage Limit
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.usageLimit
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm({
                        usageLimit:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Unlimited"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Leave empty for unlimited use
                  </p>

                </div>

                {/* Status */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      updateForm({
                        isActive:
                          !form.isActive,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      form.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >

                    <span>
                      {form.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>

                    {form.isActive ? (
                      <ToggleRight
                        size={23}
                      />
                    ) : (
                      <ToggleLeft
                        size={23}
                      />
                    )}

                  </button>

                </div>

                {/* Apply To */}

                <div className="md:col-span-2">

                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    Apply Coupon To
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">

                    <button
                      type="button"
                      onClick={() =>
                        updateForm({
                          applyToAll:
                            true,
                          productIds:
                            [],
                        })
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        form.applyToAll
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            form.applyToAll
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Package
                            size={19}
                          />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            All Products
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Coupon works across the store
                          </p>
                        </div>

                      </div>

                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm({
                          applyToAll:
                            false,
                        })
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        !form.applyToAll
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            !form.applyToAll
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <TicketPercent
                            size={19}
                          />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            Selected Products
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Choose specific products
                          </p>
                        </div>

                      </div>

                    </button>

                  </div>

                </div>

                {/* Product Selector */}

                {!form.applyToAll && (
                  <div className="md:col-span-2">

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Select Products
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {form.productIds.length} selected
                          </p>
                        </div>

                        <div className="relative sm:w-64">

                          <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            value={
                              productSearch
                            }
                            onChange={(
                              event
                            ) =>
                              setProductSearch(
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Search products..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
                          />

                        </div>

                      </div>

                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">

                        {filteredProducts.length ===
                        0 ? (
                          <div className="py-8 text-center text-sm text-slate-500">
                            No products found.
                          </div>
                        ) : (
                          filteredProducts.map(
                            (
                              product
                            ) => {
                              const selected =
                                form.productIds.includes(
                                  String(
                                    product.productId
                                  )
                                );

                              return (
                                <button
                                  type="button"
                                  key={
                                    product.productId
                                  }
                                  onClick={() =>
                                    toggleProduct(
                                      String(
                                        product.productId
                                      )
                                    )
                                  }
                                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                                    selected
                                      ? "border-blue-300 bg-blue-50"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                  }`}
                                >

                                  <div
                                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
                                      selected
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-slate-300 bg-white"
                                    }`}
                                  >
                                    {selected && (
                                      <Check
                                        size={
                                          14
                                        }
                                      />
                                    )}
                                  </div>

                                  {product.image ? (
                                    <img
                                      src={
                                        product.image
                                      }
                                      alt={
                                        product.productName
                                      }
                                      className="h-10 w-10 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                      <Package
                                        size={
                                          18
                                        }
                                      />
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">

                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {
                                        product.productName
                                      }
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                      ID:{" "}
                                      {
                                        product.productId
                                      }
                                    </p>

                                  </div>

                                </button>
                              );
                            }
                          )
                        )}

                      </div>

                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Check
                      size={18}
                    />

                    {editingCoupon
                      ? "Update Coupon"
                      : "Create Coupon"}
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}