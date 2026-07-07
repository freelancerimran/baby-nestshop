"use client";

import { useState } from "react";
import Link from "next/link";

type Order = {
  id: number;
  order_id: string;
  order_date: string;

  product_id: string;
  product_name: string;
  product_slug: string;

  customer_name: string;
  phone: string;
  address: string;

  delivery_charge: number;
  discount: number;
  coupon_code: string;

  total: number;
  quantity: number | null;

  status: string;

  tracking_code: string | null;
  consignment_id: string | null;
  courier_status: string | null;

  created_at: string;
  product_price: number | null;

  payment_status: string;
  last_status_sync: string | null;

  district: string | null;
  delivery_area: string | null;
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [order, setOrder] =
    useState<Order | null>(null);

  const handleTrackOrder =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setLoading(true);
      setError("");
      setOrder(null);

      try {
        const response =
          await fetch(
            "/api/track-order",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                orderId,
                phone,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          setError(
            data.message ||
              "Order not found."
          );

          return;
        }

        setOrder(data.order);

      } catch (err) {
        console.error(err);

        setError(
          "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const getStatusBadge =
    (status: string) => {
      switch (
        status?.toLowerCase()
      ) {
        case "delivered":
          return "bg-green-100 text-green-700";

        case "processing":
          return "bg-blue-100 text-blue-700";

        case "partial delivered":
          return "bg-orange-100 text-orange-700";

        case "cancelled":
          return "bg-red-100 text-red-700";

        default:
          return "bg-yellow-100 text-yellow-700";
      }
    };

  const getTimelineStep =
    (status: string) => {
      const current =
        status?.toLowerCase();

      return {
        placed: true,

        confirmed:
          current !==
          "cancelled",

        shipped:
          current ===
            "processing" ||
          current ===
            "delivered" ||
          current ===
            "partial delivered",

        delivered:
          current ===
            "delivered" ||
          current ===
            "partial delivered",
      };
    };

  const timeline =
    getTimelineStep(
      order?.status || ""
    );
      return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Order Tracking
          </span>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Track Your Order
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Enter your order information below to check the latest status of your order.
          </p>
        </div>

        {/* Tracking Form */}
        <div className="mx-auto mb-16 max-w-3xl rounded-3xl bg-white p-8 shadow-sm">

          <h2 className="mb-6 text-2xl font-bold">
            Track Your Order
          </h2>

          <form
            onSubmit={handleTrackOrder}
            className="space-y-5"
          >

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Order ID
              </label>

              <input
                type="text"
                value={orderId}
                onChange={(e) =>
                  setOrderId(
                    e.target.value
                  )
                }
                placeholder="Enter your Order ID"
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Phone Number
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
                placeholder="Enter your phone number"
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-green-500"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-100 p-4 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-green-600 px-8 py-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {loading
                ? "Searching..."
                : "Track Order"}
            </button>

          </form>

        </div>

        {/* Order Result */}
        {order && (
          <>
            <div className="mb-16 rounded-3xl bg-white p-8 shadow-sm">

              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Order ID
                  </p>

                  <h3 className="text-xl font-bold">
                    {order.order_id}
                  </h3>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusBadge(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>

              </div>

              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <p className="text-sm text-gray-500">
                    Customer Name
                  </p>

                  <p className="font-medium">
                    {order.customer_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Phone Number
                  </p>

                  <p className="font-medium">
                    {order.phone}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Product
                  </p>

                  <p className="font-medium">
                    {order.product_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Delivery Status
                  </p>

                  <p className="font-medium text-green-600">
                    {order.courier_status ||
                      order.status}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Tracking Code
                  </p>

                  <p className="font-medium">
                    {order.tracking_code ||
                      "Not Available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Consignment ID
                  </p>

                  <p className="font-medium">
                    {order.consignment_id ||
                      "Not Available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Total Amount
                  </p>

                  <p className="font-medium">
                    ৳ {order.total}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Last Sync
                  </p>

                  <p className="font-medium">
                    {order.last_status_sync
                      ? new Date(
                          order.last_status_sync
                        ).toLocaleString()
                      : "Not Synced Yet"}
                  </p>
                </div>

              </div>

            </div>

            {/* Timeline */}
            <div className="mb-16">

              <h2 className="mb-10 text-center text-3xl font-bold">
                Delivery Progress
              </h2>

              <div className="grid gap-6 md:grid-cols-4">

                <div className={`rounded-3xl p-6 text-center shadow-sm ${
                  timeline.placed
                    ? "bg-green-50"
                    : "bg-white"
                }`}>
                  <div className="mb-3 text-4xl">🛒</div>

                  <h3 className="font-semibold">
                    Order Placed
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Order received successfully
                  </p>
                </div>

                <div className={`rounded-3xl p-6 text-center shadow-sm ${
                  timeline.confirmed
                    ? "bg-green-50"
                    : "bg-white"
                }`}>
                  <div className="mb-3 text-4xl">✅</div>

                  <h3 className="font-semibold">
                    Confirmed
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Order verified by team
                  </p>
                </div>

                <div className={`rounded-3xl p-6 text-center shadow-sm ${
                  timeline.shipped
                    ? "bg-green-50"
                    : "bg-white"
                }`}>
                  <div className="mb-3 text-4xl">🚚</div>

                  <h3 className="font-semibold">
                    Shipped
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Sent to courier partner
                  </p>
                </div>

                <div className={`rounded-3xl p-6 text-center shadow-sm ${
                  timeline.delivered
                    ? "bg-green-50"
                    : "bg-white"
                }`}>
                  <div className="mb-3 text-4xl">🎉</div>

                  <h3 className="font-semibold">
                    Delivered
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Order delivered successfully
                  </p>
                </div>

              </div>

            </div>
          </>
        )}

        {/* Support Section */}
        <div className="mb-16 rounded-3xl bg-white p-10 text-center shadow-sm">

          <h2 className="mb-4 text-3xl font-bold">
            Need Help With Your Order?
          </h2>

          <p className="mb-6 text-gray-600">
            If you're unable to find your order or need assistance,
            our support team is ready to help.
          </p>

          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-green-600 px-8 py-4 font-semibold text-white hover:bg-green-700"
          >
            Contact Support
          </Link>

        </div>

        {/* CTA Section */}
        <div className="rounded-3xl bg-green-600 p-12 text-center text-white">

          <h2 className="mb-4 text-4xl font-bold">
            Explore More Learning Products
          </h2>

          <p className="mb-8 text-lg text-green-100">
            Discover educational books and toys designed to help children learn and grow.
          </p>

          <Link
            href="/shop"
            className="inline-flex rounded-xl bg-white px-8 py-4 font-semibold text-green-600"
          >
            Explore Products
          </Link>

        </div>

      </div>
    </div>
  );
}