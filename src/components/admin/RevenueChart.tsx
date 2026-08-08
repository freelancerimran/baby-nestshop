"use client";

import { useMemo, useState } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  orders: any[];
}

const TIME_ZONE = "Asia/Dhaka";

/*
========================================
GET DHAKA DATE KEY
========================================
*/

function getDhakaDateKey(
  value: string | Date
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(date);

  const year =
    parts.find(
      (part) => part.type === "year"
    )?.value || "";

  const month =
    parts.find(
      (part) => part.type === "month"
    )?.value || "";

  const day =
    parts.find(
      (part) => part.type === "day"
    )?.value || "";

  return `${year}-${month}-${day}`;
}

/*
========================================
TODAY
========================================
*/

function getTodayDhaka(): string {
  return getDhakaDateKey(
    new Date()
  );
}

/*
========================================
ADD / SUBTRACT DAYS
========================================
*/

function addDays(
  dateKey: string,
  days: number
): string {
  const [year, month, day] =
    dateKey
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date
    .toISOString()
    .split("T")[0];
}

/*
========================================
FORMAT DATE
========================================
*/

function formatChartDate(
  dateKey: string
): string {
  const [year, month, day] =
    dateKey
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

/*
========================================
GET DATE RANGE
========================================
*/

function getDateRange(
  start: string,
  end: string
): string[] {
  if (!start || !end) {
    return [];
  }

  const dates: string[] = [];

  let current = start;

  while (current <= end) {
    dates.push(current);

    current = addDays(
      current,
      1
    );
  }

  return dates;
}

/*
========================================
REVENUE CHART
========================================
*/

export default function RevenueChart({
  orders,
}: RevenueChartProps) {
  /*
  ======================================
  RANGE STATE
  ======================================
  */

  const [range, setRange] =
    useState<
      "7" | "14" | "custom"
    >("7");

  const [customFrom, setCustomFrom] =
    useState("");

  const [customTo, setCustomTo] =
    useState("");

  /*
  ======================================
  TODAY
  ======================================
  */

  const today =
    getTodayDhaka();

  /*
  ======================================
  SELECTED DATE RANGE
  ======================================
  */

  const selectedRange =
    useMemo(() => {
      if (range === "7") {
        return {
          start: addDays(
            today,
            -6
          ),
          end: today,
        };
      }

      if (range === "14") {
        return {
          start: addDays(
            today,
            -13
          ),
          end: today,
        };
      }

      return {
        start: customFrom,
        end:
          customTo || customFrom,
      };
    }, [
      range,
      today,
      customFrom,
      customTo,
    ]);

  /*
  ======================================
  SALES ORDERS
  ======================================
  */

  const salesOrders =
    orders.filter(
      (order) =>
        String(
          order.status || ""
        ).toLowerCase() !==
        "cancelled"
    );

  /*
  ======================================
  DATE RANGE
  ======================================
  */

  const dateKeys =
    getDateRange(
      selectedRange.start,
      selectedRange.end
    );

  /*
  ======================================
  REVENUE BY DATE
  ======================================
  */

  const revenueByDate: Record<
    string,
    number
  > = {};

  const ordersByDate: Record<
    string,
    number
  > = {};

  salesOrders.forEach(
    (order) => {
      if (!order.date) {
        return;
      }

      const dateKey =
        getDhakaDateKey(
          order.date
        );

      if (!dateKey) {
        return;
      }

      const total =
        Number(
          order.total ?? 0
        );

      revenueByDate[dateKey] =
        (
          revenueByDate[
            dateKey
          ] || 0
        ) + total;

      ordersByDate[dateKey] =
        (
          ordersByDate[
            dateKey
          ] || 0
        ) + 1;
    }
  );

  /*
  ======================================
  CHART DATA
  ======================================
  */

  const labels =
    dateKeys.map(
      (date) =>
        formatChartDate(date)
    );

  const revenues =
    dateKeys.map(
      (date) =>
        revenueByDate[date] || 0
    );

  const orderCounts =
    dateKeys.map(
      (date) =>
        ordersByDate[date] || 0
    );

  /*
  ======================================
  SELECTED RANGE KPI
  ======================================
  */

  const selectedRevenue =
    revenues.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    );

  const selectedOrders =
    orderCounts.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    );

  const avgOrderValue =
    selectedOrders > 0
      ? Math.round(
          selectedRevenue /
            selectedOrders
        )
      : 0;

  /*
  ======================================
  TODAY REVENUE
  ======================================
  */

  const todayRevenue =
    revenueByDate[today] || 0;

  const todayOrders =
    ordersByDate[today] || 0;

  /*
  ======================================
  RANGE LABEL
  ======================================
  */

  const rangeLabel =
    range === "7"
      ? "7 DAYS"
      : range === "14"
      ? "14 DAYS"
      : "CUSTOM";

  /*
  ======================================
  CHART DATA
  ======================================
  */

  const data = {
    labels,

    datasets: [
      {
        label: "Revenue",

        data: revenues,

        borderColor:
          "#2563eb",

        backgroundColor:
          "rgba(37, 99, 235, 0.10)",

        fill: true,

        tension: 0.42,

        borderWidth: 3,

        pointRadius: 0,

        pointHoverRadius: 7,

        pointHoverBorderWidth: 3,

        pointHoverBackgroundColor:
          "#ffffff",

        pointHoverBorderColor:
          "#2563eb",

        pointHitRadius: 20,
      },
    ],
  };

  /*
  ======================================
  CHART OPTIONS
  ======================================
  */

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    interaction: {
      intersect: false,
      mode: "index" as const,
    },

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        displayColors: false,

        backgroundColor:
          "#0f172a",

        titleColor:
          "#ffffff",

        bodyColor:
          "#e2e8f0",

        borderColor:
          "rgba(255,255,255,0.08)",

        borderWidth: 1,

        padding: 12,

        cornerRadius: 12,

        titleFont: {
          size: 13,
          weight: 600,
        },

        bodyFont: {
          size: 13,
          weight: 500,
        },

        callbacks: {
          title:
            function (
              tooltipItems: any[]
            ) {
              return (
                tooltipItems[0]
                  ?.label || ""
              );
            },

          label:
            function (
              context: any
            ) {
              const index =
                context.dataIndex;

              return [
                `Revenue: ৳${Number(
                  revenues[index] || 0
                ).toLocaleString()}`,

                `Orders: ${
                  orderCounts[
                    index
                  ] || 0
                }`,
              ];
            },
        },
      },
    },

    scales: {
      x: {
        border: {
          display: false,
        },

        grid: {
          display: false,
        },

        ticks: {
          color: "#64748b",

          font: {
            size: 11,
            weight: 500,
          },

          padding: 8,

          maxRotation: 0,

          minRotation: 0,
        },
      },

      y: {
        beginAtZero: true,

        border: {
          display: false,
        },

        grid: {
          color:
            "rgba(148, 163, 184, 0.16)",

          drawTicks: false,
        },

        ticks: {
          color: "#64748b",

          font: {
            size: 11,
          },

          padding: 10,

          callback:
            function (
              value: any
            ) {
              return `৳${Number(
                value
              ).toLocaleString()}`;
            },
        },
      },
    },

    animation: {
      duration: 900,

      easing:
        "easeOutQuart" as const,
    },
  };

  /*
  ======================================
  UI
  ======================================
  */

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">

      {/* HEADER */}

      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Revenue Analytics
            </h2>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
              {rangeLabel}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Revenue performance
          </p>
        </div>

        {/* RIGHT SIDE */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

          {/* CUSTOM DATES */}

          {range === "custom" && (
            <div className="flex items-center gap-2">

              <input
                type="date"
                value={customFrom}
                onChange={(e) =>
                  setCustomFrom(
                    e.target.value
                  )
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />

              <span className="text-xs text-slate-400">
                →
              </span>

              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(e) =>
                  setCustomTo(
                    e.target.value
                  )
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />

            </div>
          )}

          {/* RANGE DROPDOWN */}

          <select
            value={range}
            onChange={(e) =>
              setRange(
                e.target.value as
                  | "7"
                  | "14"
                  | "custom"
              )
            }
            className="h-10 min-w-[145px] cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="7">
              Last 7 Days
            </option>

            <option value="14">
              Last 14 Days
            </option>

            <option value="custom">
              Custom Range
            </option>
          </select>

          {/* TODAY */}

          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm">
              ↗
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                Today Revenue
              </p>

              <p className="text-sm font-bold text-emerald-700">
                ৳
                {todayRevenue.toLocaleString()}
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* KPI CARDS */}

      <div className="grid gap-3 border-b border-slate-100 bg-slate-50/40 p-5 sm:grid-cols-3 sm:px-7">

        {/* Revenue */}

        <div className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-center justify-between">

            <p className="text-xs font-medium text-slate-500">
              Revenue
            </p>

            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs text-blue-600">
              ৳
            </span>

          </div>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            ৳
            {selectedRevenue.toLocaleString()}
          </h3>

          <p className="mt-1 text-[11px] text-slate-400">
            Selected period revenue
          </p>

        </div>

        {/* Orders */}

        <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-center justify-between">

            <p className="text-xs font-medium text-slate-500">
              Orders
            </p>

            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-600">
              #
            </span>

          </div>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {selectedOrders}
          </h3>

          <p className="mt-1 text-[11px] text-slate-400">
            Non-cancelled orders
          </p>

        </div>

        {/* Average */}

        <div className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-center justify-between">

            <p className="text-xs font-medium text-slate-500">
              Avg Order Value
            </p>

            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-xs text-violet-600">
              ↗
            </span>

          </div>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            ৳
            {avgOrderValue.toLocaleString()}
          </h3>

          <p className="mt-1 text-[11px] text-slate-400">
            Average order value
          </p>

        </div>

      </div>

      {/* CHART */}

      <div className="px-4 pb-5 pt-6 sm:px-7 sm:pb-7">

        <div className="h-[330px] sm:h-[380px]">

          <Line
            data={data}
            options={options}
          />

        </div>

        {/* FOOTER */}

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-blue-500" />

            <span>
              Revenue performance
            </span>

          </div>

          <div>
            Today:{" "}
            <span className="font-semibold text-slate-600">
              {todayOrders}
            </span>{" "}
            order
            {todayOrders !== 1
              ? "s"
              : ""}
          </div>

        </div>

      </div>

    </div>
  );
}