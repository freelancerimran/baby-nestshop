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

  const revenueByDate: Record<
    string,
    number
  > = {};

  orders.forEach((order) => {

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

  });

  const labels =
    Object.keys(
      revenueByDate
    );

  const revenues =
    labels.map(
      (label) =>
        revenueByDate[
          label
        ]
    );

  const data = {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: revenues,

        borderColor:
          "#4f46e5",

        backgroundColor:
          "rgba(79,70,229,0.15)",

        fill: true,

        tension: 0.45,

        borderWidth: 3,

        pointRadius: 4,

        pointHoverRadius: 6,
      },
    ],
  };

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
            return `৳${context.raw.toLocaleString()}`;
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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      <div className="mb-6">

        <h2 className="text-xl font-semibold">
          Revenue Trend
        </h2>

        <p className="text-sm text-slate-500">
          Revenue performance overview
        </p>

      </div>

      <div className="h-[350px]">

        <Line
          data={data}
          options={options}
        />

      </div>

    </div>
  );
}