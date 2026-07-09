"use client";

import {
  Package,
  Clock3,
  Box,
  Truck,
  CheckCircle2,
  Hash,
  Wallet,
  TrendingUp,
} from "lucide-react";

type Stats = {
  todayOrders: number;
  pendingPacking: number;
  packed: number;
  dispatched: number;
  delivered: number;
  totalQty: number;
  todayCod: number;
};

interface SummaryCardsProps {
  stats?: Stats;
}

const defaultStats: Stats = {
  todayOrders: 0,
  pendingPacking: 0,
  packed: 0,
  dispatched: 0,
  delivered: 0,
  totalQty: 0,
  todayCod: 0,
};

export default function SummaryCards(props: SummaryCardsProps) {
  const stats = props.stats ?? defaultStats;

  const cards = [
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      subtitle: "+12% Today",
      icon: Package,
      gradient: "from-blue-500 to-cyan-500",
      badge: "Growing",
    },
    {
      title: "Pending Packing",
      value: stats.pendingPacking,
      subtitle: "Need Attention",
      icon: Clock3,
      gradient: "from-yellow-500 to-orange-500",
      badge: "Pending",
    },
    {
      title: "Packed",
      value: stats.packed,
      subtitle: "Ready To Ship",
      icon: Box,
      gradient: "from-green-500 to-emerald-500",
      badge: "Ready",
    },
    {
      title: "Dispatched",
      value: stats.dispatched,
      subtitle: "Courier Assigned",
      icon: Truck,
      gradient: "from-violet-500 to-purple-500",
      badge: "Transit",
    },
    {
      title: "Delivered",
      value: stats.delivered,
      subtitle: "Completed",
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-500",
      badge: "Success",
    },
    {
      title: "Total Qty",
      value: stats.totalQty,
      subtitle: "Items",
      icon: Hash,
      gradient: "from-orange-500 to-red-500",
      badge: "Stock",
    },
    {
      title: "Today's COD",
      value: `৳${stats.todayCod.toLocaleString()}`,
      subtitle: "Revenue",
      icon: Wallet,
      gradient: "from-pink-500 to-rose-500",
      badge: "Cash",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Gradient Glow */}
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.gradient}`}
            />

            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  {card.badge}
                </span>

                <p className="mt-3 text-sm font-medium text-gray-500">
                  {card.title}
                </p>

                <h3 className="mt-2 text-3xl font-bold text-gray-900">
                  {card.value}
                </h3>

                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3" />
                  {card.subtitle}
                </div>
              </div>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}
              >
                <Icon className="h-7 w-7" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}