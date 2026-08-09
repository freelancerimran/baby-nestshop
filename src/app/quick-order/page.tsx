"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { districts } from "@/data/districts";
import { coupons } from "@/data/coupons";
import { useQuickCart } from "@/lib/store/quick-cart";

export default function QuickOrderPage() {
  const {
    items,
    totalItems,
    subtotal,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useQuickCart();

  const router = useRouter();

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [note, setNote] =
    useState("");

  const [district, setDistrict] =
    useState("");

  const [deliveryArea, setDeliveryArea] =
    useState("dhaka");

  const [deliveryCharge, setDeliveryCharge] =
    useState(0);

  const [couponCode, setCouponCode] =
    useState("");

  const [discount, setDiscount] =
    useState(0);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
  ============================================================
  GRAND TOTAL
  ============================================================
  */

  const grandTotal =
    subtotal +
    deliveryCharge -
    discount;

  /*
  ============================================================
  DELIVERY CHARGE
  ============================================================
  */

  useEffect(() => {
    if (items.length === 0) {
      setDeliveryCharge(0);
      return;
    }

    const highestCharge = Math.max(
      ...items.map((item) =>
        deliveryArea === "dhaka"
          ? Number(
              item.deliveryInsideDhaka || 0
            )
          : Number(
              item.deliveryOutsideDhaka || 0
            )
      )
    );

    setDeliveryCharge(
      highestCharge
    );
  }, [
    items,
    deliveryArea,
  ]);

  /*
  ============================================================
  APPLY COUPON
  ============================================================
  */

  const applyCoupon = () => {
    const coupon =
      coupons.find(
        (item) =>
          item.code
            .trim()
            .toLowerCase() ===
          couponCode
            .trim()
            .toLowerCase()
      );

    if (!coupon) {
      setDiscount(0);

      setCouponMessage(
        "❌ কুপন কোড সঠিক নয়"
      );

      return;
    }

    if (
      coupon.status !==
      "active"
    ) {
      setDiscount(0);

      setCouponMessage(
        "❌ কুপনটি সক্রিয় নয়"
      );

      return;
    }

    setDiscount(
      coupon.discount
    );

    setCouponMessage(
      `✅ ৳${coupon.discount} টাকা ছাড় প্রয়োগ হয়েছে`
    );
  };

  /*
  ============================================================
  FORM VALIDATION
  ============================================================
  */

  const validateForm = () => {
    if (
      !customerName.trim()
    ) {
      setErrorMessage(
        "আপনার নাম লিখুন"
      );

      return false;
    }

    if (
      !/^01\d{9}$/.test(
        phone.trim()
      )
    ) {
      setErrorMessage(
        "সঠিক মোবাইল নম্বর লিখুন"
      );

      return false;
    }

    if (!district) {
      setErrorMessage(
        "জেলা নির্বাচন করুন"
      );

      return false;
    }

    if (
      !address.trim()
    ) {
      setErrorMessage(
        "সম্পূর্ণ ঠিকানা লিখুন"
      );

      return false;
    }

    setErrorMessage("");

    return true;
  };

  /*
  ============================================================
  COMPLETE ORDER
  ============================================================
  */

  const handleCompleteOrder =
    async () => {
      if (!validateForm()) {
        return;
      }

      if (isSubmitting) {
        return;
      }

      if (items.length === 0) {
        setErrorMessage(
          "আপনার কার্ট খালি"
        );

        return;
      }

      try {
        setIsSubmitting(true);

        /*
        ======================================================
        FACEBOOK — INITIATE CHECKOUT
        ======================================================

        This is the browser-side event.

        It fires BEFORE the order API request,
        matching the existing Single Product flow.
        ======================================================
        */

        if (
          typeof window !==
            "undefined" &&
          window.fbq
        ) {
          window.fbq(
            "track",
            "InitiateCheckout",
            {
              content_ids:
                items.map(
                  (item) =>
                    String(
                      item.productId
                    )
                ),

              content_name:
                items
                  .map(
                    (item) =>
                      item.productName
                  )
                  .join(", "),

              content_type:
                "product",

              currency:
                "BDT",

              value:
                grandTotal,

              num_items:
                totalItems,
            }
          );
        }

        /*
        ======================================================
        SEND CART TO API
        ======================================================
        */

        const response =
          await fetch(
            "/api/quick-order",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                customerName,
                phone,
                district,
                address,
                note,

                deliveryArea,
                deliveryCharge,

                couponCode,
                discount,

                subtotal,

                total:
                  grandTotal,

                items,
              }),
            }
          );

        const result =
          await response.json();

        /*
        ======================================================
        API ERROR
        ======================================================
        */

        if (
          !response.ok ||
          !result.success
        ) {
          alert(
            result.message ||
              "Order Failed"
          );

          return;
        }

        /*
        ======================================================
        GET ORDER ID
        ======================================================

        Quick Order API returns:

        result.orderId
        ======================================================
        */

        const orderId =
          String(
            result.orderId ||
              ""
          ).trim();

        /*
        ======================================================
        ORDER ID VALIDATION
        ======================================================
        */

        if (!orderId) {
          console.error(
            "ORDER ID MISSING:",
            result
          );

          alert(
            "Order created but Order ID was not returned."
          );

          return;
        }

        /*
        ======================================================
        FACEBOOK — PURCHASE
        ======================================================

        IMPORTANT:

        Browser:

        eventID = orderId

        Server:

        event_id = same orderId

        This allows Meta to deduplicate
        Browser + Server Purchase events.
        ======================================================
        */

        if (
          typeof window !==
            "undefined" &&
          window.fbq
        ) {
          window.fbq(
            "track",
            "Purchase",
            {
              content_ids:
                items.map(
                  (item) =>
                    String(
                      item.productId
                    )
                ),

              content_name:
                items
                  .map(
                    (item) =>
                      item.productName
                  )
                  .join(", "),

              content_type:
                "product",

              currency:
                "BDT",

              value:
                grandTotal,

              num_items:
                totalItems,
            },
            {
              eventID:
                orderId,
            }
          );
        }

        /*
        ======================================================
        CLEAR CART
        ======================================================
        */

        clearCart();

        /*
        ======================================================
        REDIRECT
        ======================================================
        */

        router.replace(
          `/order-success?order=${encodeURIComponent(
            orderId
          )}`
        );
      } catch (error) {
        console.error(
          "QUICK ORDER ERROR:",
          error
        );

        alert(
          "Server Error"
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /*
  ============================================================
  EMPTY CART
  ============================================================
  */

  if (
    items.length === 0
  ) {
    return (
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-3xl px-5">

          <div className="rounded-3xl bg-white p-10 text-center shadow-lg">

            <div className="mb-5 text-6xl">
              🛒
            </div>

            <h1 className="text-4xl font-bold">
              আপনার কার্ট খালি
            </h1>

            <p className="mt-4 text-lg text-gray-500">
              আগে কিছু প্রোডাক্ট Add করুন।
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
            >
              Shop Now
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
  */

  return (
    <main className="min-h-screen bg-gray-50 py-10">

      <div className="mx-auto max-w-6xl px-5">

        <h1 className="mb-8 text-4xl font-bold">
          Quick Order
        </h1>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">

          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div className="space-y-5">

            {items.map(
              (item) => (
                <div
                  key={
                    item.productId
                  }
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >

                  <div className="flex items-center gap-5">

                    <img
                      src={
                        item.image
                      }
                      alt={
                        item.productName
                      }
                      className="h-24 w-24 rounded-xl object-cover"
                    />

                    <div className="flex-1">

                      <h2 className="text-xl font-bold">
                        {
                          item.productName
                        }
                      </h2>

                      <p className="mt-2 text-lg font-semibold text-teal-700">
                        ৳{" "}
                        {
                          item.unitPrice
                        }
                      </p>

                      {/* Quantity */}

                      <div className="mt-5 flex items-center gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              item.productId
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border transition hover:bg-gray-100"
                        >
                          −
                        </button>

                        <div className="min-w-[40px] text-center text-lg font-bold">
                          {
                            item.quantity
                          }
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(
                              item.productId
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border transition hover:bg-gray-100"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              item.productId
                            )
                          }
                          className="ml-5 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Remove
                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="sticky top-24 rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-3xl font-bold">
              Order Summary
            </h2>

            <div className="space-y-4">

              <div className="flex items-center justify-between">

                <span>
                  Total Products
                </span>

                <span className="font-bold">
                  {
                    totalItems
                  }
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span>
                  Subtotal
                </span>

                <span className="font-bold">
                  ৳{" "}
                  {
                    subtotal
                  }
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span>
                  Delivery
                </span>

                <span>
                  Next Step
                </span>

              </div>

              <hr />

              <div className="flex items-center justify-between text-2xl font-bold">

                <span>
                  Total
                </span>

                <span>
                  ৳{" "}
                  {
                    subtotal
                  }
                </span>

              </div>

            </div>

            <hr className="my-6" />

            {/* ==================================================
                CUSTOMER FORM
            ================================================== */}

            <div className="space-y-4">

              <h3 className="text-xl font-bold">
                Customer Information
              </h3>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                  {
                    errorMessage
                  }
                </div>
              )}

              <input
                type="text"
                value={
                  customerName
                }
                onChange={(
                  e
                ) =>
                  setCustomerName(
                    e.target
                      .value
                  )
                }
                placeholder="আপনার নাম"
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                type="tel"
                value={
                  phone
                }
                onChange={(
                  e
                ) =>
                  setPhone(
                    e.target
                      .value
                  )
                }
                placeholder="মোবাইল নম্বর"
                className="w-full rounded-xl border px-4 py-3"
              />

              <select
                value={
                  district
                }
                onChange={(
                  e
                ) =>
                  setDistrict(
                    e.target
                      .value
                  )
                }
                className="w-full rounded-xl border px-4 py-3"
              >

                <option value="">
                  জেলা নির্বাচন করুন
                </option>

                {districts.map(
                  (
                    districtName
                  ) => (
                    <option
                      key={
                        districtName
                      }
                      value={
                        districtName
                      }
                    >
                      {
                        districtName
                      }
                    </option>
                  )
                )}

              </select>

              <textarea
                rows={3}
                value={
                  address
                }
                onChange={(
                  e
                ) =>
                  setAddress(
                    e.target
                      .value
                  )
                }
                placeholder="সম্পূর্ণ ঠিকানা"
                className="w-full rounded-xl border px-4 py-3"
              />

              <textarea
                rows={2}
                value={
                  note
                }
                onChange={(
                  e
                ) =>
                  setNote(
                    e.target
                      .value
                  )
                }
                placeholder="বিশেষ নির্দেশনা (ঐচ্ছিক)"
                className="w-full rounded-xl border px-4 py-3"
              />

            </div>

            <hr className="my-6" />

            {/* ==================================================
                DELIVERY
            ================================================== */}

            <div className="space-y-4">

              <select
                value={
                  deliveryArea
                }
                onChange={(
                  e
                ) =>
                  setDeliveryArea(
                    e.target
                      .value
                  )
                }
                className="w-full rounded-xl border px-4 py-3"
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
                  value={
                    couponCode
                  }
                  onChange={(
                    e
                  ) =>
                    setCouponCode(
                      e.target
                        .value
                    )
                  }
                  placeholder="Coupon Code"
                  className="flex-1 rounded-xl border px-4 py-3"
                />

                <button
                  type="button"
                  onClick={
                    applyCoupon
                  }
                  className="rounded-xl bg-teal-600 px-5 text-white"
                >
                  Apply
                </button>

              </div>

              {couponMessage && (
                <p className="text-sm text-green-600">
                  {
                    couponMessage
                  }
                </p>
              )}

            </div>

            <hr className="my-6" />

            {/* ==================================================
                TOTAL
            ================================================== */}

            <div className="space-y-3">

              <div className="flex justify-between">

                <span>
                  Subtotal
                </span>

                <span>
                  ৳{" "}
                  {
                    subtotal
                  }
                </span>

              </div>

              <div className="flex justify-between">

                <span>
                  Delivery
                </span>

                <span>
                  ৳{" "}
                  {
                    deliveryCharge
                  }
                </span>

              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">

                  <span>
                    Discount
                  </span>

                  <span>
                    - ৳{" "}
                    {
                      discount
                    }
                  </span>

                </div>
              )}

              <hr />

              <div className="flex justify-between text-2xl font-bold">

                <span>
                  Grand Total
                </span>

                <span>
                  ৳{" "}
                  {
                    grandTotal
                  }
                </span>

              </div>

            </div>

            {/* ==================================================
                COMPLETE ORDER
            ================================================== */}

            <button
              type="button"
              onClick={
                handleCompleteOrder
              }
              disabled={
                isSubmitting
              }
              className="mt-8 w-full rounded-xl bg-teal-600 py-4 text-lg font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting
                ? "অর্ডার পাঠানো হচ্ছে..."
                : "Complete Order"}
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}