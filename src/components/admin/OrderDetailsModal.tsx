"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import EditOrderForm from "./orders/edit/EditOrderForm";

/*
========================================
ORDER ITEM
========================================
*/

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/*
========================================
ORDER
========================================
*/

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
  note?: string;

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

  paidAmount?: number;
  dueAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;

  items?: OrderItem[];
}

interface Props {
  order: Order;
  onClose: () => void;
}

export default function OrderDetailsModal({
  order,
  onClose,
}: Props) {
  const router =
    useRouter();

  /*
  ========================================
  COURIER STATE
  ========================================
  */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    courierStatus,
    setCourierStatus,
  ] = useState(
    order.courierStatus
  );

  const [
    orderStatus,
    setOrderStatus,
  ] = useState(
    order.status
  );

  const [
    lastSync,
    setLastSync,
  ] = useState(
    order.lastStatusSync
  );

  const [
    consignmentId,
    setConsignmentId,
  ] = useState(
    order.consignmentId || ""
  );

  const [
    trackingCode,
    setTrackingCode,
  ] = useState(
    order.trackingCode || ""
  );

  /*
  ========================================
  PAYMENT STATE
  ========================================
  */

  const initialPaidAmount =
    Number(
      order.paidAmount || 0
    );

  const initialDueAmount =
    order.dueAmount !==
      undefined &&
    order.dueAmount !==
      null
      ? Number(
          order.dueAmount
        )
      : Math.max(
          0,
          Number(
            order.total
          ) -
            initialPaidAmount
        );

  const [
    paidAmount,
    setPaidAmount,
  ] = useState(
    initialPaidAmount
  );

  const [
    paidInput,
    setPaidInput,
  ] = useState(
    String(
      initialPaidAmount
    )
  );

  const [
    dueAmount,
    setDueAmount,
  ] = useState(
    initialDueAmount
  );

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState(
    order.paymentStatus ||
      "Unpaid"
  );

  const [
    paymentLoading,
    setPaymentLoading,
  ] = useState(false);

  const [
    paymentMessage,
    setPaymentMessage,
  ] = useState("");

  /*
  ========================================
  CANCEL STATE
  ========================================
  */

  const [
    cancelLoading,
    setCancelLoading,
  ] = useState(false);

  const [
    cancelMessage,
    setCancelMessage,
  ] = useState("");

  /*
  ========================================
  PERMANENT DELETE STATE
  ========================================
  */

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const [
    deleteMessage,
    setDeleteMessage,
  ] = useState("");

  /*
  ========================================
  EDIT STATE
  ========================================
  */

  const [
    editing,
    setEditing,
  ] = useState(false);

  /*
  ========================================
  ORDER ITEMS
  ========================================
  */

  const orderItems =
    Array.isArray(
      order.items
    ) &&
    order.items.length > 0
      ? order.items
      : [
          {
            productId:
              order.productId,

            productName:
              order.productName,

            quantity:
              Number(
                order.quantity || 0
              ),

            unitPrice:
              Number(
                order.productPrice || 0
              ),

            lineTotal:
              Number(
                order.productPrice || 0
              ) *
              Number(
                order.quantity || 0
              ),
          },
        ];

  /*
  ========================================
  TOTAL QUANTITY
  ========================================
  */

  const totalOrderedQuantity =
    orderItems.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  /*
  ========================================
  STATE HELPERS
  ========================================
  */

  const isCancelled =
    orderStatus
      ?.toLowerCase() ===
    "cancelled";

  const hasCourier =
    Boolean(
      consignmentId
    );

  /*
  ========================================
  EDIT LOCK
  ========================================

  Once an order is sent to courier,
  editing is locked.

  Cancelled orders are also locked.

  ========================================
  */

  const editLocked =
    isCancelled ||
    hasCourier;

  /*
  ========================================
  UPDATE PAYMENT
  ========================================
  */

  const handleUpdatePayment =
    async () => {
      if (isCancelled) {
        setPaymentMessage(
          "❌ Payment cannot be changed because this order is cancelled."
        );

        return;
      }

      if (hasCourier) {
        setPaymentMessage(
          "❌ Payment cannot be changed because this order has already been sent to courier."
        );

        return;
      }

      try {
        setPaymentLoading(
          true
        );

        setPaymentMessage("");

        const value =
          Number(
            paidInput
          );

        if (
          !Number.isFinite(
            value
          )
        ) {
          setPaymentMessage(
            "❌ Please enter a valid paid amount."
          );

          return;
        }

        if (
          value < 0
        ) {
          setPaymentMessage(
            "❌ Paid amount cannot be negative."
          );

          return;
        }

        if (
          value >
          Number(
            order.total
          )
        ) {
          setPaymentMessage(
            "❌ Paid amount cannot be greater than order total."
          );

          return;
        }

        const response =
          await fetch(
            "/api/admin/orders/update-payment",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  orderId:
                    order.orderId,

                  paidAmount:
                    value,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          setPaymentMessage(
            `❌ ${
              data.message ||
              "Payment update failed."
            }`
          );

          return;
        }

        setPaidAmount(
          Number(
            data.paidAmount ??
              0
          )
        );

        setPaidInput(
          String(
            Number(
              data.paidAmount ??
                0
            )
          )
        );

        setDueAmount(
          Number(
            data.dueAmount ??
              0
          )
        );

        setPaymentStatus(
          data.paymentStatus ||
            "Unpaid"
        );

        setPaymentMessage(
          "✅ Payment updated successfully."
        );

        router.refresh();
      } catch (error) {
        console.error(
          error
        );

        setPaymentMessage(
          "❌ Payment update failed."
        );
      } finally {
        setPaymentLoading(
          false
        );
      }
    };

  /*
  ========================================
  SEND TO COURIER
  ========================================
  */

  const handleSendToCourier =
    async () => {
      if (isCancelled) {
        setMessage(
          "❌ Cancelled orders cannot be sent to courier."
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setMessage("");

        const response =
          await fetch(
            "/api/admin/send-to-courier",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  orderId:
                    order.orderId,
                }),
            }
          );

        const data =
          await response.json();

        if (
          data.success
        ) {
          setConsignmentId(
            String(
              data.consignmentId
            )
          );

          setTrackingCode(
            data.trackingCode ||
              ""
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

          router.refresh();
        } else {
          setMessage(
            `❌ ${
              data.message ||
              "Failed to send order."
            }`
          );
        }
      } catch (error) {
        console.error(
          error
        );

        setMessage(
          "❌ Failed to send order."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /*
  ========================================
  REFRESH COURIER STATUS
  ========================================
  */

  const handleRefreshStatus =
    async () => {
      try {
        setRefreshing(
          true
        );

        setMessage("");

        const response =
          await fetch(
            "/api/admin/update-courier-status",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  orderId:
                    order.orderId,
                }),
            }
          );

        const data =
          await response.json();

        if (
          data.success
        ) {
          setCourierStatus(
            data.courierStatus
          );

          setOrderStatus(
            data.orderStatus
          );

          setLastSync(
            new Date()
              .toISOString()
          );

          setMessage(
            "✅ Courier status updated."
          );

          router.refresh();
        } else {
          setMessage(
            `❌ ${
              data.message ||
              "Status update failed."
            }`
          );
        }
      } catch (error) {
        console.error(
          error
        );

        setMessage(
          "❌ Status update failed."
        );
      } finally {
        setRefreshing(
          false
        );
      }
    };

  /*
  ========================================
  CANCEL ORDER
  ========================================
  */

  const handleCancelOrder =
    async () => {
      if (isCancelled) {
        setCancelMessage(
          "ℹ️ This order is already cancelled."
        );

        return;
      }

      if (hasCourier) {
        setCancelMessage(
          "❌ This order has already been sent to courier and cannot be cancelled from here."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Cancel order ${order.orderId}?\n\nThe ordered quantity (${totalOrderedQuantity}) will be restored to inventory.\n\nThis action should only be used when the customer has cancelled the order.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setCancelLoading(
          true
        );

        setCancelMessage("");

        setPaymentMessage("");

        setMessage("");

        const response =
          await fetch(
            "/api/admin/orders/cancel",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  orderId:
                    order.orderId,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          setCancelMessage(
            `❌ ${
              data.message ||
              "Order cancellation failed."
            }`
          );

          return;
        }

        setOrderStatus(
          "Cancelled"
        );

        setCancelMessage(
          data.alreadyCancelled
            ? "ℹ️ Order was already cancelled. Stock was not restored again."
            : "✅ Order cancelled successfully and stock restored."
        );

        router.refresh();
      } catch (error) {
        console.error(
          error
        );

        setCancelMessage(
          "❌ Order cancellation failed."
        );
      } finally {
        setCancelLoading(
          false
        );
      }
    };

  /*
  ========================================
  PERMANENT DELETE ORDER
  ========================================
  */

  const handlePermanentDeleteOrder =
    async () => {
      const confirmed =
        window.confirm(
          `PERMANENTLY DELETE order ${order.orderId}?\\n\\nThis action cannot be undone.\\n\\nThe system will safely restore stock if it has not already been restored. Coupon usage will also be restored when applicable.\\n\\nContinue?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeleteLoading(true);
        setDeleteMessage("");
        setCancelMessage("");
        setPaymentMessage("");
        setMessage("");

        const response =
          await fetch(
            `/api/admin/orders/${encodeURIComponent(
              order.orderId
            )}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          setDeleteMessage(
            `❌ ${
              data.message ||
              "Permanent order deletion failed."
            }`
          );

          return;
        }

        setDeleteMessage(
          "✅ Order permanently deleted successfully."
        );

        router.refresh();
        onClose();
      } catch (error) {
        console.error(error);

        setDeleteMessage(
          "❌ Permanent order deletion failed."
        );
      } finally {
        setDeleteLoading(false);
      }
    };

  /*
  ========================================
  PAYMENT BADGE
  ========================================
  */

  const paymentBadge =
    paymentStatus ===
    "Paid"
      ? "bg-green-100 text-green-700"
      : paymentStatus ===
          "Partially Paid"
        ? "bg-orange-100 text-orange-700"
        : "bg-red-100 text-red-700";

  /*
  ========================================
  ORDER STATUS BADGE
  ========================================
  */

  const orderStatusBadge =
    isCancelled
      ? "bg-red-100 text-red-700"
      : orderStatus
            ?.toLowerCase() ===
          "processing"
        ? "bg-blue-100 text-blue-700"
        : orderStatus
              ?.toLowerCase() ===
            "delivered"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700";

  /*
  ========================================
  EDIT MODE
  ========================================
  */

  if (editing) {
    return (
      <EditOrderForm
        order={{
          orderId:
            order.orderId,

          customerName:
            order.customerName,

          phone:
            order.phone,

          district:
            order.district,

          deliveryArea:
            order.deliveryArea,

          address:
            order.address,

          note:
            order.note || "",

          deliveryCharge:
            Number(
              order.deliveryCharge ||
                0
            ),

          discount:
            Number(
              order.discount ||
                0
            ),

          couponCode:
            order.couponCode ||
            "",

          total:
            Number(
              order.total ||
                0
            ),

          paidAmount:
            Number(
              order.paidAmount ||
                0
            ),

          paymentMethod:
            order.paymentMethod ||
            "",

          status:
            orderStatus,

          items:
            orderItems,
        }}

        onClose={() =>
          setEditing(
            false
          )
        }

        onSaved={() => {
          setEditing(
            false
          );

          router.refresh();
        }}
      />
    );
  }

  /*
  ========================================
  MAIN VIEW
  ========================================
  */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        {/* =================================
            HEADER
        ================================= */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Order Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {order.orderId}
            </p>
          </div>

          <button
            onClick={
              onClose
            }
            className="rounded-lg bg-gray-100 px-3 py-2 text-lg transition hover:bg-gray-200"
          >
            ✕
          </button>

        </div>

        <div className="space-y-6">

          {/* =================================
              CUSTOMER
          ================================= */}

          <section>

            <h3 className="mb-4 text-lg font-bold">
              Customer Information
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">

              <p>
                <strong>
                  Order ID:
                </strong>{" "}
                {order.orderId}
              </p>

              <p>
                <strong>
                  Date:
                </strong>{" "}
                {order.date}
              </p>

              <p>
                <strong>
                  Customer:
                </strong>{" "}
                {order.customerName}
              </p>

              <p>
                <strong>
                  Phone:
                </strong>{" "}
                {order.phone}
              </p>

              <p>
                <strong>
                  District:
                </strong>{" "}
                {order.district ||
                  "N/A"}
              </p>

              <p>
                <strong>
                  Delivery Area:
                </strong>{" "}
                {order.deliveryArea ||
                  "N/A"}
              </p>

              <div className="sm:col-span-2">
                <strong>
                  Address:
                </strong>{" "}
                {order.address}
              </div>

              <div className="sm:col-span-2">
                <strong>
                  Customer Note:
                </strong>{" "}
                {order.note ||
                  "No note"}
              </div>

            </div>

          </section>

          {/* =================================
              PRODUCTS
          ================================= */}

          <section>

            <div className="mb-4 flex items-center justify-between">

              <h3 className="text-lg font-bold">
                Products Ordered
              </h3>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                {orderItems.length}{" "}
                {orderItems.length ===
                1
                  ? "Product"
                  : "Products"}
              </span>

            </div>

            <div className="overflow-hidden rounded-xl border">

              <div className="grid grid-cols-[1fr_70px_100px_110px] gap-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">

                <div>
                  Product
                </div>

                <div className="text-center">
                  Qty
                </div>

                <div className="text-right">
                  Unit Price
                </div>

                <div className="text-right">
                  Total
                </div>

              </div>

              {orderItems.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="grid grid-cols-[1fr_70px_100px_110px] gap-3 border-t px-4 py-4 text-sm"
                  >

                    <div className="font-medium text-gray-900">
                      {
                        item.productName
                      }
                    </div>

                    <div className="text-center font-semibold">
                      {
                        item.quantity
                      }
                    </div>

                    <div className="text-right">
                      ৳{" "}
                      {Number(
                        item.unitPrice
                      ).toLocaleString()}
                    </div>

                    <div className="text-right font-semibold">
                      ৳{" "}
                      {Number(
                        item.lineTotal
                      ).toLocaleString()}
                    </div>

                  </div>
                )
              )}

              <div className="grid grid-cols-[1fr_70px_100px_110px] gap-3 border-t bg-gray-50 px-4 py-3 text-sm font-bold">

                <div>
                  Total
                </div>

                <div className="text-center">
                  {
                    totalOrderedQuantity
                  }
                </div>

                <div />

                <div className="text-right">
                  ৳{" "}
                  {orderItems
                    .reduce(
                      (
                        total,
                        item
                      ) =>
                        total +
                        Number(
                          item.lineTotal ||
                            0
                        ),
                      0
                    )
                    .toLocaleString()}
                </div>

              </div>

            </div>

          </section>

          {/* =================================
              ORDER SUMMARY
          ================================= */}

          <section>

            <h3 className="mb-4 text-lg font-bold">
              Order Summary
            </h3>

            <div className="rounded-xl border bg-gray-50 p-4">

              <div className="space-y-3">

                <div className="flex justify-between">
                  <span>
                    Products Subtotal
                  </span>

                  <span className="font-medium">
                    ৳{" "}
                    {orderItems
                      .reduce(
                        (
                          total,
                          item
                        ) =>
                          total +
                          Number(
                            item.lineTotal ||
                              0
                          ),
                        0
                      )
                      .toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>
                    Delivery Charge
                  </span>

                  <span>
                    ৳{" "}
                    {Number(
                      order.deliveryCharge ||
                        0
                    ).toLocaleString()}
                  </span>
                </div>

                {Number(
                  order.discount ||
                    0
                ) > 0 && (
                  <div className="flex justify-between text-green-700">

                    <span>
                      Discount
                    </span>

                    <span>
                      - ৳{" "}
                      {Number(
                        order.discount
                      ).toLocaleString()}
                    </span>

                  </div>
                )}

                {order.couponCode && (
                  <div className="flex justify-between text-sm text-gray-500">

                    <span>
                      Coupon
                    </span>

                    <span>
                      {
                        order.couponCode
                      }
                    </span>

                  </div>
                )}

                <hr />

                <div className="flex justify-between text-xl font-bold">

                  <span>
                    Grand Total
                  </span>

                  <span>
                    ৳{" "}
                    {Number(
                      order.total
                    ).toLocaleString()}
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* =================================
              STATUS + EDIT
          ================================= */}

          <section>

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex items-center gap-2">

                <strong>
                  Status:
                </strong>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${orderStatusBadge}`}
                >
                  {orderStatus}
                </span>

              </div>

              {/* EDIT BUTTON */}

              {!editLocked ? (
                <button
                  type="button"
                  onClick={() =>
                    setEditing(
                      true
                    )
                  }
                  disabled={
                    loading ||
                    cancelLoading ||
                    paymentLoading
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✏️ Edit Order
                </button>
              ) : (
                <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
                  🔒 Editing Locked
                </div>
              )}

            </div>

            {hasCourier &&
              !isCancelled && (
                <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  This order has already been sent to the courier. Editing is locked.
                </div>
              )}

            {isCancelled && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <div className="font-bold">
                  Order Cancelled
                </div>

                <div className="mt-1">
                  This order has been cancelled and its stock has been restored to inventory.
                </div>

              </div>
            )}

          </section>

          {/* =================================
              PAYMENT
          ================================= */}

          <section>

            <hr className="mb-5" />

            <h3 className="mb-4 text-lg font-bold">
              Payment Information
            </h3>

            <div className="rounded-xl border bg-gray-50 p-4">

              <div className="grid gap-4 sm:grid-cols-3">

                <div>
                  <div className="text-xs text-gray-500">
                    Order Total
                  </div>

                  <div className="text-lg font-bold">
                    ৳{" "}
                    {Number(
                      order.total
                    ).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">
                    Paid
                  </div>

                  <div className="text-lg font-bold text-green-700">
                    ৳{" "}
                    {paidAmount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">
                    Due / COD
                  </div>

                  <div className="text-lg font-bold text-red-700">
                    ৳{" "}
                    {dueAmount.toLocaleString()}
                  </div>
                </div>

              </div>

              <div className="mt-4">

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${paymentBadge}`}
                >
                  {
                    paymentStatus
                  }
                </span>

              </div>

              {!consignmentId &&
              !isCancelled ? (
                <div className="mt-5">

                  <label className="mb-2 block text-sm font-medium">
                    Paid Amount
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">

                    <input
                      type="number"
                      min="0"
                      max={
                        order.total
                      }
                      step="1"
                      value={
                        paidInput
                      }
                      onChange={(
                        e
                      ) =>
                        setPaidInput(
                          e.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                    />

                    <button
                      onClick={
                        handleUpdatePayment
                      }
                      disabled={
                        paymentLoading
                      }
                      className="whitespace-nowrap rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {paymentLoading
                        ? "Updating..."
                        : "Update Payment"}
                    </button>

                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Enter the amount already received from the customer. The remaining amount will be sent to the courier as COD.
                  </p>

                </div>
              ) : isCancelled ? (
                <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  Payment editing is locked because this order is cancelled.
                </div>
              ) : (
                <div className="mt-5 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  Payment editing is locked because this order has already been sent to the courier.
                </div>
              )}

              {paymentMessage && (
                <div className="mt-3 rounded-lg bg-white p-3 text-sm">
                  {
                    paymentMessage
                  }
                </div>
              )}

            </div>

          </section>

          {/* =================================
              COURIER
          ================================= */}

          <section>

            <hr className="mb-5" />

            <h3 className="mb-4 text-lg font-bold">
              Courier Information
            </h3>

            <div className="space-y-3">

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

            </div>

            {message && (
              <div className="mt-4 rounded-lg bg-gray-100 p-3 text-sm">
                {
                  message
                }
              </div>
            )}

            {!isCancelled && (
              <div className="flex flex-wrap gap-3 pt-4">

                {!consignmentId ? (
                  <button
                    onClick={
                      handleSendToCourier
                    }
                    disabled={
                      loading ||
                      cancelLoading
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading
                      ? "Sending..."
                      : "Send To Courier"}
                  </button>
                ) : (
                  <div className="rounded-lg bg-green-100 px-4 py-2 font-medium text-green-700">
                    ✅ Sent To Courier
                  </div>
                )}

                {consignmentId && (
                  <button
                    onClick={
                      handleRefreshStatus
                    }
                    disabled={
                      refreshing
                    }
                    className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-60"
                  >
                    {refreshing
                      ? "Refreshing..."
                      : "Refresh Status"}
                  </button>
                )}

              </div>
            )}

          </section>

          {/* =================================
              CANCEL
          ================================= */}

          <section>

            <hr className="mb-5" />

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">

              <h3 className="font-bold text-red-700">
                Order Cancellation
              </h3>

              {isCancelled ? (
                <div className="mt-2 text-sm text-red-700">
                  This order is already cancelled.
                </div>
              ) : hasCourier ? (
                <div className="mt-2 text-sm text-gray-700">
                  This order has already been sent to the courier. Cancellation from this page is disabled for safety.
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm text-gray-600">
                    Cancel this order only if the customer no longer wants it. The ordered quantity will automatically be restored to inventory.
                  </p>

                  <button
                    onClick={
                      handleCancelOrder
                    }
                    disabled={
                      cancelLoading ||
                      loading ||
                      paymentLoading
                    }
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelLoading
                      ? "Cancelling..."
                      : "Cancel Order"}
                  </button>
                </>
              )}

              {cancelMessage && (
                <div className="mt-3 rounded-lg bg-white p-3 text-sm">
                  {
                    cancelMessage
                  }
                </div>
              )}

            </div>

          </section>

          {/* =================================
              PERMANENT DELETE
          ================================= */}

          <section>

            <hr className="mb-5" />

            <div className="rounded-xl border border-red-300 bg-red-50 p-4">

              <h3 className="font-bold text-red-800">
                Permanent Delete
              </h3>

              <p className="mt-2 text-sm text-red-700">
                Permanently deleting an order removes the order and its order items from the database. If stock has not already been restored, the server will restore it safely before deletion. This action cannot be undone.
              </p>

              <button
                type="button"
                onClick={
                  handlePermanentDeleteOrder
                }
                disabled={
                  deleteLoading ||
                  loading ||
                  cancelLoading ||
                  paymentLoading
                }
                className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading
                  ? "Deleting..."
                  : "🗑️ Permanently Delete Order"}
              </button>

              {deleteMessage && (
                <div className="mt-3 rounded-lg bg-white p-3 text-sm">
                  {deleteMessage}
                </div>
              )}

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}