'use client';

import { useState } from "react";
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

  const total =
    product.sellingPrice +
    deliveryCharge -
    discount;

const handleOrder = async () => {
  const orderData = {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,

    customerName,
    phone,
    address,

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
      alert("অর্ডার সফল হয়েছে!");

      setCustomerName("");
      setPhone("");
      setAddress("");
      setCouponCode("");
      setDiscount(0);
      setCouponMessage("");
    } else {
      alert("অর্ডার জমা হয়নি");
    }
  } catch (error) {
    console.error(error);
    alert("সার্ভারে সমস্যা হয়েছে");
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

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">
        অর্ডার করুন
      </h2>

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

      <div className="rounded-xl bg-gray-100 p-4 space-y-2">
        <div className="flex justify-between">
          <span>পণ্যের মূল্য</span>
          <span>৳ {product.sellingPrice}</span>
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
      >
        🛒 অর্ডার করুন
      </Button>
    </div>
  );
}