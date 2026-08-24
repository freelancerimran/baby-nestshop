"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  MoreHorizontal,
  Package,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  ShoppingBag,
  Tag,
  Truck,
  UserRound,
  WalletCards,
  XCircle,
  Clock3,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import OrderDetailsModal from "./OrderDetailsModal";
import EditOrderForm from "./orders/edit/EditOrderForm";
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

  image?: string;
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

  productImage?: string;

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
DHaka DATE/TIME HELPERS
========================================

Use explicit Asia/Dhaka formatting with
manual hour conversion so the client and
server render the same text during
hydration.
========================================
*/

function getDhakaDateParts(
  value: string
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Dhaka",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(date);

  const result: Record<
    string,
    string
  > = {};

  parts.forEach(
    (part) => {
      result[part.type] =
        part.value;
    }
  );

  return result;
}

function formatDhakaDate(
  value: string
) {
  const parts =
    getDhakaDateParts(value);

  if (!parts) {
    return "-";
  }

  return `${parts.day} ${parts.month} ${parts.year}`;
}

function formatDhakaTime(
  value: string
) {
  const parts =
    getDhakaDateParts(value);

  if (!parts) {
    return "";
  }

  const hour24 = Number(
    parts.hour || 0
  );

  const minute =
    parts.minute || "00";

  const hour12 =
    hour24 % 12 || 12;

  const suffix =
    hour24 >= 12
      ? "PM"
      : "AM";

  return `${String(
    hour12
  ).padStart(2, "0")}:${minute} ${suffix}`;
}

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
  EDITING ORDER
  ========================================
  */

  const [
    editingOrder,
    setEditingOrder,
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
  ORDER FINANCIAL SUMMARY
  ========================================

  Product Sales = product value only
  Delivery = customer delivery charge
  Discount = discount given
  Total = final customer payable amount

  Cancelled orders are excluded from
  financial/unit sales metrics.
  ========================================
  */

  const orderSummary = useMemo(() => {
    let productSales = 0;
    let deliveryCharges = 0;
    let discounts = 0;
    let totalSales = 0;
    let totalUnits = 0;
    let salesOrders = 0;

    filteredOrders.forEach((order) => {
      const isCancelled =
        order.status
          ?.trim()
          .toLowerCase() === "cancelled";

      if (isCancelled) {
        return;
      }

      const items = order.items || [];

      const productValue =
        items.length > 0
          ? items.reduce(
              (sum, item) =>
                sum +
                Number(item.lineTotal ?? 0),
              0
            )
          : Number(
              order.productPrice ?? 0
            ) *
            Number(
              order.quantity ?? 0
            );

      const deliveryCharge = Number(
        order.deliveryCharge ?? 0
      );

      const discount = Number(
        order.discount ?? 0
      );

      const finalTotal = Number(
        order.total ?? 0
      );

      productSales += productValue;
      deliveryCharges += deliveryCharge;
      discounts += discount;
      totalSales += finalTotal;
      totalUnits +=
  order.items && order.items.length > 0
    ? order.items.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      )
    : Number(order.quantity || 0);
      salesOrders += 1;
    });

    return {
      productSales,
      deliveryCharges,
      discounts,
      totalSales,
      totalUnits,
      salesOrders,
    };
  }, [filteredOrders]);

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

  const renderProducts = (order: Order) => {
    const items = order.items || [];

    if (items.length > 0) {
      const visibleItems = items.slice(0, 2);
      const remaining = Math.max(0, items.length - visibleItems.length);

      return (
        <div className="min-w-[250px] max-w-[330px] space-y-2">
          {visibleItems.map((item, index) => (
            <div
              key={item.id ?? `${item.productId}-${index}`}
              className="flex items-center gap-2.5"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.productName || "Product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <Package className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-gray-800">
                  {item.productName || "Product"}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  Qty × {item.quantity} · ৳{Number(item.unitPrice || 0).toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          {remaining > 0 && (
            <div className="pl-[50px] text-xs font-semibold text-emerald-600">
              +{remaining} more product{remaining > 1 ? "s" : ""}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex min-w-[250px] max-w-[330px] items-center gap-2.5">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          {order.productImage ? (
            <img
              src={order.productImage}
              alt={order.productName || "Product"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Package className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-800">
            {order.productName || "Product"}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            Qty × {order.quantity || 0} · ৳{Number(order.productPrice || 0).toLocaleString()}
          </div>
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
    /*
    Always trust real item rows first.
    This prevents a stale/zero legacy
    `totalItems` value from hiding the
    actual quantity.
    */
    if (
      order.items &&
      order.items.length > 0
    ) {
      const itemQuantity =
        order.items.reduce(
          (sum, item) =>
            sum +
            Math.max(
              1,
              Number(
                item.quantity || 0
              )
            ),
          0
        );

      if (itemQuantity > 0) {
        return itemQuantity;
      }
    }

    const quantity = Number(
      order.quantity || 0
    );

    if (quantity > 0) {
      return quantity;
    }

    /*
    Legacy single-product fallback.
    The Orders page now normally supplies
    a normalized item, but this keeps the
    table safe if an old payload reaches
    the component directly.
    */
    if (
      order.productId ||
      order.productName
    ) {
      return 1;
    }

    return 0;
  };

  /*
  ========================================
  PREPARE ORDER FOR EDIT
  ========================================

  The table normally receives normalized
  `items[]`. This fallback also protects
  against a legacy/partial payload so the
  Edit Order form never opens with an empty
  product list for a single-product order.
  ========================================
  */

  const prepareOrderForEdit = (
    order: Order
  ): Order => {
    if (
      order.items &&
      order.items.length > 0
    ) {
      return order;
    }

    if (
      !order.productId &&
      !order.productName
    ) {
      return order;
    }

    const quantity =
      Number(order.quantity || 0) > 0
        ? Number(order.quantity)
        : 1;

    const unitPrice = Number(
      order.productPrice || 0
    );

    return {
      ...order,
      quantity,
      totalItems: quantity,
      items: [
        {
          id: undefined,
          productId:
            String(
              order.productId || ""
            ),
          productName:
            order.productName ||
            "Product",
          quantity,
          unitPrice,
          lineTotal:
            unitPrice *
            quantity,
          image:
            order.productImage ||
            "",
        },
      ],
    };
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

  return (
    <>
      <section className="overflow-hidden rounded-[26px] border border-gray-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <Search className="h-4 w-4" />
                Search Orders
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Order ID, customer, phone or product..."
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50/60 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 xl:w-[600px]">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => {
                    setOrderStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Payment</label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="partially paid">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Courier</label>
                <select
                  value={courierStatusFilter}
                  onChange={(e) => {
                    setCourierStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="all">All Courier</option>
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 xl:pb-0">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <div className="shrink-0">
                <SyncAllCourierButton />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
            <div className="min-w-[150px]">
              <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                <CalendarDays className="h-3.5 w-3.5" />
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-2xl border border-gray-200 bg-gray-50/50 px-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="min-w-[150px]">
              <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                <CalendarDays className="h-3.5 w-3.5" />
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-2xl border border-gray-200 bg-gray-50/50 px-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {[
              { label: "Orders", value: filteredOrders.length.toLocaleString(), icon: ClipboardList, className: "bg-rose-50 text-rose-500" },
              { label: "Units", value: orderSummary.totalUnits.toLocaleString(), icon: Package, className: "bg-orange-50 text-orange-500" },
              { label: "Product", value: `৳${orderSummary.productSales.toLocaleString()}`, icon: ShoppingBag, className: "bg-blue-50 text-blue-500" },
              { label: "Delivery", value: `৳${orderSummary.deliveryCharges.toLocaleString()}`, icon: Truck, className: "bg-emerald-50 text-emerald-600" },
              { label: "Discount", value: `-৳${orderSummary.discounts.toLocaleString()}`, icon: Tag, className: "bg-purple-50 text-purple-500" },
              { label: "Total", value: `৳${orderSummary.totalSales.toLocaleString()}`, icon: WalletCards, className: "bg-pink-50 text-pink-500" },
              { label: "Selected", value: selectedOrders.length.toLocaleString(), icon: UserRound, className: "bg-sky-50 text-sky-500" },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stat.className}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500">{stat.label}</div>
                    <div className="mt-0.5 truncate text-base font-bold text-gray-900">{stat.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end border-t border-gray-100 pt-4 text-xs text-gray-500">
            Showing <span className="mx-1 font-semibold text-gray-700">{startItem}–{endItem}</span> of{" "}
            <span className="ml-1 font-semibold text-gray-700">{filteredOrders.length}</span>
          </div>
        </div>
      </section>

      {selectedOrders.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-emerald-900">
            <CheckCircle2 className="h-5 w-5" />
            Selected Orders: {selectedOrders.length}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setShowBulkCourierModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Truck className="h-4 w-4" />
              Send To Courier
            </button>

            <button
              type="button"
              onClick={() => {
                const ids = selectedOrders.join(",");
                window.open(`/print-labels?ids=${ids}`, "_blank");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <ClipboardList className="h-4 w-4" />
              Print Labels
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-[26px] border border-gray-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr className="text-left">
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>

                {[
                  ["Order", "min-w-[145px]"],
                  ["Date", "min-w-[110px]"],
                  ["Customer", "min-w-[190px]"],
                  ["Product", "min-w-[285px]"],
                  ["Qty", "w-[70px]"],
                  ["Payment", "min-w-[125px]"],
                  ["Amount", "min-w-[105px]"],
                  ["Status", "min-w-[115px]"],
                  ["Courier", "min-w-[130px]"],
                  ["Actions", "w-[105px]"],
                ].map(([label, width]) => (
                  <th key={label} className={`px-4 py-4 text-xs font-bold uppercase tracking-wide text-gray-500 ${width}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-14 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <ClipboardList className="h-7 w-7" />
                      </div>
                      <div className="mt-3 font-semibold text-gray-800">No orders found</div>
                      <div className="mt-1 text-sm text-gray-500">Try changing your search or filters.</div>
                    </div>
                  </td>
                </tr>
              )}

              {paginatedOrders.map((order) => {
                const { dueAmount, paymentStatus } = getPaymentInfo(order);
                const normalizedPayment = paymentStatus.toLowerCase();
                const isPaid = normalizedPayment === "paid";
                const isPartial = normalizedPayment === "partially paid" || normalizedPayment === "partial";
                const normalizedOrderStatus = order.status?.toLowerCase().trim();

                return (
                  <tr key={order.orderId} className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70">
                    <td className="px-4 py-4 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.orderId)}
                        onChange={() => handleSelectOrder(order.orderId)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="font-bold text-gray-900">#{order.orderId}</div>
                      <div className="mt-1 text-xs text-gray-400">{order.orderType || "Website Order"}</div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                      <div className="font-medium text-gray-800">
                        {order.date
                          ? formatDhakaDate(
                              order.date
                            )
                          : "-"}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {order.date
                          ? formatDhakaTime(
                              order.date
                            )
                          : ""}
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-900">{order.customerName || "Customer"}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3.5 w-3.5" />
                            {order.phone || "-"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">{renderProducts(order)}</td>

                    <td className="px-4 py-4 text-center align-middle">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2.5 py-1 font-bold text-gray-700">
                        {getDisplayQuantity(order)}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${getPaymentBadge(paymentStatus)}`}>
                          {isPaid ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : isPartial ? (
                            <Clock3 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {isPartial ? "Partial" : paymentStatus}
                        </span>

                        <span className="text-xs font-medium text-gray-500">
                          {isPartial
                            ? `Due ৳${dueAmount.toLocaleString()}`
                            : isPaid
                              ? `Paid ৳${Number(order.paidAmount || 0).toLocaleString()}`
                              : `Due ৳${dueAmount.toLocaleString()}`}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                      <div className="font-bold text-gray-900">৳{Number(order.total || 0).toLocaleString()}</div>
                      {Number(order.discount || 0) > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          Discount ৳{Number(order.discount || 0).toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${getStatusBadge(order.status)}`}>
                        {normalizedOrderStatus === "delivered" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : normalizedOrderStatus === "cancelled" ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5" />
                        )}
                        {order.status || "Pending"}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-gray-700">{order.courierStatus || "Pending"}</div>
                          {order.consignmentId && (
                            <div className="mt-0.5 max-w-[100px] truncate text-[11px] text-gray-400">{order.consignmentId}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="View Order"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Edit Order"
                          onClick={() => {
                            setSelectedOrder(null);
                            setEditingOrder(
                              prepareOrderForEdit(
                                order
                              )
                            );
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="More"
                          onClick={() => setSelectedOrder(order)}
                          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 sm:inline-flex"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-800">{safeCurrentPage}</span> of{" "}
            <span className="font-semibold text-gray-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => changePage(safeCurrentPage - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {pageNumbers.map((page, index) => {
              const previousPage = pageNumbers[index - 1];
              const showDots = previousPage && page - previousPage > 1;

              return (
                <span key={page} className="flex items-center gap-1.5">
                  {showDots && <span className="px-1 text-gray-400">...</span>}

                  <button
                    type="button"
                    onClick={() => changePage(page)}
                    className={`min-w-10 rounded-xl px-3 py-2 text-sm font-bold transition ${
                      page === safeCurrentPage
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              );
            })}

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => changePage(safeCurrentPage + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {editingOrder && (
        <EditOrderForm
          order={editingOrder}
          onClose={() =>
            setEditingOrder(null)
          }
          onSaved={() => {
            window.location.reload();
          }}
        />
      )}

      {showBulkCourierModal && (
        <BulkCourierModal
          selectedOrders={selectedOrders}
          orders={filteredOrders.map((order) => ({
            orderId: order.orderId,
            consignmentId: order.consignmentId,
          }))}
          onClose={() => setShowBulkCourierModal(false)}
        />
      )}
    </>
  );
}