'use client';

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Product } from "@/types/product";

type OrderFormProps = {
  product: Product;
};

export default function OrderForm({
  product,
}: OrderFormProps) {
  const [deliveryCharge, setDeliveryCharge] = useState(
  product.deliveryInsideDhaka
);

const total = product.sellingPrice + deliveryCharge;
    return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">
        অর্ডার করুন
      </h2>

      <input
        type="text"
        placeholder="আপনার নাম"
        className="w-full rounded-xl border p-3"
      />

      <input
        type="tel"
        placeholder="মোবাইল নম্বর"
        className="w-full rounded-xl border p-3"
      />

      <textarea
        placeholder="সম্পূর্ণ ঠিকানা"
        rows={4}
        className="w-full rounded-xl border p-3"
      />

     <select
  className="w-full rounded-xl border p-3"
  defaultValue="dhaka"
  onChange={(e) => {
    if (e.target.value === "dhaka") {
      setDeliveryCharge(product.deliveryInsideDhaka);
    } else {
      setDeliveryCharge(product.deliveryOutsideDhaka);
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

      <input
        type="text"
        placeholder="কুপন কোড (যদি থাকে)"
        className="w-full rounded-xl border p-3"
      />

      <div className="rounded-xl bg-gray-100 p-4 space-y-2">
        <div className="flex justify-between">
          <span>পণ্যের মূল্য</span>
          <span>৳ {product.sellingPrice}</span>
        </div>

        <div className="flex justify-between">
          <span>ডেলিভারি চার্জ</span>
          <span>৳ {deliveryCharge}</span>
        </div>

        <hr />

        <div className="flex justify-between font-bold text-lg">
          <span>মোট</span>
          <span>৳ {total}</span>
        </div>
      </div>

      <Button>
        🛒 অর্ডার করুন
      </Button>
    </div>
  );
}