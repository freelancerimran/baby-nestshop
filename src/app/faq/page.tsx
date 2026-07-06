import Link from "next/link";

export default function FAQPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Frequently Asked Questions
          </span>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            How Can We Help?
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Find answers to the most common questions about ordering,
            delivery, products, returns and customer support.
          </p>
        </div>

        {/* Quick Help Cards */}
        <div className="mb-16 grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-4xl">📦</div>
            <h3 className="mb-2 text-xl font-semibold">
              Orders
            </h3>
            <p className="text-gray-600">
              Questions about placing and managing orders.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-4xl">🚚</div>
            <h3 className="mb-2 text-xl font-semibold">
              Delivery
            </h3>
            <p className="text-gray-600">
              Learn about shipping times and delivery process.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-4xl">💬</div>
            <h3 className="mb-2 text-xl font-semibold">
              Support
            </h3>
            <p className="text-gray-600">
              Need help? Our support team is here for you.
            </p>
          </div>

        </div>

        {/* FAQ Section */}
        <div className="space-y-4">

          <details className="group rounded-3xl bg-white p-6 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
              How long does delivery take?
              <span className="transition group-open:rotate-180">
                ▼
              </span>
            </summary>

            <p className="mt-4 text-gray-600 leading-7">
              Delivery usually takes 1–2 business days inside Dhaka
              and 2–5 business days outside Dhaka depending on location.
            </p>
          </details>

          <details className="group rounded-3xl bg-white p-6 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
              Do you offer Cash On Delivery?
              <span className="transition group-open:rotate-180">
                ▼
              </span>
            </summary>

            <p className="mt-4 text-gray-600 leading-7">
              Yes, Cash On Delivery (COD) is available across Bangladesh.
            </p>
          </details>

          <details className="group rounded-3xl bg-white p-6 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
              What age group are your products suitable for?
              <span className="transition group-open:rotate-180">
                ▼
              </span>
            </summary>

            <p className="mt-4 text-gray-600 leading-7">
              Most of our educational books and learning products are designed
              for children aged 2–8 years.
            </p>
          </details>

          <details className="group rounded-3xl bg-white p-6 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
              How can I place an order?
              <span className="transition group-open:rotate-180">
                ▼
              </span>
            </summary>

            <p className="mt-4 text-gray-600 leading-7">
              Simply open a product page, fill out the order form,
              and submit your order.
            </p>
          </details>

          <details className="group rounded-3xl bg-white p-6 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
              Can I return a product?
              <span className="transition group-open:rotate-180">
                ▼
              </span>
            </summary>

            <p className="mt-4 text-gray-600 leading-7">
              Yes. Please review our Refund Policy for details regarding
              returns, replacements and refunds.
            </p>
          </details>

          <details className="group rounded-3xl bg-white p-6 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
              How do I track my order?
              <span className="transition group-open:rotate-180">
                ▼
              </span>
            </summary>

            <p className="mt-4 text-gray-600 leading-7">
              You can use our Track Order page to check the latest status
              of your order.
            </p>
          </details>

        </div>

        {/* Support CTA */}
        <div className="mt-16 rounded-3xl bg-white p-10 text-center shadow-sm">

          <h2 className="mb-4 text-3xl font-bold">
            Still Have Questions?
          </h2>

          <p className="mb-6 text-gray-600">
            Our support team is always happy to help you.
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
            Explore Educational Products
          </h2>

          <p className="mb-8 text-lg text-green-100">
            Discover books and learning toys designed to make learning fun.
          </p>

          <Link
            href="/shop"
            className="inline-flex rounded-xl bg-white px-8 py-4 font-semibold text-green-600"
          >
            Shop Now
          </Link>

        </div>

      </div>
    </div>
  );
}