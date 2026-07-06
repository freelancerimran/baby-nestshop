"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface Props {
  orders: any[];
}

export default function OrderStatusChart({
  orders,
}: Props) {
  const pending = orders.filter(
    (o) => o.status === "Pending"
  ).length;

  const processing = orders.filter(
    (o) => o.status === "Processing"
  ).length;

  const delivered = orders.filter(
    (o) => o.status === "Delivered"
  ).length;

  const cancelled = orders.filter(
    (o) => o.status === "Cancelled"
  ).length;

  const data = {
    labels: [
      "Pending",
      "Processing",
      "Delivered",
      "Cancelled",
    ],
    datasets: [
      {
        data: [
          pending,
          processing,
          delivered,
          cancelled,
        ],
        backgroundColor: [
          "#f59e0b",
          "#3b82f6",
          "#10b981",
          "#ef4444",
        ],
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">
        Order Status
      </h2>

      <Doughnut data={data} />
    </div>
  );
}