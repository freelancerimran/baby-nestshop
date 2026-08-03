"use client";

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

export default function RevenueChart({
  orders,
}: RevenueChartProps) {
  /*
  ========================================
  SALES ORDERS
  ========================================

  Safety layer:

  Cancelled orders must never contribute
  to revenue analytics even if the parent
  accidentally passes all orders.
  ========================================
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
  ========================================
  REVENUE BY DATE
  ========================================
  */

  const revenueByDate: Record<
    string,
    number
  > = {};

  salesOrders.forEach(
    (order) => {
      const rawDate =
        order.date ||
        new Date().toISOString();

      const formattedDate =
        new Date(
          rawDate
        ).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        );

      revenueByDate[
        formattedDate
      ] =
        (
          revenueByDate[
            formattedDate
          ] || 0
        ) +
        Number(
          order.total || 0
        );
    }
  );

  /*
  ========================================
  LAST 7 REVENUE DATES
  ========================================
  */

  const labels =
    Object.keys(
      revenueByDate
    ).slice(-7);

  const revenues =
    labels.map(
      (label) =>
        revenueByDate[
          label
        ]
    );

  /*
  ========================================
  KPI VALUES
  ========================================
  */

  const totalRevenue =
    salesOrders.reduce(
      (
        sum: number,
        order: any
      ) =>
        sum +
        Number(
          order.total || 0
        ),
      0
    );

  const totalOrders =
    salesOrders.length;

  const avgOrderValue =
    totalOrders > 0
      ? Math.round(
          totalRevenue /
            totalOrders
        )
      : 0;

  /*
  ========================================
  CHART DATA
  ========================================
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
          "rgba(37,99,235,0.15)",

        fill: true,

        tension: 0.6,

        borderWidth: 5,

        pointRadius: 0,

        pointHoverRadius: 8,

        pointHoverBorderWidth: 3,

        pointHoverBackgroundColor:
          "#2563eb",
      },
    ],
  };

  /*
  ========================================
  CHART OPTIONS
  ========================================
  */

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: function (
            context: any
          ) {
            return `Revenue: ৳${Number(
              context.raw || 0
            ).toLocaleString()}`;
          },
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          callback: function (
            value: any
          ) {
            return `৳${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Revenue Analytics
          </h2>

          <p className="text-sm text-slate-500">
            Last 7 days revenue
            performance
          </p>
        </div>

        <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
          ↗ Growing Revenue
        </div>
      </div>

      {/* KPI Cards */}

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-blue-50 p-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Revenue
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            ৳
            {totalRevenue.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-sm text-slate-500">
            Orders
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {totalOrders}
          </h3>
        </div>

        <div className="rounded-2xl bg-purple-50 p-4">
          <p className="text-sm text-slate-500">
            Avg Order Value
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            ৳
            {avgOrderValue.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Chart */}

      <div className="h-[420px]">
        <Line
          data={data}
          options={options}
        />
      </div>
    </div>
  );
}