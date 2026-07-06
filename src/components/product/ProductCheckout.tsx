import OrderForm from "@/components/OrderForm";
import { Product } from "@/types/product";
import {
  FaWhatsapp,
  FaFacebookMessenger,
} from "react-icons/fa";

type Props = {
  product: Product;
};

export default function ProductCheckout({
  product,
}: Props) {
  const regularPrice = Number(
    product.regularPrice || 0
  );

  const sellingPrice = Number(
    product.sellingPrice || 0
  );

  const saveAmount =
    regularPrice > sellingPrice
      ? regularPrice - sellingPrice
      : 0;

  const discountPercent =
    regularPrice > sellingPrice
      ? Math.round(
          (saveAmount / regularPrice) * 100
        )
      : 0;

  return (
    <div className="sticky top-24">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

        {/* Product Name */}

        <div className="mb-6 space-y-4">

          <h1 className="text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="text-gray-600">
              {product.shortDescription}
            </p>
          )}

          {/* Price Section */}

          {regularPrice > 0 &&
            regularPrice > sellingPrice && (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4">

 <div className="flex items-center gap-2">
  <span className="text-lg font-semibold text-gray-600">
    রেগুলার মূল্য:
  </span>

  <span className="text-2xl font-semibold text-gray-400 line-through">
    ৳ {regularPrice}
  </span>
</div>

<div className="flex items-center gap-2">
  <span className="text-xl font-bold text-red-600">
    অফার মূল্য:
  </span>

  <span className="text-4xl md:text-5xl font-extrabold text-teal-700">
    ৳ {sellingPrice}
  </span>
</div>

                <div className="rounded-xl bg-green-100 px-4 py-3">
                  <p className="font-semibold text-green-700">
                    💰 আপনি সাশ্রয় করছেন ৳{" "}
                    {saveAmount}
                  </p>
                </div>

                <div className="rounded-xl bg-red-100 px-4 py-3">
                  <p className="font-bold text-red-700">
                    🔥 {discountPercent}% OFF
                    চলতেছে
                  </p>

                  <p className="mt-2 text-base font-semibold text-red-600">
                    ⏰ সীমিত সময়ের অফার
                  </p>
                </div>

              </div>
            )}

          {(!regularPrice ||
            regularPrice <= sellingPrice) && (
            <div className="text-4xl font-extrabold text-teal-700">
              ৳ {sellingPrice}
            </div>
          )}

          {/* Stock Alert */}

          {product.displayStock !==
            undefined && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                product.displayStock <= 5
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {product.displayStock <=
              5 ? (
                <>
                  🚨 শেষ{" "}
                  {
                    product.displayStock
                  }{" "}
                  টি বাকি
                  <br />
                  এখনই অর্ডার করুন
                </>
              ) : (
                <>
                  🔥 স্টকে মাত্র{" "}
                  {
                    product.displayStock
                  }{" "}
                  টি বাকি
                </>
              )}
            </div>
          )}

        </div>

        {/* Order Form */}

        <OrderForm product={product} />

        {/* WhatsApp + Messenger */}

        <div className="mt-5 grid grid-cols-2 gap-3">

          <a
            href="https://wa.me/8801734330771"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            <FaWhatsapp size={20} />
            WhatsApp
          </a>

          <a
            href="https://m.me/babynestshops"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <FaFacebookMessenger size={20} />
            Messenger
          </a>

        </div>

        {/* Trust Section */}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

          <h3 className="mb-4 text-lg font-bold text-gray-900">
            🛡️ কেন Baby Nest থেকে
            অর্ডার করবেন?
          </h3>

          <div className="space-y-3 text-sm text-gray-700">

            <div>
              🚚 দ্রুত ডেলিভারি —
              ঢাকা ও সারা বাংলাদেশে
            </div>

            <div>
              💵 Cash On Delivery —
              পণ্য হাতে পেয়ে মূল্য
              পরিশোধ
            </div>

            <div>
              📞 অর্ডার কনফার্ম করেই
              পার্সেল পাঠানো হয়
            </div>

            <div>
              ⭐ হাজারো
              অভিভাবকের আস্থার
              Baby Nest
            </div>

            <div>
              🔒 নিরাপদ ও বিশ্বস্ত
              অনলাইন শপিং
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}