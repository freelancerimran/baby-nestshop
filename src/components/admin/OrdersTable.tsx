"use client";

import { useState } from "react";
import OrderDetailsModal from "./OrderDetailsModal";

type Order = {
  orderId: string;
  date: string;

  productId: string;
  productName: string;
  productSlug: string;

  customerName: string;
  phone: string;
  address: string;

  deliveryCharge: number;
  discount: number;
  couponCode: string;

  quantity: number;
  total: number;

  status: string;

  trackingCode?: string;
  consignmentId?: string;
  courierStatus?: string;
};

export default function OrdersTable({
  orders,
}: {
  orders: Order[];
}) {
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  );

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">
                Order ID
              </th>

              <th className="p-3 text-left">
                Date
              </th>

              <th className="p-3 text-left">
                Customer
              </th>

              <th className="p-3 text-left">
                Phone
              </th>

              <th className="p-3 text-left">
                Product
              </th>

              <th className="p-3 text-left">
                Qty
              </th>

              <th className="p-3 text-left">
                Total
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedOrders.map((order) => (
              <tr
                key={order.orderId}
                className="border-t"
              >
                <td className="p-3">
                  {order.orderId}
                </td>

                <td className="p-3">
                  {order.date
                    ? new Intl.DateTimeFormat(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone:
                            "Asia/Dhaka",
                        }
                      ).format(
                        new Date(order.date)
                      )
                    : "-"}
                </td>

                <td className="p-3">
                  {order.customerName}
                </td>

                <td className="p-3">
                  {order.phone}
                </td>

                <td className="p-3">
                  {order.productName}
                </td>

                <td className="p-3">
                  {order.quantity}
                </td>

                <td className="p-3">
                  ৳ {order.total}
                </td>

                <td className="p-3">
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">
                    {order.status}
                  </span>
                </td>

                <td className="p-3">
                  <button
                    onClick={() =>
                      setSelectedOrder(
                        order
                      )
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() =>
            setSelectedOrder(null)
          }
        />
      )}
    </>
  );
}