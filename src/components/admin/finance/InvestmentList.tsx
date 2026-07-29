"use client";

import type { Investment } from "@/types/finance";

interface InvestmentListProps {
  investments: Investment[];
  onSelect: (investment: Investment) => void;
}

function money(value?: number) {
  return `৳${Number(value || 0).toLocaleString("en-GB")}`;
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InvestmentList({
  investments,
  onSelect,
}: InvestmentListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}

      <div className="flex flex-col gap-3 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Investment History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track every investment batch separately.
          </p>
        </div>

        <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
          {investments.length}{" "}
          {investments.length === 1 ? "Batch" : "Batches"}
        </div>
      </div>

      {/* EMPTY STATE */}

      {investments.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            💼
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-900">
            No investments yet
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Create your first investment batch to start tracking cost,
            stock, revenue, profit and ROI.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Investment
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Investment
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Potential Revenue
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Profit
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {investments.map((investment, index) => {
                const name =
                  investment.investmentName ||
                  investment.investment_name ||
                  `Investment #${index + 1}`;

                const code =
                  investment.investmentCode ||
                  investment.investment_code ||
                  "—";

                const date =
                  investment.investmentDate ||
                  investment.investment_date;

                const totalInvestment =
                  investment.totalInvestment ??
                  investment.total_investment ??
                  0;

                const potentialRevenue =
                  investment.potentialRevenue ??
                  investment.potential_revenue ??
                  0;

                const potentialProfit =
                  investment.potentialProfit ??
                  investment.potential_profit ??
                  0;

                const totalUnits =
                  investment.totalUnits ??
                  investment.total_units ??
                  0;

                const soldUnits =
                  investment.soldUnits ??
                  investment.sold_units ??
                  0;

                const remainingUnits =
                  investment.remainingUnits ??
                  investment.remaining_units ??
                  Math.max(
                    0,
                    Number(totalUnits) - Number(soldUnits)
                  );

                const status =
                  investment.status || "active";

                return (
                  <tr
                    key={investment.id ?? code ?? index}
                    onClick={() => onSelect(investment)}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/50"
                  >
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">
                        {name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {code}
                      </p>

                      {investment.supplier && (
                        <p className="mt-1 text-xs text-slate-400">
                          {investment.supplier}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-5 text-sm text-slate-600">
                      {formatDate(date)}
                    </td>

                    <td className="px-4 py-5 font-semibold text-slate-900">
                      {money(totalInvestment)}
                    </td>

                    <td className="px-4 py-5 font-semibold text-blue-600">
                      {money(potentialRevenue)}
                    </td>

                    <td className="px-4 py-5 font-semibold text-emerald-600">
                      {money(potentialProfit)}
                    </td>

                    <td className="px-4 py-5">
                      <div className="text-sm font-semibold text-slate-900">
                        {soldUnits} / {totalUnits}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {remainingUnits} left
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold capitalize text-emerald-700">
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}