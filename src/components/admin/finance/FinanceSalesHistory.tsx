"use client";

import {
  useCallback,
  useEffect,
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

        setSales(
          Array.isArray(
            data.sales
          )
            ? data.sales
            : []
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
              Confirmed delivered sales
              allocated against investment
              stock.
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
      ) : sales.length ===
        0 ? (
        /*
        ====================================
        EMPTY STATE
        ====================================
        */

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
        /*
        ====================================
        SALES TABLE
        ====================================
        */

        <div className="overflow-x-auto">
          <table className="min-w-[1450px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">
                  Order
                </th>

                <th className="px-5 py-4">
                  Product
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
              {sales.map(
                (sale) => (
                  <tr
                    key={
                      sale.id
                    }
                    className="border-b border-slate-100 align-top transition hover:bg-slate-50/70"
                  >
                    {/* ORDER */}

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {sale.orderId ||
                          "—"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Allocation #
                        {sale.id}
                      </p>
                    </td>

                    {/* PRODUCT */}

                    <td className="px-5 py-4">
                      <p className="max-w-[260px] font-medium text-slate-900">
                        {sale.productName ||
                          "—"}
                      </p>

                      {sale.productId !=
                        null && (
                        <p className="mt-1 text-xs text-slate-400">
                          Product ID:{" "}
                          {
                            sale.productId
                          }
                        </p>
                      )}
                    </td>

                    {/* INVESTMENT */}

                    <td className="px-5 py-4">
                      <p className="max-w-[220px] font-medium text-slate-900">
                        {sale.investmentName ||
                          "—"}
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        {sale.investmentCode ||
                          "No investment code"}
                      </p>
                    </td>

                    {/* QUANTITY */}

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                        {
                          sale.quantity
                        }
                      </span>
                    </td>

                    {/* REVENUE */}

                    <td className="px-5 py-4 text-right font-semibold text-slate-900">
                      {formatMoney(
                        sale.productRevenue
                      )}
                    </td>

                    {/* COGS */}

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatMoney(
                        sale.costOfGoods
                      )}
                    </td>

                    {/* EXTRA COST */}

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatMoney(
                        sale.allocatedExtraCost
                      )}
                    </td>

                    {/* LANDED COST */}

                    <td className="px-5 py-4 text-right font-medium text-slate-900">
                      {formatMoney(
                        sale.landedCost
                      )}
                    </td>

                    {/* PROFIT */}

                    <td className="px-5 py-4 text-right">
                      <span
                        className={
                          sale.grossProfit >=
                          0
                            ? "font-bold text-emerald-600"
                            : "font-bold text-red-600"
                        }
                      >
                        {formatMoney(
                          sale.grossProfit
                        )}
                      </span>
                    </td>

                    {/* DATE */}

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(
                        sale.createdAt
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
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