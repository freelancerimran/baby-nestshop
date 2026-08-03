"use client";

import {
  useMemo,
  useState,
} from "react";

import OrderDetailsModal from "./OrderDetailsModal";
import BulkCourierModal from "./BulkCourierModal";

type Order = {
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

  /*
  ========================================
  PAYMENT
  ========================================
  */

  paidAmount?: number;
  dueAmount?: number;
  paymentStatus?: string;
};

export default function OrdersTable({
  orders,
}: {
  orders: Order[];
}) {
  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState<Order | null>(
    null
  );

  const [
    fromDate,
    setFromDate,
  ] = useState("");

  const [
    toDate,
    setToDate,
  ] = useState("");

  const [
    selectedOrders,
    setSelectedOrders,
  ] = useState<string[]>([]);

  const [
    showBulkCourierModal,
    setShowBulkCourierModal,
  ] = useState(false);

  /*
  ========================================
  SORT ORDERS
  ========================================
  */

  const sortedOrders = [
    ...orders,
  ].sort(
    (a, b) =>
      new Date(
        b.date
      ).getTime() -
      new Date(
        a.date
      ).getTime()
  );

  /*
  ========================================
  DATE FILTER
  ========================================
  */

  const filteredOrders =
    useMemo(() => {
      return sortedOrders.filter(
        (order) => {
          if (
            !fromDate &&
            !toDate
          ) {
            return true;
          }

          const orderDate =
            new Date(
              order.date
            );

          if (
            fromDate &&
            orderDate <
              new Date(
                fromDate
              )
          ) {
            return false;
          }

          if (toDate) {
            const endDate =
              new Date(
                toDate
              );

            endDate.setHours(
              23,
              59,
              59,
              999
            );

            if (
              orderDate >
              endDate
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      sortedOrders,
      fromDate,
      toDate,
    ]);

  /*
  ========================================
  TOTAL SALES
  ========================================

  Cancelled orders remain visible in
  order history, but their value must
  NOT be counted in Sales.
  ========================================
  */

  const totalSales =
    filteredOrders.reduce(
      (
        sum,
        order
      ) => {
        const isCancelled =
          order.status
            ?.trim()
            .toLowerCase() ===
          "cancelled";

        if (isCancelled) {
          return sum;
        }

        return (
          sum +
          Number(
            order.total ?? 0
          )
        );
      },
      0
    );

  /*
  ========================================
  SELECT ALL
  ========================================
  */

  const handleSelectAll = (
    checked: boolean
  ) => {
    if (checked) {
      setSelectedOrders(
        filteredOrders.map(
          (order) =>
            order.orderId
        )
      );
    } else {
      setSelectedOrders(
        []
      );
    }
  };

  /*
  ========================================
  SELECT SINGLE ORDER
  ========================================
  */

  const handleSelectOrder = (
    orderId: string
  ) => {
    setSelectedOrders(
      (prev) =>
        prev.includes(
          orderId
        )
          ? prev.filter(
              (id) =>
                id !==
                orderId
            )
          : [
              ...prev,
              orderId,
            ]
    );
  };

  /*
  ========================================
  ORDER STATUS BADGE
  ========================================
  */

  const getStatusBadge = (
    status: string
  ) => {
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

  /*
  ========================================
  PAYMENT INFORMATION
  ========================================
  */

  const getPaymentInfo = (
    order: Order
  ) => {
    const total =
      Number(
        order.total ?? 0
      );

    const paidAmount =
      Number(
        order.paidAmount ??
          0
      );

    /*
    dueAmount = 0 must stay 0.
    */

    const dueAmount =
      order.dueAmount !==
        undefined &&
      order.dueAmount !==
        null
        ? Math.max(
            0,
            Number(
              order.dueAmount
            )
          )
        : Math.max(
            0,
            total -
              paidAmount
          );

    /*
    Use database status first.
    If missing, calculate it.
    */

    let paymentStatus =
      order.paymentStatus;

    if (
      !paymentStatus
    ) {
      if (
        total > 0 &&
        dueAmount <= 0
      ) {
        paymentStatus =
          "Paid";
      } else if (
        paidAmount > 0 &&
        dueAmount > 0
      ) {
        paymentStatus =
          "Partially Paid";
      } else {
        paymentStatus =
          "Unpaid";
      }
    }

    return {
      total,
      paidAmount,
      dueAmount,
      paymentStatus,
    };
  };

  /*
  ========================================
  PAYMENT BADGE STYLE
  ========================================
  */

  const getPaymentBadge =
    (
      paymentStatus:
        string
    ) => {
      switch (
        paymentStatus
          ?.toLowerCase()
      ) {
        case "paid":
          return "bg-green-100 text-green-700";

        case "partially paid":
        case "partial":
          return "bg-orange-100 text-orange-700";

        case "unpaid":
          return "bg-red-100 text-red-700";

        default:
          return "bg-gray-100 text-gray-700";
      }
    };

  return (
    <>
      {/* ===================================
          FILTER / SUMMARY
      =================================== */}

      <div className="mb-6 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              From Date
            </label>

            <input
              type="date"
              value={
                fromDate
              }
              onChange={(
                e
              ) =>
                setFromDate(
                  e.target
                    .value
                )
              }
              className="rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              To Date
            </label>

            <input
              type="date"
              value={
                toDate
              }
              onChange={(
                e
              ) =>
                setToDate(
                  e.target
                    .value
                )
              }
              className="rounded-lg border px-3 py-2"
            />
          </div>

          <button
            onClick={() => {
              setFromDate(
                ""
              );

              setToDate(
                ""
              );
            }}
            className="rounded-lg bg-gray-700 px-4 py-2 text-white"
          >
            Reset
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm font-medium">
          <div>
            Orders:{" "}
            {
              filteredOrders.length
            }
          </div>

          <div>
            Sales: ৳
            {totalSales.toLocaleString()}
          </div>

          <div>
            Selected:{" "}
            {
              selectedOrders.length
            }
          </div>
        </div>
      </div>

      {/* ===================================
          BULK ACTIONS
      =================================== */}

      {selectedOrders.length >
        0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border bg-blue-50 p-4">
          <div className="font-medium">
            Selected Orders:{" "}
            {
              selectedOrders.length
            }
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                setShowBulkCourierModal(
                  true
                )
              }
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Send To Courier
            </button>

            <button
              onClick={() => {
                const ids =
                  selectedOrders.join(
                    ","
                  );

                window.open(
                  `/print-labels?ids=${ids}`,
                  "_blank"
                );
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Print Labels
            </button>
          </div>
        </div>
      )}

      {/* ===================================
          ORDERS TABLE
      =================================== */}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    filteredOrders.length >
                      0 &&
                    selectedOrders.length ===
                      filteredOrders.length
                  }
                  onChange={(
                    e
                  ) =>
                    handleSelectAll(
                      e.target
                        .checked
                    )
                  }
                />
              </th>

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
                Payment
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-left">
                Courier Status
              </th>

              <th className="p-3 text-left">
                Consignment ID
              </th>

              <th className="p-3 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map(
              (order) => {
                const {
                  dueAmount,
                  paymentStatus,
                } =
                  getPaymentInfo(
                    order
                  );

                const normalizedStatus =
                  paymentStatus.toLowerCase();

                const isPaid =
                  normalizedStatus ===
                  "paid";

                const isPartial =
                  normalizedStatus ===
                    "partially paid" ||
                  normalizedStatus ===
                    "partial";

                const isUnpaid =
                  normalizedStatus ===
                  "unpaid";

                return (
                  <tr
                    key={
                      order.orderId
                    }
                    className="border-t"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(
                          order.orderId
                        )}
                        onChange={() =>
                          handleSelectOrder(
                            order.orderId
                          )
                        }
                      />
                    </td>

                    <td className="p-3">
                      {
                        order.orderId
                      }
                    </td>

                    <td className="p-3">
                      {order.date
                        ? new Intl.DateTimeFormat(
                            "en-GB",
                            {
                              day: "numeric",
                              month:
                                "short",
                              year:
                                "numeric",
                              timeZone:
                                "Asia/Dhaka",
                            }
                          ).format(
                            new Date(
                              order.date
                            )
                          )
                        : "-"}
                    </td>

                    <td className="p-3">
                      {
                        order.customerName
                      }
                    </td>

                    <td className="p-3">
                      {
                        order.phone
                      }
                    </td>

                    <td className="p-3">
                      {
                        order.productName
                      }
                    </td>

                    <td className="p-3">
                      {
                        order.quantity
                      }
                    </td>

                    <td className="p-3">
                      ৳{" "}
                      {Number(
                        order.total ||
                          0
                      ).toLocaleString()}
                    </td>

                    {/* =====================
                        PAYMENT
                    ===================== */}

                    <td className="p-3">
                      <div className="flex min-w-[105px] flex-col items-start gap-1">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getPaymentBadge(
                            paymentStatus
                          )}`}
                        >
                          {isPartial
                            ? "Partial"
                            : paymentStatus}
                        </span>

                        {isPartial && (
                          <span className="whitespace-nowrap text-xs font-medium text-orange-700">
                            Due ৳
                            {dueAmount.toLocaleString()}
                          </span>
                        )}

                        {isUnpaid && (
                          <span className="whitespace-nowrap text-xs text-gray-500">
                            COD ৳
                            {dueAmount.toLocaleString()}
                          </span>
                        )}

                        {isPaid && (
                          <span className="whitespace-nowrap text-xs text-green-700">
                            COD ৳0
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ORDER STATUS */}

                    <td className="p-3">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {
                          order.status
                        }
                      </span>
                    </td>

                    {/* COURIER STATUS */}

                    <td className="p-3">
                      {order.courierStatus ||
                        "-"}
                    </td>

                    {/* CONSIGNMENT */}

                    <td className="p-3">
                      {order.consignmentId ||
                        "-"}
                    </td>

                    {/* ACTION */}

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
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {/* ===================================
          ORDER DETAILS MODAL
      =================================== */}

      {selectedOrder && (
        <OrderDetailsModal
          order={
            selectedOrder
          }
          onClose={() =>
            setSelectedOrder(
              null
            )
          }
        />
      )}

      {/* ===================================
          BULK COURIER MODAL
      =================================== */}

      {showBulkCourierModal && (
        <BulkCourierModal
          selectedOrders={
            selectedOrders
          }
          orders={filteredOrders.map(
            (order) => ({
              orderId:
                order.orderId,

              consignmentId:
                order.consignmentId,
            })
          )}
          onClose={() =>
            setShowBulkCourierModal(
              false
            )
          }
        />
      )}
    </>
  );
}