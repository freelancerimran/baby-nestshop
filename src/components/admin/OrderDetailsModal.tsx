"use client";

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

interface Props {
  order: Order;
  onClose: () => void;
}

export default function OrderDetailsModal({
  order,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">

        <div className="border-b p-5">
          <h2 className="text-xl font-bold">
            Order Details
          </h2>

          <p className="text-sm text-gray-500">
            View complete order information
          </p>
        </div>

        <div className="space-y-4 p-5">

          <div>
            <h3 className="mb-2 font-semibold">
              Order Information
            </h3>

            <p>
              <strong>Order ID:</strong>{" "}
              {order.orderId}
            </p>

            <p>
              <strong>Date:</strong>{" "}
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
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {order.status}
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">
              Customer Information
            </h3>

            <p>
              <strong>Name:</strong>{" "}
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
          </div>

          <div>
            <h3 className="mb-2 font-semibold">
              Product Information
            </h3>

            <p>
              <strong>Product:</strong>{" "}
              {order.productName}
            </p>

            <p>
              <strong>Quantity:</strong>{" "}
              {order.quantity}
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">
              Payment Information
            </h3>

            <p>
              <strong>Total:</strong> ৳
              {order.total}
            </p>

            <p>
              <strong>Delivery:</strong> ৳
              {order.deliveryCharge}
            </p>

            <p>
              <strong>Discount:</strong> ৳
              {order.discount}
            </p>

            <p>
              <strong>Coupon:</strong>{" "}
              {order.couponCode || "-"}
            </p>
          </div>

        </div>

        <div className="flex justify-end border-t p-5">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-800 px-4 py-2 text-white"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}