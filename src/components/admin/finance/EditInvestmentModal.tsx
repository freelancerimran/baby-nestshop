"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Calculator,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";

/*
==================================================
TYPES
==================================================
*/

type Product = {
  productId: string;
  productName: string;

  price?: number;
  regularPrice?: number;

  realStock?: number;
  displayStock?: number;

  status?: string;
};

type InvestmentItem = {
  id?: number | string;

  productId?:
    | number
    | string
    | null;

  productName?: string;

  quantity?: number;

  unitCost?: number;

  sellingPrice?: number;

  soldQuantity?: number;
};

export type EditableInvestment = {
  /*
    IMPORTANT:
    id is optional here so this type stays
    compatible with the shared Finance
    Investment type used by page.tsx.
  */
  id?: number | string;

  investmentCode?: string;
  investment_code?: string;

  investmentName?: string;
  investment_name?: string;

  investmentDate?: string;
  investment_date?: string;

  supplier?: string | null;

  shippingCost?: number;
  shipping_cost?: number;

  customsCost?: number;
  customs_cost?: number;

  packagingCost?: number;
  packaging_cost?: number;

  otherCost?: number;
  other_cost?: number;

  notes?: string | null;

  status?: string;

  items?: InvestmentItem[];
};

interface EditInvestmentModalProps {
  open: boolean;

  investment:
    | EditableInvestment
    | null;

  onClose: () => void;

  onSuccess: () =>
    | void
    | Promise<void>;
}

/*
==================================================
HELPERS
==================================================
*/

function numberValue(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function money(
  value: number
) {
  return `৳${Number(
    value || 0
  ).toLocaleString(
    "en-GB"
  )}`;
}

function dateInputValue(
  value?: string
) {
  if (!value) {
    return "";
  }

  return value.slice(
    0,
    10
  );
}

/*
==================================================
COMPONENT
==================================================
*/

export default function EditInvestmentModal({
  open,
  investment,
  onClose,
  onSuccess,
}: EditInvestmentModalProps) {
  /*
  ================================================
  FORM STATE
  ================================================
  */

  const [
    investmentName,
    setInvestmentName,
  ] = useState("");

  const [
    investmentDate,
    setInvestmentDate,
  ] = useState("");

  const [
    supplier,
    setSupplier,
  ] = useState("");

  const [
    shippingCost,
    setShippingCost,
  ] = useState("0");

  const [
    customsCost,
    setCustomsCost,
  ] = useState("0");

  const [
    packagingCost,
    setPackagingCost,
  ] = useState("0");

  const [
    otherCost,
    setOtherCost,
  ] = useState("0");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    items,
    setItems,
  ] = useState<
    InvestmentItem[]
  >([]);

  /*
  ================================================
  PRODUCTS
  ================================================
  */

  const [
    products,
    setProducts,
  ] = useState<
    Product[]
  >([]);

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(false);

  /*
  ================================================
  REQUEST STATE
  ================================================
  */

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
  ================================================
  LOAD EXISTING INVESTMENT
  ================================================
  */

  useEffect(() => {
    if (
      !open ||
      !investment
    ) {
      return;
    }

    setInvestmentName(
      investment.investmentName ??
        investment.investment_name ??
        ""
    );

    setInvestmentDate(
      dateInputValue(
        investment.investmentDate ??
          investment.investment_date
      )
    );

    setSupplier(
      investment.supplier ??
        ""
    );

    setShippingCost(
      String(
        numberValue(
          investment.shippingCost ??
            investment.shipping_cost
        )
      )
    );

    setCustomsCost(
      String(
        numberValue(
          investment.customsCost ??
            investment.customs_cost
        )
      )
    );

    setPackagingCost(
      String(
        numberValue(
          investment.packagingCost ??
            investment.packaging_cost
        )
      )
    );

    setOtherCost(
      String(
        numberValue(
          investment.otherCost ??
            investment.other_cost
        )
      )
    );

    setNotes(
      investment.notes ??
        ""
    );

    setItems(
      Array.isArray(
        investment.items
      )
        ? investment.items.map(
            (item) => ({
              id:
                item.id,

              productId:
                item.productId,

              productName:
                item.productName ||
                "",

              quantity:
                numberValue(
                  item.quantity
                ),

              unitCost:
                numberValue(
                  item.unitCost
                ),

              sellingPrice:
                numberValue(
                  item.sellingPrice
                ),

              soldQuantity:
                numberValue(
                  item.soldQuantity
                ),
            })
          )
        : []
    );

    setError("");
  }, [
    open,
    investment,
  ]);

  /*
  ================================================
  LOAD PRODUCTS
  ================================================
  */

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled =
      false;

    async function loadProducts() {
      try {
        setProductsLoading(
          true
        );

        const response =
          await fetch(
            "/api/admin/products",
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Could not load products."
          );
        }

        if (cancelled) {
          return;
        }

        setProducts(
          Array.isArray(
            data?.products
          )
            ? data.products
            : []
        );
      } catch (err) {
        console.error(
          "EDIT INVESTMENT PRODUCTS ERROR:",
          err
        );

        if (!cancelled) {
          setProducts(
            []
          );
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(
            false
          );
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /*
  ================================================
  CALCULATIONS
  ================================================
  */

  const calculations =
    useMemo(() => {
      const productCost =
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            numberValue(
              item.quantity
            ) *
              numberValue(
                item.unitCost
              ),
          0
        );

      const extraCosts =
        numberValue(
          shippingCost
        ) +
        numberValue(
          customsCost
        ) +
        numberValue(
          packagingCost
        ) +
        numberValue(
          otherCost
        );

      const totalInvestment =
        productCost +
        extraCosts;

      const potentialRevenue =
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            numberValue(
              item.quantity
            ) *
              numberValue(
                item.sellingPrice
              ),
          0
        );

      const potentialProfit =
        potentialRevenue -
        totalInvestment;

      const totalUnits =
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            numberValue(
              item.quantity
            ),
          0
        );

      const expectedROI =
        totalInvestment > 0
          ? (potentialProfit /
              totalInvestment) *
            100
          : 0;

      return {
        productCost,
        extraCosts,
        totalInvestment,
        potentialRevenue,
        potentialProfit,
        totalUnits,
        expectedROI,
      };
    }, [
      items,
      shippingCost,
      customsCost,
      packagingCost,
      otherCost,
    ]);

  /*
  ================================================
  UPDATE ITEM
  ================================================
  */

  function updateItem(
    index: number,
    field:
      | "quantity"
      | "unitCost"
      | "sellingPrice",
    value: string
  ) {
    setItems(
      (
        currentItems
      ) =>
        currentItems.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex ===
            index
              ? {
                  ...item,

                  [field]:
                    numberValue(
                      value
                    ),
                }
              : item
        )
    );
  }

  /*
  ================================================
  PRODUCT CHANGE
  ================================================
  */

  function handleProductChange(
    index: number,
    productId: string
  ) {
    const product =
      products.find(
        (product) =>
          String(
            product.productId
          ) ===
          String(
            productId
          )
      );

    if (!product) {
      return;
    }

    setItems(
      (
        currentItems
      ) =>
        currentItems.map(
          (
            item,
            itemIndex
          ) => {
            if (
              itemIndex !==
              index
            ) {
              return item;
            }

            return {
              ...item,

              productId:
                product.productId,

              productName:
                product.productName,

              /*
                Current website offer price
                becomes expected selling price.
              */
              sellingPrice:
                numberValue(
                  product.price
                ),
            };
          }
        )
    );
  }

  /*
  ================================================
  ADD PRODUCT
  ================================================
  */

  function addProduct() {
    setItems(
      (
        currentItems
      ) => [
        ...currentItems,

        {
          productId: "",
          productName: "",

          quantity: 1,

          unitCost: 0,

          sellingPrice: 0,

          soldQuantity: 0,
        },
      ]
    );

    setError("");
  }

  /*
  ================================================
  REMOVE PRODUCT
  ================================================
  */

  function removeProduct(
    index: number
  ) {
    const item =
      items[index];

    const soldQuantity =
      numberValue(
        item?.soldQuantity
      );

    if (
      soldQuantity > 0
    ) {
      setError(
        `${item.productName} already has ${soldQuantity} sold unit(s). It cannot be removed from this investment.`
      );

      return;
    }

    if (
      items.length === 1
    ) {
      setError(
        "Investment must contain at least one product."
      );

      return;
    }

    setError("");

    setItems(
      (
        currentItems
      ) =>
        currentItems.filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )
    );
  }

  /*
  ================================================
  VALIDATION
  ================================================
  */

  function validateForm() {
    if (
      !investmentName.trim()
    ) {
      return "Investment name is required.";
    }

    if (
      !investmentDate
    ) {
      return "Investment date is required.";
    }

    if (
      items.length === 0
    ) {
      return "Add at least one product.";
    }

    for (
      let index = 0;
      index <
      items.length;
      index++
    ) {
      const item =
        items[index];

      if (
        !item.productId ||
        !item.productName
      ) {
        return `Select Product ${
          index + 1
        }.`;
      }

      if (
        numberValue(
          item.quantity
        ) <= 0
      ) {
        return `Product ${
          index + 1
        } quantity must be greater than 0.`;
      }

      if (
        numberValue(
          item.quantity
        ) <
        numberValue(
          item.soldQuantity
        )
      ) {
        return `${item.productName} already has ${numberValue(
          item.soldQuantity
        )} sold unit(s). Quantity cannot be lower than sold quantity.`;
      }

      if (
        numberValue(
          item.unitCost
        ) < 0
      ) {
        return `Product ${
          index + 1
        } unit cost cannot be negative.`;
      }

      if (
        numberValue(
          item.sellingPrice
        ) < 0
      ) {
        return `Product ${
          index + 1
        } selling price cannot be negative.`;
      }
    }

    return "";
  }

  /*
  ================================================
  SAVE CHANGES
  ================================================
  */

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /*
      investment.id is optional at type level
      for compatibility with the shared type.

      But an actual database update cannot
      happen without an ID.
    */
    if (
      !investment ||
      investment.id ===
        undefined ||
      investment.id === null
    ) {
      setError(
        "Investment ID is missing. Could not update investment."
      );

      return;
    }

    const validationError =
      validateForm();

    if (
      validationError
    ) {
      setError(
        validationError
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        investmentName:
          investmentName.trim(),

        investmentDate,

        supplier:
          supplier.trim() ||
          null,

        shippingCost:
          numberValue(
            shippingCost
          ),

        customsCost:
          numberValue(
            customsCost
          ),

        packagingCost:
          numberValue(
            packagingCost
          ),

        otherCost:
          numberValue(
            otherCost
          ),

        notes:
          notes.trim() ||
          null,

        status:
          investment.status ||
          "active",

        items:
          items.map(
            (item) => ({
              id:
                item.id,

              productId:
                item.productId,

              productName:
                item.productName,

              quantity:
                numberValue(
                  item.quantity
                ),

              unitCost:
                numberValue(
                  item.unitCost
                ),

              sellingPrice:
                numberValue(
                  item.sellingPrice
                ),
            })
          ),
      };

      const response =
        await fetch(
          `/api/admin/finance/investments/${investment.id}`,
          {
            method:
              "PUT",

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

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Could not update investment."
        );
      }

      await onSuccess();
    } catch (err) {
      console.error(
        "EDIT INVESTMENT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not update investment."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  ================================================
  CLOSED
  ================================================
  */

  if (
    !open ||
    !investment
  ) {
    return null;
  }

  /*
  ================================================
  UI
  ================================================
  */

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[94vh] w-full max-w-[1450px] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8 lg:px-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
              Business Finance
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Edit Investment
            </h2>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Update purchasing
              costs, products and
              expected returns.
            </p>

            {(investment.investmentCode ||
              investment.investment_code) && (
              <p className="mt-2 text-xs font-semibold text-slate-400">
                {investment.investmentCode ??
                  investment.investment_code}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-8 p-6 sm:p-8 lg:p-10">
              {/* ERROR */}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* INVESTMENT DETAILS */}

              <section>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-slate-950">
                    Investment Details
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Basic information
                    about this investment
                    batch.
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Investment Name{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </span>

                    <input
                      type="text"
                      value={
                        investmentName
                      }
                      onChange={(
                        event
                      ) =>
                        setInvestmentName(
                          event.target
                            .value
                        )
                      }
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Investment Date{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </span>

                    <input
                      type="date"
                      value={
                        investmentDate
                      }
                      onChange={(
                        event
                      ) =>
                        setInvestmentDate(
                          event.target
                            .value
                        )
                      }
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Supplier
                    </span>

                    <input
                      type="text"
                      value={
                        supplier
                      }
                      onChange={(
                        event
                      ) =>
                        setSupplier(
                          event.target
                            .value
                        )
                      }
                      placeholder="Supplier name"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </label>
                </div>
              </section>

              {/* PRODUCTS */}

              <section>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package
                        size={21}
                      />

                      <h3 className="text-xl font-bold text-slate-950">
                        Products
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Update products
                      purchased under
                      this investment.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addProduct
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus
                      size={18}
                    />
                    Add Product
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map(
                    (
                      item,
                      index
                    ) => {
                      const purchaseCost =
                        numberValue(
                          item.quantity
                        ) *
                        numberValue(
                          item.unitCost
                        );

                      const potentialSales =
                        numberValue(
                          item.quantity
                        ) *
                        numberValue(
                          item.sellingPrice
                        );

                      const soldQuantity =
                        numberValue(
                          item.soldQuantity
                        );

                      return (
                        <div
                          key={
                            item.id ??
                            `new-${index}`
                          }
                          className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5"
                        >
                          <div className="mb-5 flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900">
                                Product{" "}
                                {index +
                                  1}
                              </h4>

                              {soldQuantity >
                                0 && (
                                <p className="mt-1 text-xs font-medium text-amber-600">
                                  {
                                    soldQuantity
                                  }{" "}
                                  unit(s)
                                  already
                                  sold
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeProduct(
                                  index
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50"
                              title="Remove product"
                            >
                              <Trash2
                                size={
                                  18
                                }
                              />
                            </button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {/* PRODUCT */}

                            <label>
                              <span className="mb-2 block text-sm font-semibold text-slate-700">
                                Product
                              </span>

                              <select
                                value={String(
                                  item.productId ??
                                    ""
                                )}
                                onChange={(
                                  event
                                ) =>
                                  handleProductChange(
                                    index,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  productsLoading
                                }
                                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                              >
                                <option value="">
                                  {productsLoading
                                    ? "Loading products..."
                                    : "Select product"}
                                </option>

                                {products.map(
                                  (
                                    product
                                  ) => (
                                    <option
                                      key={
                                        product.productId
                                      }
                                      value={
                                        product.productId
                                      }
                                    >
                                      {
                                        product.productName
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </label>

                            {/* QUANTITY */}

                            <label>
                              <span className="mb-2 block text-sm font-semibold text-slate-700">
                                Quantity
                              </span>

                              <input
                                type="number"
                                min={
                                  soldQuantity >
                                  0
                                    ? soldQuantity
                                    : 1
                                }
                                step="1"
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                              />
                            </label>

                            {/* UNIT COST */}

                            <label>
                              <span className="mb-2 block text-sm font-semibold text-slate-700">
                                Unit Cost
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.unitCost
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    index,
                                    "unitCost",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                              />
                            </label>

                            {/* SELLING PRICE */}

                            <label>
                              <span className="mb-2 block text-sm font-semibold text-slate-700">
                                Expected
                                Selling Price
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.sellingPrice
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    index,
                                    "sellingPrice",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                              />
                            </label>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                              Purchase:{" "}
                              <span className="text-slate-950">
                                {money(
                                  purchaseCost
                                )}
                              </span>
                            </span>

                            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                              Potential
                              Sales:{" "}
                              {money(
                                potentialSales
                              )}
                            </span>

                            {soldQuantity >
                              0 && (
                              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                                Sold:{" "}
                                {
                                  soldQuantity
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </section>

              {/* ADDITIONAL COSTS */}

              <section>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-slate-950">
                    Additional Costs
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Update shipment
                    and other costs
                    included in this
                    investment.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label:
                        "Shipping Cost",
                      value:
                        shippingCost,
                      setter:
                        setShippingCost,
                    },

                    {
                      label:
                        "Customs Cost",
                      value:
                        customsCost,
                      setter:
                        setCustomsCost,
                    },

                    {
                      label:
                        "Packaging Cost",
                      value:
                        packagingCost,
                      setter:
                        setPackagingCost,
                    },

                    {
                      label:
                        "Other Cost",
                      value:
                        otherCost,
                      setter:
                        setOtherCost,
                    },
                  ].map(
                    (
                      field
                    ) => (
                      <label
                        key={
                          field.label
                        }
                      >
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                          {
                            field.label
                          }
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            field.value
                          }
                          onChange={(
                            event
                          ) =>
                            field.setter(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                      </label>
                    )
                  )}
                </div>
              </section>

              {/* SUMMARY */}

              <section className="rounded-[28px] bg-slate-950 p-6 text-white sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <Calculator
                    size={22}
                  />

                  <h3 className="text-xl font-bold">
                    Updated
                    Investment
                    Summary
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label:
                        "Product Cost",
                      value:
                        money(
                          calculations.productCost
                        ),
                    },

                    {
                      label:
                        "Extra Costs",
                      value:
                        money(
                          calculations.extraCosts
                        ),
                    },

                    {
                      label:
                        "Total Investment",
                      value:
                        money(
                          calculations.totalInvestment
                        ),
                    },

                    {
                      label:
                        "Total Units",
                      value:
                        calculations.totalUnits.toLocaleString(
                          "en-GB"
                        ),
                    },

                    {
                      label:
                        "Potential Revenue",
                      value:
                        money(
                          calculations.potentialRevenue
                        ),
                    },

                    {
                      label:
                        "Potential Profit",
                      value:
                        money(
                          calculations.potentialProfit
                        ),
                    },

                    {
                      label:
                        "Expected ROI",
                      value:
                        `${calculations.expectedROI.toFixed(
                          1
                        )}%`,
                    },
                  ].map(
                    (
                      stat
                    ) => (
                      <div
                        key={
                          stat.label
                        }
                        className="rounded-2xl border border-white/10 bg-white/5 p-5"
                      >
                        <p className="text-sm text-slate-400">
                          {
                            stat.label
                          }
                        </p>

                        <p className="mt-2 text-xl font-bold text-white">
                          {
                            stat.value
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>

              {/* NOTES */}

              <section>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Notes
                  </span>

                  <textarea
                    value={
                      notes
                    }
                    onChange={(
                      event
                    ) =>
                      setNotes(
                        event.target
                          .value
                      )
                    }
                    rows={4}
                    placeholder="Optional notes about this investment..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </label>
              </section>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex shrink-0 flex-col gap-4 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Updated Total
                Investment
              </p>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {money(
                  calculations.totalInvestment
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
                className="h-12 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="inline-flex h-12 min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}