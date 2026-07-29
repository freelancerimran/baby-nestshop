"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Package,
  Calculator,
  Loader2,
} from "lucide-react";

type Product = {
  id?: number | string;
  productId?: number | string;
  product_id?: number | string;

  productName?: string;
  product_name?: string;
  name?: string;

  // Current website selling / offer price
  price?: number | string;

  // Regular crossed-out price
  regularPrice?: number | string;
  regular_price?: number | string;
};

type InvestmentItem = {
  productId: string;
  productName: string;

  quantity: string;
  unitCost: string;

  regularPrice: string;
  websitePrice: string;

  // This is the price Finance calculations will use
  sellingPrice: string;
};

interface CreateInvestmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

const createEmptyItem = (): InvestmentItem => ({
  productId: "",
  productName: "",
  quantity: "1",
  unitCost: "",
  regularPrice: "",
  websitePrice: "",
  sellingPrice: "",
});

const money = (value: number) =>
  `৳${Number(value || 0).toLocaleString("en-GB", {
    maximumFractionDigits: 2,
  })}`;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const readOnlyInputClass =
  "w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-3 text-sm font-medium text-slate-600 outline-none";

export default function CreateInvestmentModal({
  open,
  onClose,
  onSuccess,
}: CreateInvestmentModalProps) {
  const [investmentName, setInvestmentName] = useState("");

  const [investmentDate, setInvestmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [supplier, setSupplier] = useState("");

  const [shippingCost, setShippingCost] = useState("");
  const [customsCost, setCustomsCost] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [otherCost, setOtherCost] = useState("");

  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<InvestmentItem[]>([
    createEmptyItem(),
  ]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  useEffect(() => {
    if (!open) return;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await fetch("/api/admin/products", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.error || "Could not load products."
          );
        }

        setProducts(
          Array.isArray(data?.products) ? data.products : []
        );
      } catch (err) {
        console.error("Finance product load error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Could not load products."
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [open]);

  // =========================================================
  // CALCULATIONS
  // =========================================================

  const calculations = useMemo(() => {
    const productCost = items.reduce((sum, item) => {
      return (
        sum +
        Number(item.quantity || 0) *
          Number(item.unitCost || 0)
      );
    }, 0);

    const potentialRevenue = items.reduce((sum, item) => {
      return (
        sum +
        Number(item.quantity || 0) *
          Number(item.sellingPrice || 0)
      );
    }, 0);

    const extraCosts =
      Number(shippingCost || 0) +
      Number(customsCost || 0) +
      Number(packagingCost || 0) +
      Number(otherCost || 0);

    const totalInvestment = productCost + extraCosts;

    const potentialProfit =
      potentialRevenue - totalInvestment;

    const roi =
      totalInvestment > 0
        ? (potentialProfit / totalInvestment) * 100
        : 0;

    const totalUnits = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    return {
      productCost,
      extraCosts,
      totalInvestment,
      potentialRevenue,
      potentialProfit,
      roi,
      totalUnits,
    };
  }, [
    items,
    shippingCost,
    customsCost,
    packagingCost,
    otherCost,
  ]);

  // =========================================================
  // ITEM UPDATE
  // =========================================================

  const updateItem = (
    index: number,
    field: keyof InvestmentItem,
    value: string
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // =========================================================
  // PRODUCT SELECT
  // =========================================================

  const handleProductChange = (
    index: number,
    value: string
  ) => {
    const product = products.find(
      (item) =>
        String(
          item.productId ??
            item.product_id ??
            item.id ??
            ""
        ) === value
    );

    if (!product) {
      setItems((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? createEmptyItem()
            : item
        )
      );

      return;
    }

    const productName =
      product.productName ??
      product.product_name ??
      product.name ??
      "";

    /*
      IMPORTANT:

      Your /api/admin/products response uses:

      price        = current website sale price
      regularPrice = regular crossed-out price
    */

    const websitePrice =
      product.price !== undefined &&
      product.price !== null
        ? String(product.price)
        : "";

    const regularPrice =
      product.regularPrice ??
      product.regular_price ??
      "";

    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,

              productId: value,

              productName: String(productName),

              regularPrice:
                regularPrice === ""
                  ? ""
                  : String(regularPrice),

              websitePrice,

              // Finance expected selling price starts
              // from current website sale price.
              // User can manually change it afterwards.
              sellingPrice: websitePrice,
            }
          : item
      )
    );
  };

  // =========================================================
  // ADD / REMOVE PRODUCT
  // =========================================================

  const addProduct = () => {
    setItems((current) => [
      ...current,
      createEmptyItem(),
    ]);
  };

  const removeProduct = (index: number) => {
    if (items.length === 1) {
      setItems([createEmptyItem()]);
      return;
    }

    setItems((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  // =========================================================
  // RESET
  // =========================================================

  const resetForm = () => {
    setInvestmentName("");

    setInvestmentDate(
      new Date().toISOString().split("T")[0]
    );

    setSupplier("");

    setShippingCost("");
    setCustomsCost("");
    setPackagingCost("");
    setOtherCost("");

    setNotes("");

    setItems([createEmptyItem()]);

    setError("");
  };

  const handleClose = () => {
    if (saving) return;

    resetForm();
    onClose();
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!investmentName.trim()) {
      setError("Investment name is required.");
      return;
    }

    if (!investmentDate) {
      setError("Investment date is required.");
      return;
    }

    const invalidItem = items.find(
      (item) =>
        !item.productId ||
        !item.productName ||
        Number(item.quantity) <= 0 ||
        item.unitCost === "" ||
        Number(item.unitCost) < 0 ||
        item.sellingPrice === "" ||
        Number(item.sellingPrice) < 0
    );

    if (invalidItem) {
      setError(
        "Please complete Product, Quantity, Unit Cost and Expected Selling Price for every product."
      );
      return;
    }

    try {
      setSaving(true);

const payload = {
  investmentName: investmentName.trim(),

  investmentDate: investmentDate,

  supplier: supplier.trim() || null,

  shippingCost: Number(shippingCost || 0),

  customsCost: Number(customsCost || 0),

  packagingCost: Number(packagingCost || 0),

  otherCost: Number(otherCost || 0),

  notes: notes.trim() || null,

  items: items.map((item) => ({
    productId: item.productId,

    productName: item.productName,

    quantity: Number(item.quantity),

    unitCost: Number(item.unitCost),

    sellingPrice: Number(item.sellingPrice),
  })),
};

      const response = await fetch(
        "/api/admin/finance/investments",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Could not create investment."
        );
      }

      resetForm();

      onClose();

      await onSuccess?.();
    } catch (err) {
      console.error("Create investment error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Business Finance
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              New Investment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Record purchasing costs and expected
              financial returns.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(92vh-100px)] overflow-y-auto"
        >
          <div className="space-y-8 p-6 md:p-8">
            {/* INVESTMENT DETAILS */}

            <section>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-950">
                  Investment Details
                </h3>

                <p className="text-sm text-slate-500">
                  Basic information about this investment
                  batch.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Investment Name"
                  required
                >
                  <input
                    value={investmentName}
                    onChange={(e) =>
                      setInvestmentName(e.target.value)
                    }
                    placeholder="e.g. Air Shipment July 2026"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Investment Date"
                  required
                >
                  <input
                    type="date"
                    value={investmentDate}
                    onChange={(e) =>
                      setInvestmentDate(e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Supplier">
                  <input
                    value={supplier}
                    onChange={(e) =>
                      setSupplier(e.target.value)
                    }
                    placeholder="Supplier name"
                    className={inputClass}
                  />
                </Field>
              </div>
            </section>

            {/* PRODUCTS */}

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                    <Package size={19} />
                    Products
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Add every product purchased under this
                    investment.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addProduct}
                  className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus size={17} />
                  Add Product
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => {
                  const quantity = Number(
                    item.quantity || 0
                  );

                  const unitCost = Number(
                    item.unitCost || 0
                  );

                  const expectedPrice = Number(
                    item.sellingPrice || 0
                  );

                  const rowCost =
                    quantity * unitCost;

                  const rowRevenue =
                    quantity * expectedPrice;

                  const rowProfit =
                    rowRevenue - rowCost;

                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5"
                    >
                      {/* PRODUCT HEADER */}

                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            Product {index + 1}
                          </p>

                          {item.productName && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.productName}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeProduct(index)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {/* FIRST ROW */}

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Field label="Product">
                          <select
                            value={item.productId}
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                e.target.value
                              )
                            }
                            className={inputClass}
                          >
                            <option value="">
                              {loadingProducts
                                ? "Loading products..."
                                : "Select product"}
                            </option>

                            {products.map((product) => {
                              const id = String(
                                product.productId ??
                                  product.product_id ??
                                  product.id ??
                                  ""
                              );

                              const name =
                                product.productName ??
                                product.product_name ??
                                product.name ??
                                "Unnamed Product";

                              return (
                                <option
                                  key={id}
                                  value={id}
                                >
                                  {name}
                                </option>
                              );
                            })}
                          </select>
                        </Field>

                        <Field label="Quantity">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Unit Cost">
                          <MoneyField
                            value={item.unitCost}
                            onChange={(value) =>
                              updateItem(
                                index,
                                "unitCost",
                                value
                              )
                            }
                            placeholder="0"
                          />
                        </Field>
                      </div>

                      {/* PRICE SECTION */}

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Selling Price Information
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Website prices are shown for
                            reference. Finance calculations use
                            Expected Selling Price.
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          {/* REGULAR PRICE */}

                          <Field label="Regular Price">
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                ৳
                              </span>

                              <input
                                type="text"
                                readOnly
                                value={
                                  item.regularPrice
                                    ? Number(
                                        item.regularPrice
                                      ).toLocaleString(
                                        "en-GB"
                                      )
                                    : ""
                                }
                                placeholder="0"
                                className={`${readOnlyInputClass} pl-8`}
                              />
                            </div>
                          </Field>

                          {/* WEBSITE SALE PRICE */}

                          <Field label="Website Sale Price">
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                ৳
                              </span>

                              <input
                                type="text"
                                readOnly
                                value={
                                  item.websitePrice
                                    ? Number(
                                        item.websitePrice
                                      ).toLocaleString(
                                        "en-GB"
                                      )
                                    : ""
                                }
                                placeholder="0"
                                className={`${readOnlyInputClass} pl-8`}
                              />
                            </div>
                          </Field>

                          {/* EXPECTED SELLING PRICE */}

                          <Field label="Expected Selling Price">
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-500">
                                ৳
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.sellingPrice
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "sellingPrice",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className={`${inputClass} border-blue-200 bg-blue-50/40 pl-8 font-semibold focus:bg-white`}
                              />
                            </div>

                            <p className="mt-1.5 text-xs text-blue-600">
                              Used for Finance calculations
                            </p>
                          </Field>
                        </div>
                      </div>

                      {/* PRODUCT CALCULATION */}

                      <div className="mt-4 flex flex-wrap gap-3 text-sm">
                        <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">
                          Purchase:{" "}
                          <strong className="text-slate-900">
                            {money(rowCost)}
                          </strong>
                        </span>

                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                          Potential Sales:{" "}
                          <strong>
                            {money(rowRevenue)}
                          </strong>
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 ${
                            rowProfit >= 0
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          Product Profit:{" "}
                          <strong>
                            {money(rowProfit)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ADDITIONAL COSTS */}

            <section>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-950">
                  Additional Costs
                </h3>

                <p className="text-sm text-slate-500">
                  Include shipping and other costs in the
                  investment.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MoneyInput
                  label="Shipping Cost"
                  value={shippingCost}
                  onChange={setShippingCost}
                />

                <MoneyInput
                  label="Customs Cost"
                  value={customsCost}
                  onChange={setCustomsCost}
                />

                <MoneyInput
                  label="Packaging Cost"
                  value={packagingCost}
                  onChange={setPackagingCost}
                />

                <MoneyInput
                  label="Other Cost"
                  value={otherCost}
                  onChange={setOtherCost}
                />
              </div>
            </section>

            {/* SUMMARY */}

            <section className="rounded-[26px] bg-slate-950 p-5 text-white md:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Calculator size={20} />

                <h3 className="text-lg font-bold">
                  Investment Summary
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Product Cost"
                  value={money(
                    calculations.productCost
                  )}
                />

                <SummaryCard
                  title="Extra Costs"
                  value={money(
                    calculations.extraCosts
                  )}
                />

                <SummaryCard
                  title="Total Investment"
                  value={money(
                    calculations.totalInvestment
                  )}
                />

                <SummaryCard
                  title="Total Units"
                  value={calculations.totalUnits.toLocaleString(
                    "en-GB"
                  )}
                />

                <SummaryCard
                  title="Potential Revenue"
                  value={money(
                    calculations.potentialRevenue
                  )}
                />

                <SummaryCard
                  title="Potential Profit"
                  value={money(
                    calculations.potentialProfit
                  )}
                />

                <SummaryCard
                  title="Expected ROI"
                  value={`${calculations.roi.toFixed(
                    1
                  )}%`}
                />
              </div>
            </section>

            {/* NOTES */}

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                rows={3}
                placeholder="Optional notes about this investment..."
                className={`${inputClass} resize-none`}
              />
            </Field>

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur md:px-8">
            <div className="hidden sm:block">
              <p className="text-xs text-slate-500">
                Total Investment
              </p>

              <p className="text-xl font-bold text-slate-950">
                {money(
                  calculations.totalInvestment
                )}
              </p>
            </div>

            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Save Investment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================
// FIELD
// =========================================================

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

// =========================================================
// MONEY FIELD
// =========================================================

function MoneyField({
  value,
  onChange,
  placeholder = "0",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
        ৳
      </span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className={`${inputClass} pl-8`}
      />
    </div>
  );
}

// =========================================================
// MONEY INPUT
// =========================================================

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <MoneyField
        value={value}
        onChange={onChange}
      />
    </Field>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}