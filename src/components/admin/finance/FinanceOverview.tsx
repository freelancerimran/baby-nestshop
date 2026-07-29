"use client";

interface FinanceSummary {
  totalInvestment: number;
  potentialRevenue: number;
  potentialProfit: number;
  actualRevenue: number;
  realizedProfit: number;
  totalUnits: number;
  soldUnits: number;
  remainingUnits: number;
  roi: number;
  totalBatches: number;
}

interface FinanceOverviewProps {
  summary: FinanceSummary;
}

function formatMoney(value: number) {
  return `৳${Number(value || 0).toLocaleString("en-GB")}`;
}

export default function FinanceOverview({
  summary,
}: FinanceOverviewProps) {
  const cards = [
    {
      title: "Total Investment",
      value: formatMoney(summary.totalInvestment),
      subtitle: `${summary.totalBatches} Investment Batches`,
      icon: "💰",
      style:
        "border-blue-100 bg-gradient-to-br from-blue-50 to-white",
    },
    {
      title: "Potential Revenue",
      value: formatMoney(summary.potentialRevenue),
      subtitle: "If all stock is sold",
      icon: "📈",
      style:
        "border-violet-100 bg-gradient-to-br from-violet-50 to-white",
    },
    {
      title: "Potential Profit",
      value: formatMoney(summary.potentialProfit),
      subtitle: "Expected gross profit",
      icon: "🎯",
      style:
        "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
    },
    {
      title: "Actual Revenue",
      value: formatMoney(summary.actualRevenue),
      subtitle: "Revenue generated",
      icon: "💳",
      style:
        "border-cyan-100 bg-gradient-to-br from-cyan-50 to-white",
    },
    {
      title: "Realized Profit",
      value: formatMoney(summary.realizedProfit),
      subtitle: "Profit from sold units",
      icon: "🏆",
      style:
        "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
    },
    {
      title: "ROI",
      value: `${Number(summary.roi || 0).toFixed(1)}%`,
      subtitle: "Return on investment",
      icon: "⚡",
      style:
        "border-pink-100 bg-gradient-to-br from-pink-50 to-white",
    },
  ];

  const soldPercentage =
    summary.totalUnits > 0
      ? Math.min(
          100,
          (summary.soldUnits / summary.totalUnits) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Financial KPI Cards */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-3xl border p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.style}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {card.value}
                </h2>

                <p className="mt-2 text-xs text-slate-500">
                  {card.subtitle}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Performance */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Investment Stock Performance
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-950">
              {summary.soldUnits.toLocaleString("en-GB")} of{" "}
              {summary.totalUnits.toLocaleString("en-GB")} units sold
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500">
                Purchased
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {summary.totalUnits.toLocaleString("en-GB")}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Sold
              </p>

              <p className="mt-1 text-lg font-bold text-emerald-600">
                {summary.soldUnits.toLocaleString("en-GB")}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Remaining
              </p>

              <p className="mt-1 text-lg font-bold text-amber-600">
                {summary.remainingUnits.toLocaleString("en-GB")}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Stock Sold</span>

            <span>
              {soldPercentage.toFixed(1)}%
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