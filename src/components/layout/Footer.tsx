import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function getSettings() {
  const { data } = await supabase
    .from("settings")
    .select("*")
    .limit(1);

  return data?.[0] || null;
}

export default async function Footer() {
  const settings =
    await getSettings();

  return (
    <footer className="mt-20 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-emerald-600">
  {settings?.logo ? (
    <img
      src={settings.logo}
      alt={settings.site_name || "Logo"}
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="text-xl text-white">
      📚
    </span>
  )}
</div>

              <div>
<h3 className="text-2xl font-bold text-gray-900">
  {settings?.site_name || "Baby Nest"}
</h3>

                <p className="text-sm text-gray-500">
                  Learn • Play • Grow
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-gray-600">
              Educational books, busy books, puzzle books,
              water painting books and learning toys for
              curious young minds.
            </p>

            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p>
  📞 {settings?.phone || "+880 1XXXXXXXXX"}
</p>
<p>
  ✉️ {settings?.email || "support@babynest.com"}
</p>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-5 text-lg font-semibold text-gray-900">
              Shop
            </h4>

            <ul className="space-y-3 text-gray-600">
              <li>
                <Link href="/shop">Busy Books</Link>
              </li>

              <li>
                <Link href="/shop">Puzzle Books</Link>
              </li>

              <li>
                <Link href="/shop">Water Painting Books</Link>
              </li>

              <li>
                <Link href="/shop">Learning Toys</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-5 text-lg font-semibold text-gray-900">
              Company
            </h4>

            <ul className="space-y-3 text-gray-600">
              <li>
                <Link href="/about">About Us</Link>
              </li>

              <li>
                <Link href="/contact">Contact Us</Link>
              </li>

              <li>
                <Link href="/track-order">Track Order</Link>
              </li>

              <li>
                <Link href="/faq">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-5 text-lg font-semibold text-gray-900">
              Get Updates
            </h4>

            <p className="mb-4 text-sm text-gray-600">
              Subscribe to receive offers,
              discounts and product updates.
            </p>

            <form className="space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-600"
              />

              <button
                type="button"
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-gray-200 pt-6">
          <div className="flex flex-col gap-4 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
<p>
  © 2026 {settings?.site_name || "Baby Nest"}. All rights reserved.
</p>

            <div className="flex flex-wrap gap-5">
              <Link href="/privacy-policy">
                Privacy Policy
              </Link>

              <Link href="/terms-and-conditions">
                Terms & Conditions
              </Link>

              <Link href="/refund-policy">
                Refund Policy
              </Link>

              <Link href="/shipping-policy">
                Shipping Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}