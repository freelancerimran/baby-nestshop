"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import {
  CheckCircle2,
  Truck,
  Phone,
  ShoppingBag,
  Home,
} from "lucide-react";

/*
============================================================
ORDER SUCCESS CONTENT
============================================================
*/

function OrderSuccessContent() {
  const searchParams =
    useSearchParams();

  const orderId =
    searchParams.get("order") ||
    "N/A";

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-3xl px-5">

        <div className="rounded-3xl bg-white p-10 shadow-lg">

          {/* ================================
              SUCCESS
          ================================= */}

          <div className="text-center">

            <CheckCircle2
              className="mx-auto text-green-600"
              size={90}
            />

            <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
              🎉 অর্ডার সফল হয়েছে
            </h1>

            <p className="mt-4 text-lg text-gray-600">
              ধন্যবাদ।
              <br />
              আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।
            </p>

          </div>


          {/* ================================
              ORDER ID
          ================================= */}

          <div className="mt-10 rounded-2xl bg-gray-100 p-6 text-center">

            <p className="text-gray-500">
              Order ID
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {orderId}
            </h2>

          </div>


          {/* ================================
              TIMELINE
          ================================= */}

          <div className="mt-10 space-y-5 rounded-2xl border p-6">

            <div className="flex gap-4">

              <Phone className="text-teal-600" />

              <div>

                <h3 className="font-bold">
                  Order Confirmation
                </h3>

                <p className="text-gray-600">
                  আগামী ১৫–৩০ মিনিটের মধ্যে
                  আমাদের প্রতিনিধি ফোন করবেন।
                </p>

              </div>

            </div>


            <div className="flex gap-4">

              <Truck className="text-teal-600" />

              <div>

                <h3 className="font-bold">
                  Delivery
                </h3>

                <p className="text-gray-600">
                  ঢাকা: ১–২ দিন
                  <br />
                  ঢাকার বাইরে: ২–৪ দিন
                </p>

              </div>

            </div>

          </div>


          {/* ================================
              TRUST
          ================================= */}

          <div className="mt-10 rounded-2xl bg-amber-50 p-6">

            <h3 className="text-xl font-bold">
              ❤️ Baby Nest-এর উপর বিশ্বাস রাখার জন্য ধন্যবাদ
            </h3>

            <p className="mt-3 text-gray-700">
              হাজারো অভিভাবকের মতো আপনিও
              Baby Nest পরিবারের একজন সদস্য।
            </p>

          </div>


          {/* ================================
              BUTTONS
          ================================= */}

          <div className="mt-10 grid gap-4 md:grid-cols-2">

            <Link
              href="/track-order"
              className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 py-4 font-bold text-white transition hover:bg-teal-700"
            >
              <Truck size={20} />
              Track Order
            </Link>


            <Link
              href="/shop"
              className="flex items-center justify-center gap-2 rounded-2xl border py-4 font-bold transition hover:bg-gray-100"
            >
              <ShoppingBag size={20} />
              Continue Shopping
            </Link>

          </div>


          <Link
            href="/"
            className="mt-6 flex items-center justify-center gap-2 text-gray-500 hover:text-black"
          >
            <Home size={18} />
            Back To Home
          </Link>

        </div>

      </div>
    </main>
  );
}


/*
============================================================
PAGE
============================================================

Next.js 16 requires useSearchParams() to be inside
a Suspense boundary during production rendering.
============================================================
*/

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 py-10">
          <div className="mx-auto max-w-3xl px-5">
            <div className="rounded-3xl bg-white p-10 shadow-lg">
              <div className="text-center">
                <div className="mx-auto h-[90px] w-[90px] animate-pulse rounded-full bg-gray-200" />

                <div className="mx-auto mt-6 h-10 w-72 animate-pulse rounded bg-gray-200" />

                <div className="mx-auto mt-4 h-6 w-96 max-w-full animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}