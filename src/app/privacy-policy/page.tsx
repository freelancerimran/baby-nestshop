import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Privacy Policy
          </span>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Privacy Policy
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Your privacy is important to us. This policy explains how Baby Nest
            collects, uses, and protects your personal information.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              1. Information We Collect
            </h2>

            <p className="text-gray-600 leading-8">
              We may collect personal information such as your name, phone number,
              email address, delivery address, and order details when you place
              an order or contact us through our website.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              2. How We Use Your Information
            </h2>

            <p className="text-gray-600 leading-8">
              Your information is used to process orders, provide customer support,
              improve our services, communicate order updates, and enhance your
              shopping experience.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              3. Order & Delivery Information
            </h2>

            <p className="text-gray-600 leading-8">
              Customer information may be shared with trusted courier partners
              solely for the purpose of delivering orders and providing shipment updates.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              4. Data Security
            </h2>

            <p className="text-gray-600 leading-8">
              We take reasonable measures to protect your personal information
              from unauthorized access, misuse, loss, or disclosure.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              5. Cookies & Analytics
            </h2>

            <p className="text-gray-600 leading-8">
              Our website may use cookies and analytics tools to improve website
              performance, understand visitor behavior, and enhance user experience.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              6. Third-Party Services
            </h2>

            <p className="text-gray-600 leading-8">
              We may use third-party services such as payment providers,
              courier companies, analytics platforms, and marketing tools.
              These services operate under their own privacy policies.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              7. Your Rights
            </h2>

            <p className="text-gray-600 leading-8">
              You may request updates, corrections, or removal of your personal
              information by contacting our support team, subject to legal and
              operational requirements.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">
              8. Policy Updates
            </h2>

            <p className="text-gray-600 leading-8">
              Baby Nest reserves the right to update this Privacy Policy at any
              time. Updated versions will be published on this page.
            </p>
          </div>

        </div>

        {/* Support Section */}
        <div className="mt-16 rounded-3xl bg-white p-10 text-center shadow-sm">
          <h2 className="mb-4 text-3xl font-bold">
            Questions About Privacy?
          </h2>

          <p className="mb-6 text-gray-600">
            If you have any questions about how we collect or use your data,
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
            Safe & Secure Shopping
          </h2>

          <p className="mb-8 text-lg text-green-100">
            Shop educational books and learning toys with confidence at Baby Nest.
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