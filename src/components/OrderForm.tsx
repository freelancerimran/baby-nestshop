'use client';

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Product } from "@/types/product";
import { coupons } from "@/data/coupons";
import { districts } from "@/data/districts";

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
  const [note, setNote] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [quantity, setQuantity] = useState(1);
 const [district, setDistrict] = useState("");
const [deliveryArea, setDeliveryArea] = useState("dhaka");

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
    
    if (!district) {
  setErrorMessage("জেলা নির্বাচন করুন");
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

      district,
      note,
      deliveryArea,

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
    <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
      <h3 className="text-2xl font-bold text-green-700">
        🎉 অর্ডার সফল হয়েছে
      </h3>

      <p className="mt-2 text-gray-700">
        আপনার অর্ডার গ্রহণ করা হয়েছে।
      </p>

      {orderId && (
        <p className="mt-2 font-semibold text-gray-900">
          Order ID: {orderId}
        </p>
      )}
    </div>
  );
}

return (
  <div className="space-y-4">

    <h2 className="text-xl font-bold text-gray-900">
      অর্ডার করুন
    </h2>

    {errorMessage && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
        {errorMessage}
      </div>
    )}

    {/* Quantity */}
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

      <label className="mb-2 block text-sm font-medium text-gray-700">
        পরিমাণ (Quantity)
      </label>

      <div className="flex items-center gap-3">

        <button
          type="button"
          onClick={() =>
            setQuantity((prev) => Math.max(1, prev - 1))
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
        >
          -
        </button>

        <div className="min-w-[70px] text-center font-bold">
          {quantity}
        </div>

        <button
          type="button"
          onClick={() =>
            setQuantity((prev) =>
              Math.min(availableStock || 1, prev + 1)
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
        >
          +
        </button>

      </div>
    </div>

    <input
      type="text"
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value)}
      placeholder="আপনার নাম"
      className="w-full rounded-xl border px-3 py-2"
    />

    <input
      type="tel"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      placeholder="মোবাইল নম্বর"
      className="w-full rounded-xl border px-3 py-2"
    />
    <select
  value={district}
  onChange={(e) =>
    setDistrict(e.target.value)
  }
  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
>
  <option value="">
    জেলা নির্বাচন করুন
  </option>

  {districts.map((districtName) => (
    <option
      key={districtName}
      value={districtName}
    >
      {districtName}
    </option>
  ))}
</select>
    <textarea
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="বাড়ি/ফ্ল্যাট নম্বর, বিল্ডিং, রোড, গ্রাম, এলাকা, উপজেলা ইত্যাদি লিখুন"
      rows={3}
      className="w-full rounded-xl border px-3 py-2"
    />

    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="বিশেষ নির্দেশনা (ঐচ্ছিক)"
      rows={2}
      className="w-full rounded-xl border px-3 py-2"
    />

    <select
  value={deliveryArea}
  onChange={(e) => {
    setDeliveryArea(e.target.value);

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
      className="w-full rounded-xl border px-3 py-2"
    >
      <option value="dhaka">
        ঢাকার ভিতরে
      </option>

      <option value="outside">
        ঢাকার বাইরে
      </option>
    </select>

    <div className="flex gap-2">

      <input
        type="text"
        value={couponCode}
        onChange={(e) =>
          setCouponCode(e.target.value)
        }
        placeholder="কুপন কোড"
        className="w-full rounded-xl border px-3 py-2"
      />

      <button
        type="button"
        onClick={applyCoupon}
        className="rounded-xl bg-teal-700 px-4 text-white"
      >
        Apply
      </button>

    </div>

    {couponMessage && (
      <p className="text-sm">
        {couponMessage}
      </p>
    )}

    <div className="rounded-2xl border p-4 space-y-2">

      <div className="flex justify-between">
        <span>পণ্যের মূল্য</span>
        <span>
          ৳ {product.sellingPrice * quantity}
        </span>
      </div>

      <div className="flex justify-between">
        <span>ডেলিভারি চার্জ</span>
        <span>
          ৳ {deliveryCharge}
        </span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>ডিসকাউন্ট</span>
          <span>- ৳ {discount}</span>
        </div>
      )}

      <hr />

      <div className="flex justify-between text-xl font-bold">
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
        ? "স্টক শেষ"
        : isSubmitting
        ? "অর্ডার পাঠানো হচ্ছে..."
        : "অর্ডার করুন"}
    </Button>

  </div>
);
}
