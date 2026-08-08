"use client";

import {
  useMemo,
  useState,
} from "react";

import OrderDetailsModal from "./OrderDetailsModal";
import BulkCourierModal from "./BulkCourierModal";
import SyncAllCourierButton from "./SyncAllCourierButton";

/*
========================================
ORDER ITEM
========================================
*/

type OrderItem = {
  id?: number;

  productId: string;

  productName: string;

  quantity: number;

  unitPrice: number;

  lineTotal: number;
};

/*
========================================
ORDER
========================================
*/

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
  MULTI PRODUCT
  ========================================
  */

  items?: OrderItem[];

  totalItems?: number;

  orderType?: string;

  /*
  ========================================
  PAYMENT
  ========================================
  */

  paidAmount?: number;

  dueAmount?: number;

  paymentStatus?: string;

  /*
  ========================================
  TOTALS
  ========================================
  */

  subtotal?: number;

  grandTotal?: number;
};

/*
========================================
PROPS
========================================
*/

export default function OrdersTable({
  orders,
}: {
  orders: Order[];
}) {
  /*
  ========================================
  SELECTED ORDER
  ========================================
  */

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState<Order | null>(
    null
  );

  /*
  ========================================
  DATE FILTER
  ========================================
  */

  const [
    fromDate,
    setFromDate,
  ] = useState("");

  const [
    toDate,
    setToDate,
  ] = useState("");

  /*
  ========================================
  SEARCH
  ========================================
  */

  const [
    search,
    setSearch,
  ] = useState("");

  /*
  ========================================
  ORDER STATUS FILTER
  ========================================
  */

  const [
    orderStatus,
    setOrderStatus,
  ] = useState("all");

  /*
  ========================================
  PAYMENT STATUS FILTER
  ========================================
  */

  const [
    paymentStatusFilter,
    setPaymentStatusFilter,
  ] = useState("all");

  /*
  ========================================
  COURIER STATUS FILTER
  ========================================
  */

  const [
    courierStatusFilter,
    setCourierStatusFilter,
  ] = useState("all");

  /*
  ========================================
  SELECTED ORDERS
  ========================================
  */

  const [
    selectedOrders,
    setSelectedOrders,
  ] = useState<string[]>([]);

  /*
  ========================================
  BULK COURIER MODAL
  ========================================
  */

  const [
    showBulkCourierModal,
    setShowBulkCourierModal,
  ] = useState(false);

  /*
  ========================================
  PAGINATION
  ========================================
  */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const ITEMS_PER_PAGE = 30;

  /*
  ========================================
  SORT ORDERS
  ========================================
  */

  const sortedOrders =
    useMemo(() => {
      return [
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
    }, [orders]);

  /*
  ========================================
  PAYMENT INFO
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
        order.paidAmount ?? 0
      );

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

    let paymentStatus =
      order.paymentStatus;

    if (!paymentStatus) {
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
  FILTER ORDERS
  ========================================
  */

  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return sortedOrders.filter(
        (order) => {
          /*
          ================================
          SEARCH
          ================================
          */

          if (query) {
            const productNames =
              (
                order.items ||
                []
              )
                .map(
                  (item) =>
                    item.productName
                )
                .join(" ");

            const searchableText =
              [
                order.orderId,
                order.customerName,
                order.phone,
                order.productName,
                productNames,
                order.district,
                order.address,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            if (
              !searchableText.includes(
                query
              )
            ) {
              return false;
            }
          }

          /*
          ================================
          FROM DATE
          ================================
          */

          if (fromDate) {
            const startDate =
              new Date(
                `${fromDate}T00:00:00`
              );

            const orderDate =
              new Date(
                order.date
              );

            if (
              orderDate <
              startDate
            ) {
              return false;
            }
          }

          /*
          ================================
          TO DATE
          ================================
          */

          if (toDate) {
            const endDate =
              new Date(
                `${toDate}T23:59:59.999`
              );

            const orderDate =
              new Date(
                order.date
              );

            if (
              orderDate >
              endDate
            ) {
              return false;
            }
          }

          /*
          ================================
          ORDER STATUS
          ================================
          */

          if (
            orderStatus !==
              "all" &&
            order.status
              ?.toLowerCase()
              .trim() !==
              orderStatus
          ) {
            return false;
          }

          /*
          ================================
          PAYMENT STATUS
          ================================
          */

          if (
            paymentStatusFilter !==
              "all"
          ) {
            const {
              paymentStatus,
            } =
              getPaymentInfo(
                order
              );

            if (
              paymentStatus
                .toLowerCase() !==
              paymentStatusFilter
            ) {
              return false;
            }
          }

          /*
          ================================
          COURIER STATUS
          ================================
          */

          if (
            courierStatusFilter !==
              "all"
          ) {
            const courierStatus =
              (
                order.courierStatus ||
                ""
              )
                .trim()
                .toLowerCase();

            if (
              courierStatus !==
              courierStatusFilter
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      sortedOrders,
      search,
      fromDate,
      toDate,
      orderStatus,
      paymentStatusFilter,
      courierStatusFilter,
    ]);

  /*
  ========================================
  RESET FILTERS
  ========================================
  */

  const resetFilters = () => {
    setSearch("");

    setFromDate("");

    setToDate("");

    setOrderStatus("all");

    setPaymentStatusFilter(
      "all"
    );

    setCourierStatusFilter(
      "all"
    );

    setCurrentPage(1);

    setSelectedOrders([]);
  };

  /*
  ========================================
  TOTAL SALES
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
  PAGINATION
  ========================================
  */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOrders.length /
          ITEMS_PER_PAGE
      )
    );

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );

  const paginatedOrders =
    filteredOrders.slice(
      (safeCurrentPage - 1) *
        ITEMS_PER_PAGE,
      safeCurrentPage *
        ITEMS_PER_PAGE
    );

  /*
  ========================================
  CHANGE PAGE
  ========================================
  */

  const changePage = (
    page: number
  ) => {
    const safePage =
      Math.max(
        1,
        Math.min(
          page,
          totalPages
        )
      );

    setCurrentPage(
      safePage
    );

    setSelectedOrders([]);
  };

  /*
  ========================================
  SELECT ALL CURRENT PAGE
  ========================================
  */

  const handleSelectAll = (
    checked: boolean
  ) => {
    if (!checked) {
      setSelectedOrders(
        []
      );

      return;
    }

    setSelectedOrders(
      paginatedOrders.map(
        (order) =>
          order.orderId
      )
    );
  };

  /*
  ========================================
  SELECT SINGLE
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
  STATUS BADGE
  ========================================
  */

  const getStatusBadge = (
    status: string
  ) => {
    switch (
      status
        ?.toLowerCase()
        .trim()
    ) {
      case "delivered":
        return "bg-green-100 text-green-700";

      case "processing":
        return "bg-blue-100 text-blue-700";

      case "partial delivered":
        return "bg-orange-100 text-orange-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /*
  ========================================
  PAYMENT BADGE
  ========================================
  */

  const getPaymentBadge = (
    paymentStatus: string
  ) => {
    switch (
      paymentStatus
        ?.toLowerCase()
        .trim()
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

  /*
  ========================================
  PRODUCT DISPLAY
  ========================================
  */

  const renderProducts = (
    order: Order
  ) => {
    const items =
      order.items || [];

    /*
    MULTI PRODUCT
    */

    if (
      items.length > 0
    ) {
      return (
        <div className="min-w-[250px] max-w-[330px] space-y-1.5">
          {items.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.id ??
                  `${item.productId}-${index}`
                }
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2"
              >
                <span className="min-w-0 font-medium leading-5 text-gray-800">
                  {
                    item.productName
                  }
                </span>

                <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-gray-500">
                  ×{" "}
                  {
                    item.quantity
                  }
                </span>
              </div>
            )
          )}
        </div>
      );
    }

    /*
    SINGLE PRODUCT
    */

    return (
      <div className="min-w-[210px] max-w-[300px]">
        <div className="font-medium leading-5 text-gray-800">
          {order.productName ||
            "Product"}
        </div>

        <div className="mt-1 text-xs text-gray-500">
          ×{" "}
          {
            order.quantity
          }
        </div>
      </div>
    );
  };

  /*
  ========================================
  DISPLAY QUANTITY
  ========================================
  */

  const getDisplayQuantity = (
    order: Order
  ) => {
    if (
      order.totalItems !==
        undefined
    ) {
      return Number(
        order.totalItems
      );
    }

    if (
      order.items &&
      order.items.length >
        0
    ) {
      return order.items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      );
    }

    return Number(
      order.quantity || 0
    );
  };

  /*
  ========================================
  PAGE SELECTION CHECK
  ========================================
  */

  const allCurrentPageSelected =
    paginatedOrders.length >
      0 &&
    paginatedOrders.every(
      (order) =>
        selectedOrders.includes(
          order.orderId
        )
    );

  /*
  ========================================
  RANGE TEXT
  ========================================
  */

  const startItem =
    filteredOrders.length ===
    0
      ? 0
      : (safeCurrentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const endItem =
    Math.min(
      safeCurrentPage *
        ITEMS_PER_PAGE,
      filteredOrders.length
    );

  /*
  ========================================
  PAGE NUMBERS
  ========================================
  */

  const pageNumbers =
    Array.from(
      {
        length:
          totalPages,
      },
      (_, index) =>
        index + 1
    ).filter(
      (page) =>
        page === 1 ||
        page ===
          totalPages ||
        Math.abs(
          page -
            safeCurrentPage
        ) <= 2
    );

  /*
  ========================================
  RENDER
  ========================================
  */

  return (
    <>
      {/* ==================================
          FILTER HEADER
      ================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        {/* TOP FILTER ROW */}

        <div className="flex flex-wrap items-end gap-2.5">
          {/* SEARCH */}

          <div className="w-full sm:max-w-[330px] sm:flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Search Orders
            </label>

            <input
              type="text"
              value={search}
              onChange={(
                e
              ) => {
                setSearch(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              placeholder="Order ID, customer, phone or product..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* ORDER STATUS */}

          <div className="w-full sm:w-[125px]">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Order Status
            </label>

            <select
              value={
                orderStatus
              }
              onChange={(
                e
              ) => {
                setOrderStatus(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All Orders
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="processing">
                Processing
              </option>

              <option value="delivered">
                Delivered
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>

          {/* PAYMENT */}

          <div className="w-full sm:w-[125px]">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Payment
            </label>

            <select
              value={
                paymentStatusFilter
              }
              onChange={(
                e
              ) => {
                setPaymentStatusFilter(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All Payments
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="partially paid">
                Partial
              </option>

              <option value="unpaid">
                Unpaid
              </option>
            </select>
          </div>

          {/* COURIER */}

          <div className="w-full sm:w-[125px]">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Courier
            </label>

            <select
              value={
                courierStatusFilter
              }
              onChange={(
                e
              ) => {
                setCourierStatusFilter(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All Courier
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="delivered">
                Delivered
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="unknown">
                Unknown
              </option>
            </select>
          </div>

          {/* RESET */}

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="h-10 rounded-lg bg-gray-700 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Reset
          </button>

          {/* SYNC */}

          <div className="sm:ml-auto">
            <SyncAllCourierButton />
          </div>
        </div>

        {/* DATE FILTER ROW */}

        <div className="mt-4 flex flex-wrap items-end gap-2.5 border-t border-gray-100 pt-4">
          <div className="w-full sm:w-[150px]">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              From Date
            </label>

            <input
              type="date"
              value={
                fromDate
              }
              onChange={(
                e
              ) => {
                setFromDate(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="w-full sm:w-[150px]">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              To Date
            </label>

            <input
              type="date"
              value={
                toDate
              }
              onChange={(
                e
              ) => {
                setToDate(
                  e.target
                    .value
                );

                setCurrentPage(
                  1
                );
              }}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* SUMMARY */}

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm">
          <div className="font-semibold text-gray-800">
            Orders:{" "}
            <span className="text-gray-600">
              {
                filteredOrders.length
              }
            </span>
          </div>

          <div className="font-semibold text-gray-800">
            Sales:{" "}
            <span className="text-gray-600">
              ৳
              {totalSales.toLocaleString()}
            </span>
          </div>

          <div className="font-semibold text-gray-800">
            Selected:{" "}
            <span className="text-blue-600">
              {
                selectedOrders.length
              }
            </span>
          </div>

          <div className="ml-auto text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {startItem}–
              {endItem}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">
              {
                filteredOrders.length
              }
            </span>
          </div>
        </div>
      </div>

      {/* ==================================
          BULK ACTIONS
      ================================== */}

      {selectedOrders.length >
        0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="font-medium text-blue-900">
            Selected Orders:{" "}
            {
              selectedOrders.length
            }
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() =>
                setShowBulkCourierModal(
                  true
                )
              }
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Send To Courier
            </button>

            <button
              type="button"
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
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Print Labels
            </button>
          </div>
        </div>
      )}

      {/* ==================================
          TABLE
      ================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1450px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      allCurrentPageSelected
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

                <th className="p-3 text-left font-semibold text-gray-700">
                  Order ID
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Date
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Customer
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Phone
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Product
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Qty
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Total
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Payment
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Status
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Courier Status
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Consignment ID
                </th>

                <th className="p-3 text-left font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.length ===
                0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="p-12 text-center text-gray-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}

              {paginatedOrders.map(
                (order) => {
                  const {
                    dueAmount,
                    paymentStatus,
                  } =
                    getPaymentInfo(
                      order
                    );

                  const normalizedPayment =
                    paymentStatus.toLowerCase();

                  const isPaid =
                    normalizedPayment ===
                    "paid";

                  const isPartial =
                    normalizedPayment ===
                      "partially paid" ||
                    normalizedPayment ===
                      "partial";

                  const isUnpaid =
                    normalizedPayment ===
                    "unpaid";

                  return (
                    <tr
                      key={
                        order.orderId
                      }
                      className="border-t border-gray-200 transition hover:bg-gray-50/80"
                    >
                      {/* CHECKBOX */}

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

                      {/* ORDER ID */}

                      <td className="p-3 font-medium text-gray-800">
                        {
                          order.orderId
                        }
                      </td>

                      {/* DATE */}

                      <td className="whitespace-nowrap p-3 text-gray-700">
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

                      {/* CUSTOMER */}

                      <td className="p-3 text-gray-800">
                        {
                          order.customerName
                        }
                      </td>

                      {/* PHONE */}

                      <td className="whitespace-nowrap p-3 text-gray-700">
                        {
                          order.phone
                        }
                      </td>

                      {/* PRODUCTS */}

                      <td className="p-3 align-top">
                        {renderProducts(
                          order
                        )}
                      </td>

                      {/* QTY */}

                      <td className="p-3 align-top font-semibold text-gray-800">
                        {getDisplayQuantity(
                          order
                        )}
                      </td>

                      {/* TOTAL */}

                      <td className="whitespace-nowrap p-3 align-top font-semibold text-gray-800">
                        ৳{" "}
                        {Number(
                          order.total ||
                            0
                        ).toLocaleString()}
                      </td>

                      {/* PAYMENT */}

                      <td className="p-3">
                        <div className="flex min-w-[105px] flex-col items-start gap-1">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadge(
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
                            <span className="whitespace-nowrap text-xs font-medium text-green-700">
                              Paid ৳
                              {Number(
                                order.paidAmount ||
                                  0
                              ).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="p-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {
                            order.status
                          }
                        </span>
                      </td>

                      {/* COURIER */}

                      <td className="p-3 text-gray-700">
                        {order.courierStatus ||
                          "-"}
                      </td>

                      {/* CONSIGNMENT */}

                      <td className="whitespace-nowrap p-3 text-gray-700">
                        {order.consignmentId ||
                          "-"}
                      </td>

                      {/* VIEW */}

                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
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
      </div>

      {/* ==================================
          PAGINATION
      ================================== */}

      {totalPages > 1 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            Page{" "}
            <span className="font-semibold text-gray-800">
              {safeCurrentPage}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* PREVIOUS */}

            <button
              type="button"
              disabled={
                safeCurrentPage ===
                1
              }
              onClick={() =>
                changePage(
                  safeCurrentPage -
                    1
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            {/* PAGE NUMBERS */}

            {pageNumbers.map(
              (
                page,
                index
              ) => {
                const previousPage =
                  pageNumbers[
                    index - 1
                  ];

                const showDots =
                  previousPage &&
                  page -
                    previousPage >
                    1;

                return (
                  <span
                    key={
                      page
                    }
                    className="flex items-center gap-1.5"
                  >
                    {showDots && (
                      <span className="px-1 text-gray-400">
                        ...
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        changePage(
                          page
                        )
                      }
                      className={`min-w-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        page ===
                        safeCurrentPage
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {
                        page
                      }
                    </button>
                  </span>
                );
              }
            )}

            {/* NEXT */}

            <button
              type="button"
              disabled={
                safeCurrentPage ===
                totalPages
              }
              onClick={() =>
                changePage(
                  safeCurrentPage +
                    1
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ==================================
          ORDER DETAILS MODAL
      ================================== */}

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

      {/* ==================================
          BULK COURIER MODAL
      ================================== */}

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