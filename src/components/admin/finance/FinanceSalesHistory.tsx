"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/*
==========================================
TYPES
==========================================
*/

type FinanceSale = {
  id: number | string;

  orderId: string;

  investmentItemId:
    | number
    | string
    | null;

  investmentId:
    | number
    | string
    | null;

  investmentCode: string;
  investmentName: string;

  investmentDate:
    | string
    | null;

  productId:
    | number
    | string
    | null;

  productName: string;

  quantity: number;

  unitCost: number;
  sellingPrice: number;

  productRevenue: number;
  costOfGoods: number;

  allocatedExtraCost: number;

  landedCost: number;

  grossProfit: number;

  createdAt:
    | string
    | null;
};

type SalesSummary = {
  totalAllocations: number;
  totalOrders: number;
  totalQuantity: number;

  totalRevenue: number;

  totalProductCost: number;

  totalAllocatedExtraCost: number;

  totalLandedCost: number;

  totalProfit: number;
};

type FinanceSalesResponse = {
  success: boolean;

  message?: string;

  sales?: FinanceSale[];

  summary?: Partial<SalesSummary>;
};

/*
==========================================
ORDER GROUP
==========================================

One order can contain multiple Finance
allocation rows because of FIFO investment
allocation.

We merge those rows into ONE order row.
==========================================
*/

type OrderProduct = {
  productId:
    | number
    | string
    | null;

  productName: string;

  quantity: number;

  revenue: number;

  costOfGoods: number;

  extraCost: number;

  landedCost: number;

  profit: number;
};

type OrderInvestment = {
  investmentCode: string;
  investmentName: string;
  quantity: number;
};

type OrderGroup = {
  orderId: string;

  totalQuantity: number;

  totalRevenue: number;

  totalProductCost: number;

  totalExtraCost: number;

  totalLandedCost: number;

  totalProfit: number;

  allocationCount: number;

  processedAt:
    | string
    | null;

  products: OrderProduct[];

  investments: OrderInvestment[];
};

/*
==========================================
PAGINATION
==========================================
*/

const ORDERS_PER_PAGE = 30;

/*
==========================================
EMPTY SUMMARY
==========================================
*/

const emptySummary: SalesSummary = {
  totalAllocations: 0,
  totalOrders: 0,
  totalQuantity: 0,

  totalRevenue: 0,

  totalProductCost: 0,

  totalAllocatedExtraCost: 0,

  totalLandedCost: 0,

  totalProfit: 0,
};

/*
==========================================
FORMAT MONEY
==========================================
*/

function formatMoney(
  value: number
) {
  return `৳${Number(
    value || 0
  ).toLocaleString(
    "en-GB",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

/*
==========================================
FORMAT DATE
==========================================
*/

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/*
==========================================
BUILD ORDER GROUPS
==========================================

Important:

The API may return multiple rows for the
same order because FIFO can allocate one
order across multiple investment batches.

Example:

ORDER-001
  Allocation 1 → Investment A → 3 pcs
  Allocation 2 → Investment B → 2 pcs

This function converts them into:

ORDER-001 → 5 pcs
==========================================
*/

function buildOrderGroups(
  sales: FinanceSale[]
): OrderGroup[] {
  const map =
    new Map<
      string,
      OrderGroup
    >();

  for (
    const sale of sales
  ) {
    const orderId =
      String(
        sale.orderId || ""
      ).trim();

    if (!orderId) {
      continue;
    }

    let order =
      map.get(orderId);

    if (!order) {
      order = {
        orderId,

        totalQuantity: 0,

        totalRevenue: 0,

        totalProductCost: 0,

        totalExtraCost: 0,

        totalLandedCost: 0,

        totalProfit: 0,

        allocationCount: 0,

        processedAt:
          sale.createdAt ||
          null,

        products: [],

        investments: [],
      };

      map.set(
        orderId,
        order
      );
    }

    /*
    ======================================
    ORDER TOTALS
    ======================================
    */

    order.totalQuantity +=
      Number(
        sale.quantity || 0
      );

    order.totalRevenue +=
      Number(
        sale.productRevenue ||
          0
      );

    order.totalProductCost +=
      Number(
        sale.costOfGoods ||
          0
      );

    order.totalExtraCost +=
      Number(
        sale.allocatedExtraCost ||
          0
      );

    order.totalLandedCost +=
      Number(
        sale.landedCost ||
          0
      );

    order.totalProfit +=
      Number(
        sale.grossProfit ||
          0
      );

    order.allocationCount +=
      1;

    /*
    ======================================
    LATEST PROCESS DATE
    ======================================
    */

    if (
      sale.createdAt &&
      (
        !order.processedAt ||
        new Date(
          sale.createdAt
        ).getTime() >
          new Date(
            order.processedAt
          ).getTime()
      )
    ) {
      order.processedAt =
        sale.createdAt;
    }

    /*
    ======================================
    PRODUCT GROUP
    ======================================
    */

    const productKey =
      `${String(
        sale.productId ?? ""
      )}::${sale.productName}`;

    let product =
      order.products.find(
        (item) =>
          `${String(
            item.productId ?? ""
          )}::${item.productName}` ===
          productKey
      );

    if (!product) {
      product = {
        productId:
          sale.productId,

        productName:
          sale.productName ||
          "Unknown Product",

        quantity: 0,

        revenue: 0,

        costOfGoods: 0,

        extraCost: 0,

        landedCost: 0,

        profit: 0,
      };

      order.products.push(
        product
      );
    }

    product.quantity +=
      Number(
        sale.quantity || 0
      );

    product.revenue +=
      Number(
        sale.productRevenue ||
          0
      );

    product.costOfGoods +=
      Number(
        sale.costOfGoods ||
          0
      );

    product.extraCost +=
      Number(
        sale.allocatedExtraCost ||
          0
      );

    product.landedCost +=
      Number(
        sale.landedCost ||
          0
      );

    product.profit +=
      Number(
        sale.grossProfit ||
          0
      );

    /*
    ======================================
    INVESTMENT GROUP
    ======================================
    */

    const investmentKey =
      `${sale.investmentCode}::${sale.investmentName}`;

    let investment =
      order.investments.find(
        (item) =>
          `${item.investmentCode}::${item.investmentName}` ===
          investmentKey
      );

    if (!investment) {
      investment = {
        investmentCode:
          sale.investmentCode ||
          "",

        investmentName:
          sale.investmentName ||
          "Unknown Investment",

        quantity: 0,
      };

      order.investments.push(
        investment
      );
    }

    investment.quantity +=
      Number(
        sale.quantity || 0
      );
  }

  /*
  ======================================
  SORT
  ======================================

  Latest processed order first.
  ======================================
  */

  return Array.from(
    map.values()
  ).sort(
    (a, b) => {
      const aTime =
        a.processedAt
          ? new Date(
              a.processedAt
            ).getTime()
          : 0;

      const bTime =
        b.processedAt
          ? new Date(
              b.processedAt
            ).getTime()
          : 0;

      return bTime - aTime;
    }
  );
}

/*
==========================================
COMPONENT
==========================================
*/

export default function FinanceSalesHistory() {
  const [
    sales,
    setSales,
  ] = useState<FinanceSale[]>(
    []
  );

  const [
    summary,
    setSummary,
  ] = useState<SalesSummary>(
    emptySummary
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  /*
  ========================================
  LOAD FINANCE SALES
  ========================================
  */

  const loadSales =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/admin/finance/sales",
            {
              cache:
                "no-store",
            }
          );

        const data:
          FinanceSalesResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load Finance sales."
          );
        }

        const nextSales =
          Array.isArray(
            data.sales
          )
            ? data.sales
            : [];

        setSales(
          nextSales
        );

        setSummary({
          totalAllocations:
            Number(
              data.summary
                ?.totalAllocations ||
                0
            ),

          totalOrders:
            Number(
              data.summary
                ?.totalOrders ||
                0
            ),

          totalQuantity:
            Number(
              data.summary
                ?.totalQuantity ||
                0
            ),

          totalRevenue:
            Number(
              data.summary
                ?.totalRevenue ||
                0
            ),

          totalProductCost:
            Number(
              data.summary
                ?.totalProductCost ||
                0
            ),

          totalAllocatedExtraCost:
            Number(
              data.summary
                ?.totalAllocatedExtraCost ||
                0
            ),

          totalLandedCost:
            Number(
              data.summary
                ?.totalLandedCost ||
                0
            ),

          totalProfit:
            Number(
              data.summary
                ?.totalProfit ||
                0
            ),
        });

        /*
        ----------------------------------
        RETURN TO FIRST PAGE AFTER REFRESH
        ----------------------------------
        */

        setCurrentPage(
          1
        );
      } catch (err) {
        console.error(
          "FINANCE SALES HISTORY ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );

        setSales([]);

        setSummary(
          emptySummary
        );

        setCurrentPage(
          1
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /*
  ========================================
  INITIAL LOAD
  ========================================
  */

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  /*
  ========================================
  GROUP BY ORDER
  ========================================
  */

  const orderGroups =
    useMemo(
      () =>
        buildOrderGroups(
          sales
        ),
      [sales]
    );

  /*
  ========================================
  PAGINATION
  ========================================
  */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        orderGroups.length /
          ORDERS_PER_PAGE
      )
    );

  /*
  ========================================
  SAFETY
  ========================================
  */

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  /*
  ========================================
  CURRENT ORDERS
  ========================================
  */

  const currentOrders =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ORDERS_PER_PAGE;

      const end =
        start +
        ORDERS_PER_PAGE;

      return orderGroups.slice(
        start,
        end
      );
    }, [
      orderGroups,
      currentPage,
    ]);

  /*
  ========================================
  PAGE NUMBERS
  ========================================
  */

  const pageNumbers =
    useMemo(() => {
      const pages: number[] =
        [];

      const maxVisible =
        7;

      if (
        totalPages <=
        maxVisible
      ) {
        for (
          let i = 1;
          i <= totalPages;
          i++
        ) {
          pages.push(i);
        }

        return pages;
      }

      pages.push(1);

      if (
        currentPage > 4
      ) {
        pages.push(-1);
      }

      const start =
        Math.max(
          2,
          currentPage - 1
        );

      const end =
        Math.min(
          totalPages - 1,
          currentPage + 1
        );

      for (
        let i = start;
        i <= end;
        i++
      ) {
        if (
          !pages.includes(i)
        ) {
          pages.push(i);
        }
      }

      if (
        currentPage <
        totalPages - 3
      ) {
        pages.push(-2);
      }

      if (
        !pages.includes(
          totalPages
        )
      ) {
        pages.push(
          totalPages
        );
      }

      return pages;
    }, [
      currentPage,
      totalPages,
    ]);

  /*
  ========================================
  PAGE RANGE
  ========================================
  */

  const pageStart =
    orderGroups.length === 0
      ? 0
      : (currentPage - 1) *
          ORDERS_PER_PAGE +
        1;

  const pageEnd =
    Math.min(
      currentPage *
        ORDERS_PER_PAGE,
      orderGroups.length
    );

  /*
  ========================================
  UI
  ========================================
  */

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="border-b border-slate-100 p-6">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Delivered Sales Ledger
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Finance Transaction History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Confirmed delivered orders
              grouped from Finance
              allocations.
            </p>

          </div>

          <button
            type="button"
            onClick={
              loadSales
            }
            disabled={
              loading
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

      </div>

      {/* ================================= */}
      {/* SUMMARY */}
      {/* ================================= */}

      <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

        <SummaryItem
          label="Orders"
          value={summary.totalOrders.toLocaleString(
            "en-GB"
          )}
        />

        <SummaryItem
          label="Allocations"
          value={summary.totalAllocations.toLocaleString(
            "en-GB"
          )}
        />

        <SummaryItem
          label="Units"
          value={summary.totalQuantity.toLocaleString(
            "en-GB"
          )}
        />

        <SummaryItem
          label="Revenue"
          value={formatMoney(
            summary.totalRevenue
          )}
        />

        <SummaryItem
          label="Product COGS"
          value={formatMoney(
            summary.totalProductCost
          )}
        />

        <SummaryItem
          label="Landed Cost"
          value={formatMoney(
            summary.totalLandedCost
          )}
        />

        <SummaryItem
          label="Profit"
          value={formatMoney(
            summary.totalProfit
          )}
          positive
        />

      </div>

      {/* ================================= */}
      {/* ERROR */}
      {/* ================================= */}

      {error && (
        <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ================================= */}
      {/* LOADING */}
      {/* ================================= */}

      {loading ? (

        <div className="p-12 text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading Finance
            transactions...
          </p>

        </div>

      ) : orderGroups.length ===
        0 ? (

        <div className="px-6 py-14 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            🧾
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-950">
            No delivered sales yet
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Finance transactions
            will appear here
            automatically after a
            confirmed delivered order
            is processed into the
            Finance ledger.
          </p>

        </div>

      ) : (

        <>
          {/* =============================== */}
          {/* TABLE */}
          {/* =============================== */}

          <div className="overflow-x-auto">

            <table className="min-w-[1450px] w-full">

              <thead className="bg-slate-50">

                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-5 py-4">
                    Order
                  </th>

                  <th className="px-5 py-4">
                    Products
                  </th>

                  <th className="px-5 py-4">
                    Investment
                  </th>

                  <th className="px-5 py-4 text-center">
                    Qty
                  </th>

                  <th className="px-5 py-4 text-right">
                    Revenue
                  </th>

                  <th className="px-5 py-4 text-right">
                    Product COGS
                  </th>

                  <th className="px-5 py-4 text-right">
                    Extra Cost
                  </th>

                  <th className="px-5 py-4 text-right">
                    Landed Cost
                  </th>

                  <th className="px-5 py-4 text-right">
                    Profit
                  </th>

                  <th className="px-5 py-4">
                    Processed
                  </th>

                </tr>

              </thead>

              <tbody>

                {currentOrders.map(
                  (order) => (

                    <tr
                      key={
                        order.orderId
                      }
                      className="border-b border-slate-100 align-top transition hover:bg-slate-50/70"
                    >

                      {/* ================= */}
                      {/* ORDER */}
                      {/* ================= */}

                      <td className="px-5 py-4">

                        <p className="font-semibold text-slate-900">
                          {
                            order.orderId
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            order.allocationCount
                          }{" "}
                          allocation
                          {order.allocationCount !==
                          1
                            ? "s"
                            : ""}
                        </p>

                      </td>

                      {/* ================= */}
                      {/* PRODUCTS */}
                      {/* ================= */}

                      <td className="px-5 py-4">

                        <div className="space-y-2">

                          {order.products.map(
                            (
                              product,
                              index
                            ) => (

                              <div
                                key={`${order.orderId}-${String(
                                  product.productId ??
                                    index
                                )}-${index}`}
                                className="min-w-[250px]"
                              >

                                <p className="font-medium text-slate-900">
                                  {
                                    product.productName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Qty:{" "}
                                  {
                                    product.quantity
                                  }
                                </p>

                              </div>

                            )
                          )}

                        </div>

                      </td>

                      {/* ================= */}
                      {/* INVESTMENTS */}
                      {/* ================= */}

                      <td className="px-5 py-4">

                        <div className="space-y-2">

                          {order.investments.map(
                            (
                              investment,
                              index
                            ) => (

                              <div
                                key={`${order.orderId}-investment-${index}`}
                                className="min-w-[220px]"
                              >

                                <p className="font-medium text-slate-900">
                                  {
                                    investment.investmentName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-blue-600">
                                  {
                                    investment.investmentCode ||
                                    "No investment code"
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Qty:{" "}
                                  {
                                    investment.quantity
                                  }
                                </p>

                              </div>

                            )
                          )}

                        </div>

                      </td>

                      {/* ================= */}
                      {/* QUANTITY */}
                      {/* ================= */}

                      <td className="px-5 py-4 text-center">

                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                          {
                            order.totalQuantity
                          }
                        </span>

                      </td>

                      {/* ================= */}
                      {/* REVENUE */}
                      {/* ================= */}

                      <td className="px-5 py-4 text-right font-semibold text-slate-900">

                        {formatMoney(
                          order.totalRevenue
                        )}

                      </td>

                      {/* ================= */}
                      {/* COGS */}
                      {/* ================= */}

                      <td className="px-5 py-4 text-right text-slate-700">

                        {formatMoney(
                          order.totalProductCost
                        )}

                      </td>

                      {/* ================= */}
                      {/* EXTRA COST */}
                      {/* ================= */}

                      <td className="px-5 py-4 text-right text-slate-700">

                        {formatMoney(
                          order.totalExtraCost
                        )}

                      </td>

                      {/* ================= */}
                      {/* LANDED COST */}
                      {/* ================= */}

                      <td className="px-5 py-4 text-right font-medium text-slate-900">

                        {formatMoney(
                          order.totalLandedCost
                        )}

                      </td>

                      {/* ================= */}
                      {/* PROFIT */}
                      {/* ================= */}

                      <td className="px-5 py-4 text-right">

                        <span
                          className={
                            order.totalProfit >=
                            0
                              ? "font-bold text-emerald-600"
                              : "font-bold text-red-600"
                          }
                        >
                          {formatMoney(
                            order.totalProfit
                          )}
                        </span>

                      </td>

                      {/* ================= */}
                      {/* DATE */}
                      {/* ================= */}

                      <td className="px-5 py-4 text-sm text-slate-500">

                        {formatDate(
                          order.processedAt
                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {/* =============================== */}
          {/* PAGINATION */}
          {/* =============================== */}

          <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

            {/* RANGE */}

            <div className="text-sm text-slate-500">

              Showing{" "}

              <span className="font-semibold text-slate-900">
                {pageStart}
              </span>

              {" "}–{" "}

              <span className="font-semibold text-slate-900">
                {pageEnd}
              </span>

              {" "}of{" "}

              <span className="font-semibold text-slate-900">
                {
                  orderGroups.length
                }
              </span>

              {" "}orders

            </div>

            {/* CONTROLS */}

            <div className="flex flex-wrap items-center gap-2">

              {/* PREVIOUS */}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                disabled={
                  currentPage ===
                    1 ||
                  loading
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              {/* PAGE NUMBERS */}

              {pageNumbers.map(
                (
                  page,
                  index
                ) =>
                  page < 0 ? (

                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 text-slate-400"
                    >
                      …
                    </span>

                  ) : (

                    <button
                      key={
                        page
                      }
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      disabled={
                        loading
                      }
                      className={`min-w-10 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        currentPage ===
                        page
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {
                        page
                      }
                    </button>

                  )
              )}

              {/* NEXT */}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                  )
                }
                disabled={
                  currentPage ===
                    totalPages ||
                  loading
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>

            </div>

          </div>

        </>

      )}

    </section>
  );
}

/*
==========================================
SUMMARY ITEM
==========================================
*/

function SummaryItem({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">

      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-base font-bold ${
          positive
            ? "text-emerald-600"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>

    </div>
  );
}