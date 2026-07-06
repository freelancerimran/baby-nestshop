"use client";

import { useState } from "react";

interface Order {
  orderId: string;
  date: string;

  productId: string;
  productName: string;
  productSlug: string;

  customerName: string;
  phone: string;
  district: string;
  deliveryArea: string;
  address: string;

  deliveryCharge: number;
  discount: number;
  couponCode: string;

  quantity: number;
  productPrice: number;
  total: number;

  status: string;

  trackingCode?: string;
  consignmentId?: string;
  courierStatus?: string;

  lastStatusSync?: string;
  paymentStatus?: string;
}

interface Props {
  order: Order;
  onClose: () => void;
}

export default function OrderDetailsModal({
  order,
  onClose,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [courierStatus, setCourierStatus] =
    useState(order.courierStatus);

  const [orderStatus, setOrderStatus] =
    useState(order.status);

  const [lastSync, setLastSync] =
    useState(order.lastStatusSync);

  const [consignmentId, setConsignmentId] =
    useState(
      order.consignmentId || ""
    );

  const [trackingCode, setTrackingCode] =
    useState(
      order.trackingCode || ""
    );

  const handleSendToCourier =
    async () => {
      try {
        setLoading(true);
        setMessage("");

        const response = await fetch(
          "/api/admin/send-to-courier",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              orderId: order.orderId,
            }),
          }
        );

        const data =
          await response.json();

        if (data.success) {
          setConsignmentId(
            String(
              data.consignmentId
            )
          );

          setTrackingCode(
            data.trackingCode
          );

          setCourierStatus(
            data.courierStatus ||
              "Processing"
          );

          setOrderStatus(
            "Processing"
          );

          setMessage(
            "✅ Order sent to courier successfully."
          );
        } else {
          setMessage(
            data.message ||
              "Failed to send order."
          );
        }
      } catch (error) {
        console.error(error);

        setMessage(
          "Failed to send order."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleRefreshStatus =
    async () => {
      try {
        setRefreshing(true);
        setMessage("");

        const response = await fetch(
          "/api/admin/update-courier-status",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              orderId: order.orderId,
            }),
          }
        );

        const data =
          await response.json();

        if (data.success) {
          setCourierStatus(
            data.courierStatus
          );

          setOrderStatus(
            data.orderStatus
          );

          setLastSync(
            new Date().toISOString()
          );

          setMessage(
            "✅ Courier status updated."
          );
        } else {
          setMessage(
            data.message ||
              "Status update failed."
          );
        }
      } catch (error) {
        console.error(error);

        setMessage(
          "Status update failed."
        );
      } finally {
        setRefreshing(false);
      }
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Order Details
          </h2>

          <button
            onClick={onClose}
            className="rounded bg-gray-200 px-3 py-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">

          <p>
            <strong>Order ID:</strong>{" "}
            {order.orderId}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {order.date}
          </p>

          <p>
            <strong>Customer:</strong>{" "}
            {order.customerName}
          </p>

          <p>
            <strong>Phone:</strong>{" "}
            {order.phone}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {order.address}
          </p>

          <p>
            <strong>District:</strong>{" "}
            {order.district || "N/A"}
          </p>

          <p>
            <strong>Delivery Area:</strong>{" "}
            {order.deliveryArea || "N/A"}
          </p>

          <p>
            <strong>Product:</strong>{" "}
            {order.productName}
          </p>

          <p>
            <strong>Quantity:</strong>{" "}
            {order.quantity}
          </p>

          <p>
            <strong>Total:</strong> ৳
            {order.total}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {orderStatus}
          </p>

          <hr className="my-4" />

          <h3 className="text-lg font-bold">
            Courier Information
          </h3>

          <p>
            <strong>
              Consignment ID:
            </strong>{" "}
            {consignmentId ||
              "Not Sent"}
          </p>

          <p>
            <strong>
              Tracking Code:
            </strong>{" "}
            {trackingCode ||
              "Not Available"}
          </p>

          <p>
            <strong>
              Courier Status:
            </strong>{" "}
            {courierStatus ||
              "Not Available"}
          </p>

          <p>
            <strong>
              Last Sync:
            </strong>{" "}
            {lastSync
              ? new Date(
                  lastSync
                ).toLocaleString()
              : "Never"}
          </p>

          {message && (
            <div className="rounded bg-green-100 p-3 text-sm">
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-4">

            {!consignmentId ? (
              <button
                onClick={
                  handleSendToCourier
                }
                disabled={loading}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                {loading
                  ? "Sending..."
                  : "Send To Courier"}
              </button>
            ) : (
              <div className="rounded bg-green-100 px-4 py-2 font-medium text-green-700">
                ✅ Sent To Courier
              </div>
            )}

            {consignmentId && (
              <button
                onClick={
                  handleRefreshStatus
                }
                disabled={refreshing}
                className="rounded bg-orange-500 px-4 py-2 text-white"
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh Status"}
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}