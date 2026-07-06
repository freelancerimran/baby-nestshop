import { supabase } from "@/lib/supabase";
import Link from "next/link";

async function getSettings() {
  const { data } = await supabase
    .from("settings")
    .select("*")
    .single();

  return data;
}

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Contact Baby Nest
          </span>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            We're Here To Help
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Have questions about our educational books and learning toys?
            Our team is always ready to help parents choose the perfect
            products for their children.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="mb-16 grid gap-6 md:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
            <div className="mb-3 text-3xl">📞</div>
            <h3 className="mb-2 font-semibold">Phone</h3>
            <p className="text-gray-600">{settings?.phone}</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
            <div className="mb-3 text-3xl">📧</div>
            <h3 className="mb-2 font-semibold">Email</h3>
            <p className="text-gray-600 break-all">
              {settings?.email}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
            <div className="mb-3 text-3xl">💬</div>
            <h3 className="mb-2 font-semibold">WhatsApp</h3>
            <p className="text-gray-600">
              {settings?.whatsapp}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
            <div className="mb-3 text-3xl">📘</div>
            <h3 className="mb-2 font-semibold">Facebook</h3>

            <a
              href={settings?.facebook}
              target="_blank"
              className="text-green-600 hover:text-green-700"
            >
              Visit Page →
            </a>
          </div>

        </div>

        {/* Main Section */}
        <div className="grid gap-10 lg:grid-cols-2">

          {/* Left Side */}
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold">
              Contact Information
            </h2>

            <div className="space-y-6">

              <div>
                <p className="mb-1 text-sm text-gray-500">
                  Phone Number
                </p>
                <p className="font-medium">
                  {settings?.phone}
                </p>
              </div>

              <div>
                <p className="mb-1 text-sm text-gray-500">
                  Email Address
                </p>
                <p className="font-medium">
                  {settings?.email}
                </p>
              </div>

              <div>
                <p className="mb-1 text-sm text-gray-500">
                  WhatsApp
                </p>
                <p className="font-medium">
                  {settings?.whatsapp}
                </p>
              </div>

              <div>
                <p className="mb-1 text-sm text-gray-500">
                  Facebook
                </p>

                <a
                  href={settings?.facebook}
                  target="_blank"
                  className="font-medium text-green-600"
                >
                  Open Facebook Page
                </a>
              </div>

            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold">
              Send Us A Message
            </h2>

            <form className="space-y-4">

              <input
                type="text"
                placeholder="Your Name"
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-green-500"
              />

              <input
                type="email"
                placeholder="Your Email"
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-green-500"
              />

              <input
                type="text"
                placeholder="Phone Number"
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-green-500"
              />

              <textarea
                rows={6}
                placeholder="Write your message..."
                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-green-500"
              />

              <button
                type="submit"
                className="rounded-xl bg-green-600 px-8 py-4 font-medium text-white transition hover:bg-green-700"
              >
                Send Message
              </button>

            </form>
          </div>

        </div>

        {/* Trust Section */}
        <div className="mt-20">

          <h2 className="mb-10 text-center text-3xl font-bold">
            Why Parents Trust Baby Nest
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">🚚</div>
              <h3 className="mb-2 font-semibold">
                Fast Delivery
              </h3>
              <p className="text-gray-600">
                Quick delivery all across Bangladesh.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">🔒</div>
              <h3 className="mb-2 font-semibold">
                Safe Shopping
              </h3>
              <p className="text-gray-600">
                Secure ordering with trusted service.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">⭐</div>
              <h3 className="mb-2 font-semibold">
                Trusted By Parents
              </h3>
              <p className="text-gray-600">
                Loved by families across Bangladesh.
              </p>
            </div>

          </div>

        </div>

        {/* WhatsApp CTA */}
        <div className="mt-20 rounded-3xl bg-green-600 p-12 text-center text-white">

          <h2 className="mb-4 text-4xl font-bold">
            Need Quick Help?
          </h2>

          <p className="mb-8 text-lg text-green-100">
            Chat directly with our support team on WhatsApp.
          </p>

          <a
            href={settings?.whatsapp}
            target="_blank"
            className="inline-flex rounded-xl bg-white px-8 py-4 font-semibold text-green-600"
          >
            💬 WhatsApp Now
          </a>

        </div>

      </div>
    </div>
  );
}