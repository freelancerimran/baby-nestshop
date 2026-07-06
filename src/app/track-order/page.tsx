import Link from "next/link";

export default function TrackOrderPage() {
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

          <form className="space-y-5">

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Order ID
              </label>

              <input
                type="text"
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
                placeholder="Enter your phone number"
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-green-600 px-8 py-4 font-semibold text-white transition hover:bg-green-700"
            >
              Track Order
            </button>

          </form>

        </div>

        {/* Status Preview */}
        <div className="mb-16 rounded-3xl bg-white p-8 shadow-sm">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Order ID
              </p>

              <h3 className="text-xl font-bold">
                #BN-12345
              </h3>
            </div>

            <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
              Processing
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <p className="text-sm text-gray-500">
                Customer Name
              </p>

              <p className="font-medium">
                Customer Name
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Phone Number
              </p>

              <p className="font-medium">
                01XXXXXXXXX
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Product
              </p>

              <p className="font-medium">
                Educational Busy Book
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Delivery Status
              </p>

              <p className="font-medium text-green-600">
                Processing
              </p>
            </div>

          </div>

        </div>

        {/* Order Timeline */}
        <div className="mb-16">

          <h2 className="mb-10 text-center text-3xl font-bold">
            Delivery Progress
          </h2>

          <div className="grid gap-6 md:grid-cols-4">

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="mb-3 text-4xl">🛒</div>

              <h3 className="font-semibold">
                Order Placed
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Order received successfully
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="mb-3 text-4xl">✅</div>

              <h3 className="font-semibold">
                Confirmed
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Order verified by team
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="mb-3 text-4xl">🚚</div>

              <h3 className="font-semibold">
                Shipped
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Sent to courier partner
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
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