import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Refund Policy
          </span>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Refund & Return Policy
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            We want every customer to have a positive experience with Baby Nest.
            Please review our refund and return policy before placing an order.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              1. Damaged or Incorrect Products
            </h2>

            <p className="text-gray-600 leading-8">
              If you receive a damaged, defective, or incorrect product,
              please contact us as soon as possible after receiving your order.
              We will review the issue and provide an appropriate solution.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              2. Return Eligibility
            </h2>

            <p className="text-gray-600 leading-8">
              Products must be unused, in their original condition,
              and returned with original packaging whenever applicable.
              Return requests may be rejected if the product has been used
              or damaged after delivery.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              3. Return Request Process
            </h2>

            <p className="text-gray-600 leading-8">
              Customers should contact Baby Nest support and provide
              relevant order information, photos, or evidence of the issue.
              Our team will evaluate the request before approving a return
              or replacement.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              4. Non-Refundable Situations
            </h2>

            <p className="text-gray-600 leading-8">
              Refunds may not be available for products that have been used,
              intentionally damaged, or returned without a valid reason.
              Change-of-mind requests may not qualify for a refund.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              5. Replacement Policy
            </h2>

            <p className="text-gray-600 leading-8">
              In certain cases, Baby Nest may provide a replacement product
              instead of a refund if the issue can be resolved through replacement.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              6. Refund Processing
            </h2>

            <p className="text-gray-600 leading-8">
              Approved refunds will be processed using the appropriate method.
              Processing times may vary depending on the payment or delivery method.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              7. Policy Changes
            </h2>

            <p className="text-gray-600 leading-8">
              Baby Nest reserves the right to modify this policy at any time.
              Updated versions will be published on this page.
            </p>
          </div>

        </div>

        {/* Support Section */}
        <div className="mt-16 rounded-3xl bg-white p-10 text-center shadow-sm">
          <h2 className="mb-4 text-3xl font-bold">
            Need Help With A Return?
          </h2>

          <p className="mb-6 text-gray-600">
            Our support team is here to help with return, replacement,
            and refund-related questions.
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
            Shop With Peace Of Mind
          </h2>

          <p className="mb-8 text-lg text-green-100">
            We're committed to providing quality educational products
            and reliable customer support.
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