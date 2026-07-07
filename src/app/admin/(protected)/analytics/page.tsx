"use client";

import { useEffect, useState } from "react";

import RevenueChart from "@/components/admin/RevenueChart";
import OrderStatusChart from "@/components/admin/OrderStatusChart";
import MetricCard from "@/components/admin/analytics/MetricCard";

import InventoryHealth from "@/components/admin/analytics/InventoryHealth";
import TopProducts from "@/components/admin/analytics/TopProducts";

import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
} from "lucide-react";

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ordersRes, productsRes] =
        await Promise.all([
          fetch("/api/admin/orders"),
          fetch("/api/admin/products"),
        ]);

      const ordersData =
        await ordersRes.json();

      const productsData =
        await productsRes.json();

      setOrders(
        ordersData.orders || []
      );

      setProducts(
        productsData.products || []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading Analytics...
      </div>
    );
  }

  const totalOrders = orders.length;

  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const totalProducts =
    products.length;

  const lowStock = products.filter(
    (p) => Number(p.realStock) <= 10
  ).length;

  const today = new Date()
  .toISOString()
  .split("T")[0];

const todayRevenue = orders
  .filter((order) => {
    if (!order.date) return false;

    return order.date.startsWith(
      today
    );
  })
  .reduce(
    (sum, order) =>
      sum +
      Number(order.total || 0),
    0
  );

const averageOrderValue =
  totalOrders > 0
    ? Math.round(
        totalRevenue /
          totalOrders
      )
    : 0;

const deliveredOrders =
  orders.filter(
    (o) =>
      o.status ===
      "Delivered"
  ).length;

const deliveredRate =
  totalOrders > 0
    ? Math.round(
        (deliveredOrders /
          totalOrders) *
          100
      )
    : 0;

const productCounts:
  Record<string, number> = {};

orders.forEach((order) => {
  const name =
    order.productName ||
    "Unknown";

  productCounts[name] =
    (productCounts[name] || 0) + 1;
});

const bestSellingProduct =
  Object.entries(
    productCounts
  )
    .sort(
      (a, b) =>
        b[1] - a[1]
    )[0]?.[0] ||
  "N/A";

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">

      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Analytics Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Business Insights & Performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <MetricCard
          title="Revenue"
          value={`৳${totalRevenue.toLocaleString()}`}
          description="Total Revenue"
          gradient="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700"
          icon={<DollarSign size={42} />}
        />

        <MetricCard
          title="Orders"
          value={totalOrders}
          description="Customer Orders"
          gradient="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700"
          icon={<ShoppingCart size={42} />}
        />

        <MetricCard
          title="Products"
          value={totalProducts}
          description="Active Products"
          gradient="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-700"
          icon={<Package size={42} />}
        />

        <MetricCard
          title="Low Stock"
          value={lowStock}
          description="Need Attention"
          gradient="bg-gradient-to-br from-rose-500 via-pink-600 to-red-600"
          icon={<AlertTriangle size={42} />}
        />
        <MetricCard
  title="Today Revenue"
  value={`৳${todayRevenue.toLocaleString()}`}
  description="Today's Sales"
  gradient="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700"
  icon={<DollarSign size={42} />}
/>

<MetricCard
  title="Avg Order"
  value={`৳${averageOrderValue}`}
  description="Average Order Value"
  gradient="bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700"
  icon={<ShoppingCart size={42} />}
/>

<MetricCard
  title="Delivered Rate"
  value={`${deliveredRate}%`}
  description="Delivery Success"
  gradient="bg-gradient-to-br from-green-500 via-emerald-600 to-green-700"
  icon={<Package size={42} />}
/>

<MetricCard
  title="Best Product"
  value={bestSellingProduct}
  description="Top Seller"
  gradient="bg-gradient-to-br from-amber-500 via-orange-600 to-red-600"
  icon={<Package size={42} />}
/>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2">
          <RevenueChart
            orders={orders}
          />
        </div>

        <div>
          <OrderStatusChart
            orders={orders}
          />
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

  <InventoryHealth
    products={products}
  />

  <TopProducts
    orders={orders}
  />

</div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-4">
          Recent Orders
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left p-3">
                  Order
                </th>

                <th className="text-left p-3">
                  Customer
                </th>

                <th className="text-left p-3">
                  Product
                </th>

                <th className="text-left p-3">
                  Total
                </th>

                <th className="text-left p-3">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {orders
                .slice(0, 10)
                .map((order) => (
                  <tr
                    key={
                      order.orderId
                    }
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="p-3 font-medium">
                      {
                        order.orderId
                      }
                    </td>

                    <td className="p-3">
                      {
                        order.customerName
                      }
                    </td>

                    <td className="p-3">
                      {
                        order.productName
                      }
                    </td>

                    <td className="p-3 font-semibold">
                      ৳
                      {order.total}
                    </td>

                    <td className="p-3">
                      <StatusBadge
                        status={
                          order.status
                        }
                      />
                    </td>
                  </tr>
                ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (
    status === "Delivered"
  ) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Delivered
      </span>
    );
  }

  if (
    status === "Processing"
  ) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        Processing
      </span>
    );
  }

  if (
    status === "Cancelled"
  ) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
      Pending
    </span>
  );
}