"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import { Product } from "@/types/product";
import { districts } from "@/data/districts";
import { useQuickCart } from "@/lib/store/quick-cart";

type OrderFormProps = {
  product: Product;
};

type AvailableCoupon = {
  id: number;
  code: string;
  discountType: "fixed";
  discountValue: number;
  minimumOrderAmount: number;
  expiresAt: string | null;
};

export default function OrderForm({
  product,
}: OrderFormProps) {
  const [deliveryCharge, setDeliveryCharge] =
    useState(product.deliveryInsideDhaka);

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [note, setNote] =
    useState("");

  /*
  ========================================
  COUPON
  ========================================
  */

  const [couponCode, setCouponCode] =
    useState("");

  const [discount, setDiscount] =
    useState(0);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [isApplyingCoupon, setIsApplyingCoupon] =
    useState(false);

  const [availableCoupon, setAvailableCoupon] =
    useState<AvailableCoupon | null>(null);

  const [loadingCoupon, setLoadingCoupon] =
    useState(true);

  /*
  ========================================
  GENERAL
  ========================================
  */

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [orderSuccess, setOrderSuccess] =
    useState(false);

  const [orderId, setOrderId] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [district, setDistrict] =
    useState("");

  const [deliveryArea, setDeliveryArea] =
    useState("dhaka");

  /*
  ========================================
  STOCK
  ========================================
  */

  const [availableStock, setAvailableStock] =
    useState<number>(0);

  const [loadingStock, setLoadingStock] =
    useState(true);

  /*
  ========================================
  QUICK CART
  ========================================
  */

  const {
    addItem,
    isInCart,
  } = useQuickCart();

  const alreadyAdded =
    isInCart(product.id);

  /*
  ========================================
  TOTAL
  ========================================
  */

  const subtotal =
    Number(product.sellingPrice || 0) *
    quantity;

  const total =
    Math.max(
      0,
      subtotal +
        Number(deliveryCharge || 0) -
        Number(discount || 0)
    );

  /*
  ========================================
  STOCK LIMIT
  ========================================
  */

  useEffect(() => {
    if (
      availableStock > 0 &&
      quantity > availableStock
    ) {
      setQuantity(availableStock);

      setDiscount(0);
      setCouponMessage("");
    }
  }, [
    availableStock,
    quantity,
  ]);

  /*
  ========================================
  CLEAR GENERAL ERROR
  ========================================
  */

  useEffect(() => {
    if (
      customerName.trim() ||
      phone.trim() ||
      address.trim()
    ) {
      setErrorMessage("");
    }
  }, [
    customerName,
    phone,
    address,
  ]);

  /*
  ========================================
  LOAD CURRENT STOCK
  ========================================
  */

  useEffect(() => {
    const loadStock = async () => {
      try {
        const response =
          await fetch("/api/products");

        const data =
          await response.json();

        const currentProduct =
          data.products?.find(
            (item: {
              productId: number;
            }) =>
              Number(
                item.productId
              ) === product.id
          );

        if (currentProduct) {
          setAvailableStock(
            Number(
              currentProduct.displayStock
            )
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

  /*
  ========================================
  LOAD PRODUCT COUPON
  ========================================
  */

  useEffect(() => {
    const loadAvailableCoupon =
      async () => {
        setLoadingCoupon(true);

        try {
          const response =
            await fetch(
              `/api/coupon/available?productId=${encodeURIComponent(
                String(product.id)
              )}&subtotal=${encodeURIComponent(
                String(subtotal)
              )}`,
              {
                cache: "no-store",
              }
            );

          if (!response.ok) {
            setAvailableCoupon(null);
            return;
          }

          const result =
            await response.json();

          if (
            result.success &&
            result.coupon
          ) {
            setAvailableCoupon(
              result.coupon
            );
          } else {
            setAvailableCoupon(null);
          }
        } catch (error) {
          console.error(
            "Available coupon error:",
            error
          );

          setAvailableCoupon(null);
        } finally {
          setLoadingCoupon(false);
        }
      };

    loadAvailableCoupon();
  }, [
    product.id,
    subtotal,
  ]);

  /*
  ========================================
  APPLY COUPON
  ========================================
  */

  const applyCoupon = async (
    codeOverride?: string
  ) => {
    if (isApplyingCoupon) {
      return;
    }

    const cleanCouponCode =
      String(
        codeOverride ??
          couponCode
      )
        .trim()
        .toUpperCase();

    /*
    ========================================
    EMPTY COUPON
    ========================================
    */

    if (!cleanCouponCode) {
      setDiscount(0);

      setCouponMessage(
        "❌ কুপন কোড লিখুন"
      );

      return;
    }

    /*
    ========================================
    CURRENT SUBTOTAL
    ========================================
    */

    const currentSubtotal =
      Number(
        product.sellingPrice || 0
      ) *
      Number(quantity || 1);

    /*
    ========================================
    APPLYING STATE
    ========================================
    */

    setIsApplyingCoupon(true);

    setCouponMessage(
      "কুপন যাচাই করা হচ্ছে..."
    );

    try {
      const response =
        await fetch(
          "/api/coupon/validate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              couponCode:
                cleanCouponCode,

              productId:
                String(product.id),

              subtotal:
                currentSubtotal,
            }),
          }
        );

      const result =
        await response.json();

      /*
      ========================================
      INVALID COUPON
      ========================================
      */

      if (
        !response.ok ||
        !result.success
      ) {
        setDiscount(0);

        setCouponMessage(
          `❌ ${
            result.error ||
            "কুপনটি প্রযোজ্য নয়"
          }`
        );

        return;
      }

      /*
      ========================================
      VALID COUPON
      ========================================
      */

      const appliedDiscount =
        Math.min(
          Math.max(
            0,
            Number(
              result.discount || 0
            )
          ),
          currentSubtotal
        );

      setDiscount(
        appliedDiscount
      );

      setCouponCode(
        cleanCouponCode
      );

      setCouponMessage(
        `✅ ৳${appliedDiscount.toLocaleString(
          "en-US"
        )} টাকা ছাড় প্রয়োগ হয়েছে`
      );
    } catch (error) {
      console.error(
        "Coupon validation error:",
        error
      );

      setDiscount(0);

      setCouponMessage(
        "❌ কুপন যাচাই করতে সমস্যা হয়েছে"
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  /*
  ========================================
  APPLY FEATURED COUPON
  ========================================
  */

  const handleApplyFeaturedCoupon =
    async () => {
      if (
        !availableCoupon ||
        isApplyingCoupon ||
        isSubmitting
      ) {
        return;
      }

      const code =
        availableCoupon.code
          .trim()
          .toUpperCase();

      setCouponCode(code);

      await applyCoupon(code);
    };

  /*
  ========================================
  HANDLE ORDER
  ========================================
  */

  const handleOrder = async () => {
    if (isSubmitting) {
      return;
    }

    /*
    ========================================
    STOCK CHECK
    ========================================
    */

    if (
      quantity > availableStock
    ) {
      setErrorMessage(
        `সর্বোচ্চ ${availableStock} টি অর্ডার করা যাবে`
      );

      return;
    }

    /*
    ========================================
    CLEAN INPUT
    ========================================
    */

    const cleanName =
      customerName.trim();

    const cleanPhone =
      phone.trim();

    const cleanAddress =
      address.trim();

    /*
    ========================================
    NAME
    ========================================
    */

    if (!cleanName) {
      setErrorMessage(
        "আপনার নাম লিখুন"
      );

      return;
    }

    /*
    ========================================
    PHONE
    ========================================
    */

    if (!cleanPhone) {
      setErrorMessage(
        "মোবাইল নম্বর লিখুন"
      );

      return;
    }

    if (
      !/^01\d{9}$/.test(
        cleanPhone
      )
    ) {
      setErrorMessage(
        "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন"
      );

      return;
    }

    /*
    ========================================
    ADDRESS
    ========================================
    */

    if (!cleanAddress) {
      setErrorMessage(
        "সম্পূর্ণ ঠিকানা লিখুন"
      );

      return;
    }

    /*
    ========================================
    DISTRICT
    ========================================
    */

    if (!district) {
      setErrorMessage(
        "জেলা নির্বাচন করুন"
      );

      return;
    }

    /*
    ========================================
    SUBMIT
    ========================================
    */

    setErrorMessage("");
    setIsSubmitting(true);

    /*
    ========================================
    FACEBOOK INITIATE CHECKOUT
    ========================================
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
          content_ids: [
            String(
              product.id
            ),
          ],

          content_name:
            product.name,

          content_type:
            "product",

          currency: "BDT",

          value: total,

          num_items:
            quantity,
        }
      );
    }

    /*
    ========================================
    ORDER DATA
    ========================================
    */

    const orderData = {
      productId:
        product.id,

      productName:
        product.name,

      quantity,

      productSlug:
        product.slug,

      customerName:
        cleanName,

      phone:
        cleanPhone,

      address:
        cleanAddress,

      district,

      note,

      deliveryArea,

      deliveryCharge,

      discount,

      total,

      couponCode:
        couponCode
          .trim()
          .toUpperCase(),

      orderDate:
        new Date().toISOString(),
    };

    try {
      const response =
        await fetch(
          "/api/order",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                orderData
              ),
          }
        );

      const result =
        await response.json();

      console.log(result);

      /*
      ========================================
      SUCCESS
      ========================================
      */

      if (result.success) {
        /*
        ====================================
        FACEBOOK PURCHASE
        ====================================
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
              content_ids: [
                String(
                  product.id
                ),
              ],

              content_name:
                product.name,

              content_type:
                "product",

              currency: "BDT",

              value: total,

              num_items:
                quantity,
            },
            {
              eventID:
                result.orderId,
            }
          );
        }

        /*
        ====================================
        UPDATE LOCAL STOCK
        ====================================
        */

        setAvailableStock(
          (prev) =>
            Math.max(
              0,
              prev - quantity
            )
        );

        /*
        ====================================
        ORDER SUCCESS
        ====================================
        */

        setOrderId(
          result.orderId || ""
        );

        setOrderSuccess(true);

        /*
        ====================================
        RESET FORM
        ====================================
        */

        setCustomerName("");
        setPhone("");
        setAddress("");

        setCouponCode("");
        setDiscount(0);
        setCouponMessage("");

        setErrorMessage("");
      } else {
        alert(
          result.error ||
            "অর্ডার জমা হয়নি"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "সার্ভারে সমস্যা হয়েছে"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
  ========================================
  ORDER SUCCESS SCREEN
  ========================================
  */

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

  /*
  ========================================
  FORM
  ========================================
  */

  return (
    <div className="space-y-3.5">

      <h2 className="text-xl font-bold text-gray-900">
        অর্ডার করুন
      </h2>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Quantity */}

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">

        <label className="mb-2 block text-xs font-medium text-gray-700">
          পরিমাণ (Quantity)
        </label>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => {
              setQuantity(
                (prev) =>
                  Math.max(
                    1,
                    prev - 1
                  )
              );

              setDiscount(0);
              setCouponMessage("");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm transition hover:bg-gray-100"
          >
            -
          </button>

          <div className="min-w-[50px] text-center text-sm font-bold">
            {quantity}
          </div>

          <button
            type="button"
            onClick={() => {
              const nextQuantity =
                Math.min(
                  availableStock ||
                    1,
                  quantity + 1
                );

              setQuantity(
                nextQuantity
              );

              setDiscount(0);
              setCouponMessage("");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm transition hover:bg-gray-100"
          >
            +
          </button>

        </div>
      </div>

      {/* Customer Name */}

      <input
        type="text"
        value={customerName}
        onChange={(e) =>
          setCustomerName(
            e.target.value
          )
        }
        placeholder="আপনার নাম"
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      />

      {/* Phone */}

      <input
        type="tel"
        value={phone}
        onChange={(e) =>
          setPhone(
            e.target.value
          )
        }
        placeholder="মোবাইল নম্বর"
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      />

      {/* District */}

      <select
        value={district}
        onChange={(e) =>
          setDistrict(
            e.target.value
          )
        }
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      >
        <option value="">
          জেলা নির্বাচন করুন
        </option>

        {districts.map(
          (districtName) => (
            <option
              key={districtName}
              value={districtName}
            >
              {districtName}
            </option>
          )
        )}
      </select>

      {/* Address */}

      <textarea
        value={address}
        onChange={(e) =>
          setAddress(
            e.target.value
          )
        }
        placeholder="বাড়ি/ফ্ল্যাট নম্বর, বিল্ডিং, রোড, গ্রাম, এলাকা, উপজেলা ইত্যাদি লিখুন"
        rows={3}
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      />

      {/* Note */}

      <textarea
        value={note}
        onChange={(e) =>
          setNote(
            e.target.value
          )
        }
        placeholder="বিশেষ নির্দেশনা (ঐচ্ছিক)"
        rows={2}
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      />

      {/* Delivery Area */}

      <select
        value={deliveryArea}
        onChange={(e) => {
          const area =
            e.target.value;

          setDeliveryArea(area);

          if (
            area === "dhaka"
          ) {
            setDeliveryCharge(
              product.deliveryInsideDhaka
            );
          } else {
            setDeliveryCharge(
              product.deliveryOutsideDhaka
            );
          }
        }}
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      >
        <option value="dhaka">
          ঢাকার ভিতরে
        </option>

        <option value="outside">
          ঢাকার বাইরে
        </option>
      </select>

      {/* ========================================
          COMPACT FEATURED COUPON
          ======================================== */}

      {!loadingCoupon &&
        availableCoupon && (
          <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">

            {/* Coupon Header */}

            <div className="flex items-center gap-2 bg-emerald-50/70 px-3 py-2">

              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm">
                🎟️
              </span>

              <span className="text-xs font-bold text-gray-900 sm:text-sm">
                বিশেষ কুপন অফার
              </span>

            </div>

            {/* Coupon Content */}

            <div className="flex items-center justify-between gap-3 px-3 py-2.5">

              <div className="min-w-0">

                <div className="flex items-center gap-1.5">

                  <span className="truncate text-sm font-bold tracking-wide text-gray-900 sm:text-base">
                    {availableCoupon.code}
                  </span>

                  <span className="shrink-0 text-xs text-gray-400">
                    কুপন
                  </span>

                </div>

                <p className="mt-0.5 text-xs font-medium text-emerald-600">
                  ৳
                  {Number(
                    availableCoupon.discountValue
                  ).toLocaleString(
                    "en-US"
                  )}{" "}
                  টাকা ছাড়
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleApplyFeaturedCoupon
                }
                disabled={
                  isApplyingCoupon ||
                  isSubmitting
                }
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm ${
                  discount > 0 &&
                  couponCode
                    .trim()
                    .toUpperCase() ===
                    availableCoupon.code
                      .trim()
                      .toUpperCase()
                    ? "bg-emerald-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isApplyingCoupon
                  ? "Applying..."
                  : discount > 0 &&
                    couponCode
                      .trim()
                      .toUpperCase() ===
                      availableCoupon.code
                        .trim()
                        .toUpperCase()
                  ? "Applied ✓"
                  : "Apply Now"}
              </button>

            </div>

          </div>
        )}

      {/* Coupon Input */}

      <div className="flex gap-2">

        <input
          type="text"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(
              e.target.value
            );

            if (
              discount > 0
            ) {
              setDiscount(0);
              setCouponMessage("");
            }
          }}
          placeholder="কুপন কোড"
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
        />

        <button
          type="button"
          onClick={() =>
            applyCoupon()
          }
          disabled={
            isApplyingCoupon ||
            isSubmitting
          }
          className="shrink-0 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isApplyingCoupon
            ? "Checking..."
            : "Apply"}
        </button>

      </div>

      {/* Coupon Message */}

      {couponMessage && (
        <div
          className={`-mt-1 px-1 text-xs font-medium ${
            couponMessage.startsWith(
              "✅"
            )
              ? "text-green-600"
              : couponMessage.startsWith(
                  "কুপন যাচাই"
                )
              ? "text-gray-500"
              : "text-red-600"
          }`}
        >
          {couponMessage}
        </div>
      )}

      {/* Order Summary */}

      <div className="space-y-2 rounded-xl border border-gray-300 px-3.5 py-3.5">

        <div className="flex items-center justify-between text-sm">
          <span>
            পণ্যের মূল্য
          </span>

          <span>
            ৳{" "}
            {subtotal.toLocaleString(
              "en-US"
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span>
            ডেলিভারি চার্জ
          </span>

          <span>
            ৳{" "}
            {Number(
              deliveryCharge || 0
            ).toLocaleString(
              "en-US"
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-sm text-green-600">
            <span>
              ডিসকাউন্ট
            </span>

            <span>
              - ৳{" "}
              {discount.toLocaleString(
                "en-US"
              )}
            </span>
          </div>
        )}

        <div className="my-1 border-t border-gray-200" />

        <div className="flex items-center justify-between text-lg font-bold">
          <span>
            মোট
          </span>

          <span>
            ৳{" "}
            {total.toLocaleString(
              "en-US"
            )}
          </span>
        </div>

      </div>

      {/* Order Button */}

      <Button
        type="button"
        onClick={
          handleOrder
        }
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