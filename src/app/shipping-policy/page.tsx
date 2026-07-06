import Link from "next/link";

export default function ShippingPolicyPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Shipping Policy
          </span>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Shipping & Delivery Policy
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Learn how Baby Nest processes, ships, and delivers your orders
            across Bangladesh.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              1. Delivery Coverage
            </h2>

            <p className="text-gray-600 leading-8">
              Baby Nest delivers products throughout Bangladesh using trusted
              courier partners. Delivery availability may vary depending on
              location and courier coverage.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              2. Order Processing Time
            </h2>

            <p className="text-gray-600 leading-8">
              Orders are generally processed within 1–2 business days after
              confirmation. During peak seasons or promotional campaigns,
              processing may take slightly longer.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              3. Estimated Delivery Time
            </h2>

            <p className="text-gray-600 leading-8">
              Delivery timelines may vary depending on your location.
              Most orders are delivered within 2–7 business days after shipment.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              4. Shipping Charges
            </h2>

            <p className="text-gray-600 leading-8">
              Shipping charges may vary depending on location, courier service,
              and ongoing promotional offers. Applicable delivery charges will
              be communicated during the order process.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              5. Delivery Delays
            </h2>

            <p className="text-gray-600 leading-8">
              Delivery may occasionally be delayed due to weather conditions,
              public holidays, transportation disruptions, or courier-related
              issues beyond our control.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              6. Order Verification
            </h2>

            <p className="text-gray-600 leading-8">
              Baby Nest may contact customers to verify order details before
              dispatching products. Orders may be delayed or cancelled if
              verification cannot be completed.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              7. Failed Delivery Attempts
            </h2>

            <p className="text-gray-600 leading-8">
              Customers are responsible for providing accurate delivery
              information. Additional charges may apply if re-delivery is
              required due to incorrect information or unavailability.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              8. Policy Updates
            </h2>

            <p className="text-gray-600 leading-8">
              Baby Nest reserves the right to modify this Shipping Policy at
              any time. Updated versions will be published on this page.
            </p>
          </div>

        </div>

        {/* Support Section */}
        <div className="mt-16 rounded-3xl bg-white p-10 text-center shadow-sm">
          <h2 className="mb-4 text-3xl font-bold">
            Questions About Delivery?
          </h2>

          <p className="mb-6 text-gray-600">
            Our support team is available to help with shipping,
            delivery, and order-related questions.
          </p>

          <Link
            href="/contact"
            className="inline-flex rounded-xl bg-green-600 px-8 py-4 font-semibold text-white hover:bg-green-700"
          >
            Contact Support
          </Link>
        </div>

        {/* CTA Section */}
        <div className="mt-16 rounded-3xl bg-green-600 p-12 text-center text-white">
          <h2 className="mb-4 text-4xl font-bold">
            Fast Delivery Across Bangladesh
          </h2>

          <p className="mb-8 text-lg text-green-100">
            Order educational books and learning toys with reliable delivery
            and trusted customer support.
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