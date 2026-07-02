'use client';

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Product } from "@/types/product";
import { coupons } from "@/data/coupons";

type OrderFormProps = {
  product: Product;
};

export default function OrderForm({
  product,
}: OrderFormProps) {
  const [deliveryCharge, setDeliveryCharge] = useState(
    product.deliveryInsideDhaka
  );

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [availableStock, setAvailableStock] = useState<number>(0);
  const [loadingStock, setLoadingStock] = useState(true);
  
  useEffect(() => {
  if (
    availableStock > 0 &&
    quantity > availableStock
  ) {
    setQuantity(availableStock);
  }
}, [availableStock, quantity]); 

  const total =
  product.sellingPrice * quantity +
  deliveryCharge -
  discount;

  useEffect(() => {
    if (
      customerName.trim() ||
      phone.trim() ||
      address.trim()
    ) {
      setErrorMessage("");
    }
  }, [customerName, phone, address]);

  useEffect(() => {
  const loadStock = async () => {
    try {
      const response = await fetch("/api/products");

      const data = await response.json();

      const currentProduct = data.products?.find(
        (item: { productId: number }) =>
          Number(item.productId) === product.id
      );

      if (currentProduct) {
        setAvailableStock(
          Number(currentProduct.displayStock)
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStock(false);
    }
  };

  loadStock();
}, [product.id]);

  const handleOrder = async () => {
  if (isSubmitting) return;

  if (quantity > availableStock) {
    setErrorMessage(
      `সর্বোচ্চ ${availableStock} টি অর্ডার করা যাবে`
    );
    return;
  }


    const cleanName = customerName.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    if (!cleanName) {
      setErrorMessage("আপনার নাম লিখুন");
      return;
    }

    if (!cleanPhone) {
      setErrorMessage("মোবাইল নম্বর লিখুন");
      return;
    }

    if (!/^01\d{9}$/.test(cleanPhone)) {
      setErrorMessage(
        "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন"
      );
      return;
    }

    if (!cleanAddress) {
      setErrorMessage("সম্পূর্ণ ঠিকানা লিখুন");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    const orderData = {
      productId: product.id,
      productName: product.name,
      quantity,
      productSlug: product.slug,

      customerName: cleanName,
      phone: cleanPhone,
      address: cleanAddress,

      deliveryCharge,
      discount,
      total,

      couponCode,

      orderDate: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      console.log(result);

      if (result.success) {

 setAvailableStock((prev) =>
  Math.max(0, prev - quantity)
);
        setOrderId(result.orderId || "");
        setOrderSuccess(true);

        setCustomerName("");
        setPhone("");
        setAddress("");
        setCouponCode("");
        setDiscount(0);
        setCouponMessage("");
        setErrorMessage("");
      } else {
        alert("অর্ডার জমা হয়নি");
      }
    } catch (error) {
      console.error(error);
      alert("সার্ভারে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyCoupon = () => {
    const coupon = coupons.find(
      (item) =>
        item.code.toLowerCase() ===
        couponCode.trim().toLowerCase()
    );

    if (!coupon) {
      setDiscount(0);
      setCouponMessage("❌ কুপন কোড সঠিক নয়");
      return;
    }

    if (coupon.status !== "active") {
      setDiscount(0);
      setCouponMessage("❌ কুপনটি সক্রিয় নয়");
      return;
    }

    if (coupon.appliesTo === "all") {
      setDiscount(coupon.discount);
      setCouponMessage(
        `✅ ৳${coupon.discount} টাকা ছাড় প্রয়োগ হয়েছে`
      );
      return;
    }

    if (
      Array.isArray(coupon.appliesTo) &&
      coupon.appliesTo.includes(product.slug)
    ) {
      setDiscount(coupon.discount);
      setCouponMessage(
        `✅ ৳${coupon.discount} টাকা ছাড় প্রয়োগ হয়েছে`
      );
      return;
    }

    setDiscount(0);
    setCouponMessage(
      "❌ এই কুপনটি এই পণ্যের জন্য প্রযোজ্য নয়"
    );
  };

  if (orderSuccess) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
        <div className="text-6xl">✅</div>

        <h2 className="text-2xl font-bold text-green-700">
          অর্ডার সফল হয়েছে
        </h2>

        <p className="text-gray-700">
          ধন্যবাদ।
          <br />
          আমাদের প্রতিনিধি খুব শীঘ্রই আপনার সাথে যোগাযোগ করবে।
        </p>

        {orderId && (
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm font-medium text-gray-700">
              Order ID
            </p>

            <p className="text-lg font-bold text-black break-all">
              {orderId}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-green-600 px-6 py-3 text-white hover:bg-green-700"
        >
          আরও পণ্য দেখুন
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">
        অর্ডার করুন
      </h2>

      {errorMessage && (
        <div className="rounded-xl bg-red-100 border border-red-300 p-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <input
        type="text"
        value={customerName}
        onChange={(e) =>
          setCustomerName(e.target.value)
        }
        placeholder="আপনার নাম"
        className="w-full rounded-xl border p-3"
      />

      <input
        type="tel"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value)
        }
        placeholder="মোবাইল নম্বর"
        className="w-full rounded-xl border p-3"
      />

      <textarea
        value={address}
        onChange={(e) =>
          setAddress(e.target.value)
        }
        placeholder="সম্পূর্ণ ঠিকানা"
        rows={4}
        className="w-full rounded-xl border p-3"
      />

      <select
        className="w-full rounded-xl border p-3"
        defaultValue="dhaka"
        onChange={(e) => {
          if (e.target.value === "dhaka") {
            setDeliveryCharge(
              product.deliveryInsideDhaka
            );
          } else {
            setDeliveryCharge(
              product.deliveryOutsideDhaka
            );
          }
        }}
      >
        <option value="dhaka">
          ঢাকার ভিতরে
        </option>

        <option value="outside">
          ঢাকার বাইরে
        </option>
      </select>

      <div className="space-y-2">
        <label className="font-medium">
          কুপন কোড
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) =>
              setCouponCode(e.target.value)
            }
            placeholder="কুপন কোড লিখুন"
            className="w-full rounded-xl border p-3"
          />

          <button
            type="button"
            onClick={applyCoupon}
            className="rounded-xl bg-black px-4 text-white"
          >
            Apply
          </button>
        </div>

        {couponMessage && (
          <p
            className={`text-sm ${
              couponMessage.startsWith("✅")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {couponMessage}
          </p>
        )}
      </div>
{loadingStock ? (
  <div className="rounded-xl bg-gray-100 p-3 text-gray-500">
    স্টক লোড হচ্ছে...
  </div>
) : (
  <div
    className={`rounded-xl p-3 font-semibold ${
      availableStock <= 5
        ? "bg-red-100 text-red-700"
        : "bg-green-100 text-green-700"
    }`}
  >
    {availableStock <= 0
      ? "❌ স্টক শেষ"
      : availableStock <= 5
      ? `🚨 শেষ ${availableStock} টি পণ্য বাকি`
      : `🔥 মাত্র ${availableStock} টি বাকি`}
  </div>
)}
      <div className="space-y-2">
  <label className="font-medium">
    পরিমাণ (Quantity)
  </label>

  <div className="flex items-center gap-3">

    <button
      type="button"
      onClick={() =>
        setQuantity((prev) => Math.max(1, prev - 1))
      }
      className="h-10 w-10 rounded-lg border text-lg font-bold"
    >
      -
    </button>

    <div className="min-w-[60px] text-center text-lg font-bold">
      {quantity}
    </div>

    <button
      type="button"
      onClick={() =>
  setQuantity((prev) =>
    Math.min(
      availableStock || 1,
      prev + 1
    )
  )
}

      className="h-10 w-10 rounded-lg border text-lg font-bold"
    >
      +
    </button>

  </div>
</div>   

      <div className="rounded-xl bg-gray-100 p-4 space-y-2">
       <div className="flex justify-between">
  <span>
    পণ্যের মূল্য ({quantity} টি)
  </span>

  <span>
    ৳ {product.sellingPrice * quantity}
  </span>
</div>

        <div className="flex justify-between">
          <span>ডেলিভারি চার্জ</span>
          <span>৳ {deliveryCharge}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>কুপন ডিসকাউন্ট</span>
            <span>- ৳ {discount}</span>
          </div>
        )}

        <hr />

        <div className="flex justify-between font-bold text-lg">
          <span>মোট</span>
          <span>৳ {total}</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleOrder}
disabled={
  loadingStock ||
  isSubmitting ||
  availableStock <= 0
}
      >
        {loadingStock
  ? "স্টক যাচাই হচ্ছে..."
  : availableStock <= 0
  ? "❌ স্টক শেষ"
  : isSubmitting
  ? "অর্ডার পাঠানো হচ্ছে..."
  : "🛒 অর্ডার করুন"}
      </Button>
    </div>
  );
}