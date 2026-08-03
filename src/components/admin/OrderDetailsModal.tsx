"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

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

  paidAmount?: number;
  dueAmount?: number;
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
  CANCEL ORDER STATE
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
  ORDER STATE HELPERS
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
  UPDATE PAYMENT
  ========================================
  */

  const handleUpdatePayment =
    async () => {
      /*
      Cancelled orders must never have
      their payment changed.
      */

      if (isCancelled) {
        setPaymentMessage(
          "❌ Payment cannot be changed because this order is cancelled."
        );

        return;
      }

      try {
        setPaymentLoading(
          true
        );

        setPaymentMessage(
          ""
        );

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
      /*
      Cancelled orders must never be
      sent to courier.
      */

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

        setMessage(
          ""
        );

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

        setMessage(
          ""
        );

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

  IMPORTANT:

  Backend PostgreSQL function performs
  the actual atomic stock restoration.

  The UI never changes stock directly.
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

      /*
      ======================================
      CONFIRMATION
      ======================================
      */

      const confirmed =
        window.confirm(
          `Cancel order ${order.orderId}?\n\nThe ordered quantity (${order.quantity}) will be restored to inventory.\n\nThis action should only be used when the customer has cancelled the order.`
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

        setCancelMessage(
          ""
        );

        setPaymentMessage(
          ""
        );

        setMessage(
          ""
        );

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

        /*
        ====================================
        UPDATE LOCAL UI
        ====================================
        */

        setOrderStatus(
          "Cancelled"
        );

        setCancelMessage(
          data.alreadyCancelled
            ? "ℹ️ Order was already cancelled. Stock was not restored again."
            : "✅ Order cancelled successfully and stock restored."
        );

        /*
        ====================================
        REFRESH SERVER COMPONENT DATA
        ====================================
        */

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">

        {/* ================================
            HEADER
        ================================ */}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Order Details
          </h2>

          <button
            onClick={
              onClose
            }
            className="rounded bg-gray-200 px-3 py-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">

          {/* ================================
              ORDER INFORMATION
          ================================ */}

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
              Address:
            </strong>{" "}
            {order.address}
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

          <p>
            <strong>
              Product:
            </strong>{" "}
            {order.productName}
          </p>

          <p>
            <strong>
              Quantity:
            </strong>{" "}
            {order.quantity}
          </p>

          <p>
            <strong>
              Total:
            </strong>{" "}
            ৳
            {Number(
              order.total
            ).toLocaleString()}
          </p>

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

          {/* ================================
              CANCELLED NOTICE
          ================================ */}

          {isCancelled && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="font-bold">
                Order Cancelled
              </div>

              <div className="mt-1">
                This order has been cancelled and its stock has been restored to inventory.
              </div>
            </div>
          )}

          {/* ================================
              PAYMENT INFORMATION
          ================================ */}

          <hr className="my-4" />

          <h3 className="text-lg font-bold">
            Payment Information
          </h3>

          <div className="rounded-xl border bg-gray-50 p-4">

            <div className="grid gap-3 sm:grid-cols-3">

              <div>
                <div className="text-xs text-gray-500">
                  Order Total
                </div>

                <div className="text-lg font-bold">
                  ৳
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
                  ৳
                  {paidAmount.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Due / COD
                </div>

                <div className="text-lg font-bold text-red-700">
                  ৳
                  {dueAmount.toLocaleString()}
                </div>
              </div>

            </div>

            <div className="mt-4">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${paymentBadge}`}
              >
                {paymentStatus}
              </span>
            </div>

            {/* ==============================
                PAYMENT EDITING
            ============================== */}

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
                {paymentMessage}
              </div>
            )}

          </div>

          {/* ================================
              COURIER INFORMATION
          ================================ */}

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
            <div className="rounded bg-gray-100 p-3 text-sm">
              {message}
            </div>
          )}

          {/* ================================
              COURIER ACTIONS
          ================================ */}

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
                  className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
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
                  disabled={
                    refreshing
                  }
                  className="rounded bg-orange-500 px-4 py-2 text-white disabled:opacity-60"
                >
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh Status"}
                </button>
              )}

            </div>
          )}

          {/* ================================
              CANCEL ORDER
          ================================ */}

          <hr className="my-5" />

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
                {cancelMessage}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}