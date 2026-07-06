import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Terms & Conditions
          </span>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Terms & Conditions
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Please read these terms and conditions carefully before using
            Baby Nest. By placing an order, you agree to the terms outlined below.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              1. General Information
            </h2>

            <p className="text-gray-600 leading-8">
              Baby Nest provides educational books, activity books, busy books,
              puzzles, and learning toys for children. By accessing or using
              our website, you agree to comply with these terms and conditions.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              2. Product Information
            </h2>

            <p className="text-gray-600 leading-8">
              We strive to ensure all product descriptions, images, pricing,
              and availability information are accurate. However, occasional
              errors may occur, and Baby Nest reserves the right to correct
              them without prior notice.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              3. Orders & Confirmation
            </h2>

            <p className="text-gray-600 leading-8">
              Orders placed through our website are subject to confirmation.
              We may contact customers to verify order details before shipment.
              Baby Nest reserves the right to cancel suspicious or incomplete orders.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              4. Pricing & Payments
            </h2>

            <p className="text-gray-600 leading-8">
              All prices displayed on the website are in Bangladeshi Taka (BDT).
              Prices may change without prior notice. Customers are responsible
              for paying the amount shown at the time of order placement.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              5. Delivery Policy
            </h2>

            <p className="text-gray-600 leading-8">
              Delivery timelines may vary depending on location, courier service,
              weather conditions, or other unforeseen circumstances. Estimated
              delivery times are provided for guidance only.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              6. Returns & Refunds
            </h2>

            <p className="text-gray-600 leading-8">
              Return and refund requests will be handled according to our Refund
              Policy. Customers should inspect products upon delivery and report
              any issues within the applicable timeframe.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              7. Limitation of Liability
            </h2>

            <p className="text-gray-600 leading-8">
              Baby Nest shall not be liable for indirect, incidental, or
              consequential damages arising from the use of products or services
              purchased through our website.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              8. Changes to Terms
            </h2>

            <p className="text-gray-600 leading-8">
              We reserve the right to update or modify these terms and conditions
              at any time. Updated versions will be posted on this page.
            </p>
          </div>

        </div>

        {/* Support Section */}
        <div className="mt-16 rounded-3xl bg-white p-10 text-center shadow-sm">
          <h2 className="mb-4 text-3xl font-bold">
            Need Help?
          </h2>

          <p className="mb-6 text-gray-600">
            If you have questions regarding our Terms & Conditions,
            please contact our support team.
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
            Shop With Confidence
          </h2>

          <p className="mb-8 text-lg text-green-100">
            Discover educational books and learning toys trusted by parents
            across Bangladesh.
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