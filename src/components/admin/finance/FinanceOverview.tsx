"use client";

/*
==========================================
TYPES
==========================================
*/

interface FinanceSummary {
  totalInvestment: number;

  potentialRevenue: number;
  potentialProfit: number;

  actualRevenue: number;

  costOfGoods: number;
  allocatedExtraCost: number;
  realizedCost: number;

  realizedProfit: number;

  totalUnits: number;
  soldUnits: number;
  remainingUnits: number;

  roi: number;

  recoveryPercentage: number;

  salesCount: number;

  totalBatches: number;
}

interface FinanceOverviewProps {
  summary: FinanceSummary;
}

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
FORMAT NUMBER
==========================================
*/

function formatNumber(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "en-GB"
  );
}

/*
==========================================
FINANCE OVERVIEW
==========================================
*/

export default function FinanceOverview({
  summary,
}: FinanceOverviewProps) {
  /*
  ========================================
  STOCK SOLD %
  ========================================
  */

  const soldPercentage =
    summary.totalUnits > 0
      ? Math.min(
          100,
          (
            summary.soldUnits /
            summary.totalUnits
          ) * 100
        )
      : 0;

  /*
  ========================================
  RECOVERY %
  ========================================
  */

  const recoveryPercentage =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          summary
            .recoveryPercentage ||
            0
        )
      )
    );

  /*
  ========================================
  MAIN KPI CARDS
  ========================================
  */

  const cards = [
    {
      title:
        "Total Investment",

      value:
        formatMoney(
          summary.totalInvestment
        ),

      subtitle:
        `${formatNumber(
          summary.totalBatches
        )} Investment ${
          summary.totalBatches === 1
            ? "Batch"
            : "Batches"
        }`,

      icon: "💰",

      style:
        "border-blue-100 bg-gradient-to-br from-blue-50 to-white",
    },

    {
      title:
        "Potential Revenue",

      value:
        formatMoney(
          summary.potentialRevenue
        ),

      subtitle:
        "If all purchased stock is sold",

      icon: "📈",

      style:
        "border-violet-100 bg-gradient-to-br from-violet-50 to-white",
    },

    {
      title:
        "Potential Profit",

      value:
        formatMoney(
          summary.potentialProfit
        ),

      subtitle:
        "Expected profit after investment cost",

      icon: "🎯",

      style:
        "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
    },

    {
      title:
        "Actual Revenue",

      value:
        formatMoney(
          summary.actualRevenue
        ),

      subtitle:
        `${formatNumber(
          summary.salesCount
        )} delivered sale ${
          summary.salesCount === 1
            ? "allocation"
            : "allocations"
        }`,

      icon: "💳",

      style:
        "border-cyan-100 bg-gradient-to-br from-cyan-50 to-white",
    },

    {
      title:
        "Realized Profit",

      value:
        formatMoney(
          summary.realizedProfit
        ),

      subtitle:
        "Revenue minus realized landed cost",

      icon: "🏆",

      style:
        "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
    },

    {
      title:
        "ROI",

      value:
        `${Number(
          summary.roi || 0
        ).toFixed(1)}%`,

      subtitle:
        "Realized profit ÷ total investment",

      icon: "⚡",

      style:
        "border-pink-100 bg-gradient-to-br from-pink-50 to-white",
    },
  ];

  /*
  ========================================
  UI
  ========================================
  */

  return (
    <div className="space-y-6">
      {/* ================================= */}
      {/* MAIN FINANCIAL KPI CARDS */}
      {/* ================================= */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(
          (card) => (
            <div
              key={
                card.title
              }
              className={`rounded-3xl border p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.style}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {
                      card.title
                    }
                  </p>

                  <h2 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
                    {
                      card.value
                    }
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {
                      card.subtitle
                    }
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  {
                    card.icon
                  }
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* ================================= */}
      {/* REALIZED FINANCE BREAKDOWN */}
      {/* ================================= */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Delivered Sales
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-950">
              Realized Finance
              Breakdown
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Based only on
              confirmed delivered
              sales recorded in the
              Finance ledger.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              Finance Ledger
              Allocations
            </p>

            <p className="mt-1 text-xl font-bold text-slate-950">
              {formatNumber(
                summary.salesCount
              )}
            </p>
          </div>
        </div>

        {/* =============================== */}
        {/* COST BREAKDOWN */}
        {/* =============================== */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* COGS */}

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Product COGS
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatMoney(
                summary.costOfGoods
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Purchase cost of
              delivered units
            </p>
          </div>

          {/* EXTRA COST */}

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Allocated Extra
              Cost
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatMoney(
                summary
                  .allocatedExtraCost
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Shipping, customs
              and other batch
              costs
            </p>
          </div>

          {/* LANDED COST */}

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Realized Landed
              Cost
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatMoney(
                summary.realizedCost
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              COGS + allocated
              extra cost
            </p>
          </div>

          {/* PROFIT */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Realized Profit
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                summary.realizedProfit <
                0
                  ? "text-red-600"
                  : "text-emerald-700"
              }`}
            >
              {formatMoney(
                summary.realizedProfit
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Actual revenue
              minus landed cost
            </p>
          </div>
        </div>
      </div>

      {/* ================================= */}
      {/* INVESTMENT RECOVERY */}
      {/* ================================= */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Investment
              Recovery
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-950">
              {formatMoney(
                summary.actualRevenue
              )}{" "}
              recovered from{" "}
              {formatMoney(
                summary.totalInvestment
              )}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Based on actual
              delivered product
              revenue.
            </p>
          </div>

          <div className="rounded-2xl bg-blue-50 px-5 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Recovered
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-700">
              {recoveryPercentage.toFixed(
                1
              )}
              %
            </p>
          </div>
        </div>

        {/* =============================== */}
        {/* RECOVERY PROGRESS */}
        {/* =============================== */}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              Capital Recovery
            </span>

            <span>
              {recoveryPercentage.toFixed(
                1
              )}
              %
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
              style={{
                width: `${recoveryPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ================================= */}
      {/* STOCK PERFORMANCE */}
      {/* ================================= */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Investment Stock
              Performance
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-950">
              {formatNumber(
                summary.soldUnits
              )}{" "}
              of{" "}
              {formatNumber(
                summary.totalUnits
              )}{" "}
              units sold
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Sold units are
              updated through
              confirmed delivered
              Finance processing.
            </p>
          </div>

          {/* ============================= */}
          {/* QUANTITY SUMMARY */}
          {/* ============================= */}

          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {/* PURCHASED */}

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">
                Purchased
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatNumber(
                  summary.totalUnits
                )}
              </p>
            </div>

            {/* SOLD */}

            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700">
                Sold
              </p>

              <p className="mt-1 text-lg font-bold text-emerald-700">
                {formatNumber(
                  summary.soldUnits
                )}
              </p>
            </div>

            {/* REMAINING */}

            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700">
                Remaining
              </p>

              <p className="mt-1 text-lg font-bold text-amber-700">
                {formatNumber(
                  summary
                    .remainingUnits
                )}
              </p>
            </div>
          </div>
        </div>

        {/* =============================== */}
        {/* STOCK PROGRESS */}
        {/* =============================== */}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              Stock Sold
            </span>

            <span>
              {soldPercentage.toFixed(
                1
              )}
              %
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-500"
              style={{
                width: `${soldPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}