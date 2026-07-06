export const revalidate = 300;

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "Active")
    .eq("featured", true)
    .order("product_id", {
      ascending: true,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1);

  if (error) {
    console.error(error);

    return null;
  }

  return data?.[0] || null;
}
async function getBestSellerProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "Active")
    .eq("best_seller", true)
    .order("product_id", {
      ascending: true,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

async function getNewArrivalProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "Active")
    .eq("new_arrival", true)
    .order("product_id", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}
export default async function Home() {
const [
  products,
  bestSellerProducts,
  newArrivalProducts,
  settings,
] = await Promise.all([
  getFeaturedProducts(),
  getBestSellerProducts(),
  getNewArrivalProducts(),
  getSettings(),
]);

  return (
    <main className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">

          {/* Left */}
          <div>

            <span className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              📚 Educational Books & Learning Toys
            </span>

            <h1 className="mt-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
              {settings?.hero_title ||
                "শিশুদের শেখার সবচেয়ে মজার বই ও খেলনা"}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
              {settings?.hero_subtitle ||
                "Busy Books, Puzzle Books, Water Painting Books এবং Learning Toys"}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                href={
                  settings?.hero_button_link ||
                  "/shop"
                }
                className="rounded-full bg-emerald-600 px-8 py-4 font-semibold text-white transition hover:bg-emerald-700"
              >
                {settings?.hero_button_text ||
                  "Shop Now"}
              </Link>

              <Link
                href="/shop"
                className="rounded-full border border-gray-300 px-8 py-4 font-semibold text-gray-700 transition hover:border-emerald-600 hover:text-emerald-600"
              >
                View Products
              </Link>

            </div>

          </div>

          {/* Right */}
          <div className="flex justify-center">

{settings?.hero_image ? (
  <div className="relative w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl">
    <Image
      src={settings.hero_image}
      alt="Hero"
      width={800}
      height={800}
      priority
      sizes="(max-width:768px) 100vw, 50vw"
      className="h-auto w-full object-cover"
    />
  </div>
) : (
              <div className="flex h-[450px] w-full max-w-xl items-center justify-center rounded-3xl bg-emerald-100 text-center">
                <div>
                  <div className="text-7xl">
                    📚
                  </div>

                  <p className="mt-4 text-lg font-medium text-gray-700">
                    Upload Hero Image
                  </p>

                  <p className="text-sm text-gray-500">
                    Admin → Settings
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-12 text-center">

            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              Featured Collection
            </span>

            <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Featured Products
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Carefully selected educational books and learning toys
              designed to help your child learn, play and grow.
            </p>

          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 py-20 text-center">
              <h3 className="text-xl font-semibold text-gray-800">
                No Products Found
              </h3>

              <p className="mt-2 text-gray-500">
                Add products from Admin Panel.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
<ProductCard
  key={product.product_id}
  id={Number(product.product_id)}
  slug={product.slug}
  name={product.product_name}
  price={Number(product.price)}
  image={product.image || ""}
  stock={Number(product.display_stock)}
  featured={product.featured}
  bestSeller={product.best_seller}
  newArrival={product.new_arrival}
/>
              ))}
            </div>
          )}

        </div>

      </section>
{/* Best Seller Products */}
<section className="py-20 bg-white">
  <div className="mx-auto max-w-7xl px-6">

    <div className="mb-12 text-center">
      <span className="inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
        🔥 Best Sellers
      </span>

      <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
        Best Selling Products
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-gray-600">
        Most loved products by parents and children.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {bestSellerProducts.map((product) => (
<ProductCard
  key={product.product_id}
  id={Number(product.product_id)}
  slug={product.slug}
  name={product.product_name}
  price={Number(product.price)}
  image={product.image || ""}
  stock={Number(product.display_stock)}
  featured={product.featured}
  bestSeller={product.best_seller}
  newArrival={product.new_arrival}
/>
      ))}
    </div>

  </div>
</section>

{/* Best Seller Products */}
<section className="py-20 bg-white">
  <div className="mx-auto max-w-7xl px-6">

    <div className="mb-12 text-center">
      <span className="inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
        ✨ New Arrivals
      </span>

      <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
        New Arrival Products
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-gray-600">
        Most loved products by parents and children.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {newArrivalProducts.map((product) => (
<ProductCard
  key={product.product_id}
  id={Number(product.product_id)}
  slug={product.slug}
  name={product.product_name}
  price={Number(product.price)}
  image={product.image || ""}
  stock={Number(product.display_stock)}
  featured={product.featured}
  bestSeller={product.best_seller}
  newArrival={product.new_arrival}
/>
      ))}
    </div>

  </div>
</section>


{/* Why Choose Baby Nest */}
<section className="bg-emerald-50 py-20">
  <div className="mx-auto max-w-7xl px-6">

    <div className="mb-14 text-center">
      <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
        Why Choose Us
      </span>

      <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
        Why Parents Love Baby Nest
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-gray-600">
        Carefully selected educational books and learning toys designed
        to help children learn, play and grow.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="text-4xl">📚</div>

        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Educational Products
        </h3>

        <p className="mt-2 text-gray-600">
          Books and toys that encourage learning through play.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="text-4xl">🚚</div>

        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Fast Delivery
        </h3>

        <p className="mt-2 text-gray-600">
          Quick delivery all across Bangladesh.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="text-4xl">⭐</div>

        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Trusted By Parents
        </h3>

        <p className="mt-2 text-gray-600">
          Loved by thousands of parents and children.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="text-4xl">🎁</div>

        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Premium Quality
        </h3>

        <p className="mt-2 text-gray-600">
          Carefully sourced products with child-friendly quality.
        </p>
      </div>

    </div>

  </div>
</section>

{/* Customer Reviews */}
<section className="py-20 bg-white">
  <div className="container mx-auto px-4">

    <div className="text-center mb-12">
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
        ⭐ Parent Reviews
      </span>

      <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900">
        Loved by Parents Across Bangladesh
      </h2>

      <p className="mt-4 max-w-2xl mx-auto text-gray-600">
        Thousands of parents trust Baby Nest educational products
        to make learning fun, interactive, and screen-free.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-3">

      {/* Review 1 */}
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg transition">
        <div className="mb-4 flex text-yellow-400">
          ⭐⭐⭐⭐⭐
        </div>

        <p className="text-gray-600 leading-relaxed">
          আমার ছেলে মোবাইলের বদলে এখন Busy Book নিয়ে খেলতে ভালোবাসে।
          Quality অনেক ভালো এবং learning activities গুলোও খুব useful।
        </p>

        <div className="mt-6">
          <h4 className="font-semibold text-gray-900">
            Fatema Akter
          </h4>
          <p className="text-sm text-gray-500">
            Dhaka
          </p>
        </div>
      </div>

      {/* Review 2 */}
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg transition">
        <div className="mb-4 flex text-yellow-400">
          ⭐⭐⭐⭐⭐
        </div>

        <p className="text-gray-600 leading-relaxed">
          Alphabet Busy Book টা আমার মেয়ের খুব পছন্দ হয়েছে।
          Packaging, printing এবং materials সবকিছু premium feel দিয়েছে।
        </p>

        <div className="mt-6">
          <h4 className="font-semibold text-gray-900">
            Nusrat Jahan
          </h4>
          <p className="text-sm text-gray-500">
            Chattogram
          </p>
        </div>
      </div>

      {/* Review 3 */}
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg transition">
        <div className="mb-4 flex text-yellow-400">
          ⭐⭐⭐⭐⭐
        </div>

        <p className="text-gray-600 leading-relaxed">
          Delivery খুব fast ছিল। Product হাতে পাওয়ার পর বুঝেছি
          এটা সত্যিই educational toy category-র একটি quality product।
        </p>

        <div className="mt-6">
          <h4 className="font-semibold text-gray-900">
            Sharmin Rahman
          </h4>
          <p className="text-sm text-gray-500">
            Sylhet
          </p>
        </div>
      </div>

    </div>

    {/* Stats */}
    <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">

      <div className="text-center">
        <h3 className="text-3xl font-bold text-emerald-600">
          5K+
        </h3>
        <p className="mt-2 text-gray-600">
          Happy Parents
        </p>
      </div>

      <div className="text-center">
        <h3 className="text-3xl font-bold text-emerald-600">
          10K+
        </h3>
        <p className="mt-2 text-gray-600">
          Products Delivered
        </p>
      </div>

      <div className="text-center">
        <h3 className="text-3xl font-bold text-emerald-600">
          4.9★
        </h3>
        <p className="mt-2 text-gray-600">
          Average Rating
        </p>
      </div>

      <div className="text-center">
        <h3 className="text-3xl font-bold text-emerald-600">
          64
        </h3>
        <p className="mt-2 text-gray-600">
          District Coverage
        </p>
      </div>

    </div>

  </div>
</section>

{/* FAQ Section */}
<section className="py-20 bg-emerald-50">
  <div className="container mx-auto px-4">

    <div className="text-center mb-12">
      <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-emerald-700">
        ❓ Frequently Asked Questions
      </span>

      <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900">
        Common Questions From Parents
      </h2>

      <p className="mt-4 max-w-2xl mx-auto text-gray-600">
        Everything you need to know before ordering from Baby Nest.
      </p>
    </div>

    <div className="mx-auto max-w-4xl space-y-4">

      <details className="group rounded-2xl bg-white p-6 shadow-sm">
        <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-gray-900">
          কত দিনে ডেলিভারি পাবো?
          <span className="transition group-open:rotate-180">
            ▼
          </span>
        </summary>

        <p className="mt-4 text-gray-600">
          ঢাকা শহরের ভিতরে সাধারণত ১-২ কার্যদিবস এবং
          ঢাকার বাইরে ২-৪ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন করা হয়।
        </p>
      </details>

      <details className="group rounded-2xl bg-white p-6 shadow-sm">
        <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-gray-900">
          ক্যাশ অন ডেলিভারি আছে?
          <span className="transition group-open:rotate-180">
            ▼
          </span>
        </summary>

        <p className="mt-4 text-gray-600">
          জি, সারা বাংলাদেশে Cash On Delivery সুবিধা রয়েছে।
        </p>
      </details>

      <details className="group rounded-2xl bg-white p-6 shadow-sm">
        <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-gray-900">
          বইগুলো কোন বয়সের শিশুদের জন্য?
          <span className="transition group-open:rotate-180">
            ▼
          </span>
        </summary>

        <p className="mt-4 text-gray-600">
          আমাদের অধিকাংশ educational book এবং activity book
          ২ থেকে ৬ বছর বয়সী শিশুদের জন্য উপযোগী।
        </p>
      </details>

      <details className="group rounded-2xl bg-white p-6 shadow-sm">
        <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-gray-900">
          অর্ডার কিভাবে করবো?
          <span className="transition group-open:rotate-180">
            ▼
          </span>
        </summary>

        <p className="mt-4 text-gray-600">
          আপনার পছন্দের প্রোডাক্ট নির্বাচন করে Add to Cart অথবা
          Buy Now বাটনে ক্লিক করে অর্ডার সম্পন্ন করতে পারবেন।
        </p>
      </details>

      <details className="group rounded-2xl bg-white p-6 shadow-sm">
        <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-gray-900">
          প্রোডাক্ট যদি পছন্দ না হয়?
          <span className="transition group-open:rotate-180">
            ▼
          </span>
        </summary>

        <p className="mt-4 text-gray-600">
          কোনো সমস্যা থাকলে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।
          আমরা দ্রুত সমাধানের চেষ্টা করব।
        </p>
      </details>

    </div>

  </div>
</section>
{/* CTA Section */}
<section className="py-20">
  <div className="container mx-auto px-4">

    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-16 text-center shadow-xl md:px-16">

      {/* Background Blur */}
      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10">

        <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white">
          🎓 Educational Learning Starts Here
        </span>

        <h2 className="mt-6 text-3xl font-bold text-white md:text-5xl">
          Make Learning Fun
          <br />
          For Your Little One
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-emerald-50">
          Discover engaging books, activity kits and educational products
          designed to help children learn, explore and grow through play.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

          <a
            href="/shop"
            className="rounded-xl bg-white px-8 py-4 font-semibold text-emerald-700 shadow-lg transition hover:scale-105"
          >
            Shop Now
          </a>

          <a
            href="/products"
            className="rounded-xl border border-white/30 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Browse Products
          </a>

        </div>

      </div>

    </div>

  </div>
</section>

    </main>
  );
}