"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { districts } from "@/data/districts";
import { useQuickCart } from "@/lib/store/quick-cart";

type AvailableCoupon = {
  id: number;
  code: string;
  discountType: "fixed";
  discountValue: number;
  minimumOrderAmount: number;
  expiresAt: string | null;
  productId: string;
  productName: string;
};

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

  /*
  ============================================================
  CUSTOMER INFORMATION
  ============================================================
  */

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [district, setDistrict] =
    useState("");

  const [deliveryArea, setDeliveryArea] =
    useState("dhaka");

  const [deliveryCharge, setDeliveryCharge] =
    useState(0);

  /*
  ============================================================
  COUPON
  ============================================================
  */

  const [availableCoupons, setAvailableCoupons] =
    useState<AvailableCoupon[]>([]);

  const [loadingCoupons, setLoadingCoupons] =
    useState(false);

  const [couponCode, setCouponCode] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState<AvailableCoupon | null>(null);

  const [discount, setDiscount] =
    useState(0);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [couponError, setCouponError] =
    useState("");

  const [isApplyingCoupon, setIsApplyingCoupon] =
    useState(false);

  /*
  ============================================================
  GENERAL STATE
  ============================================================
  */

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
    Math.max(
      0,
      subtotal +
        deliveryCharge -
        discount
    );

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

    const highestCharge =
      Math.max(
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
  LOAD AVAILABLE COUPONS
  ============================================================

  We check every cart product.

  Only coupons allocated to products currently inside
  the cart will be displayed.

  ONE ORDER = ONE COUPON.
  ============================================================
  */

  useEffect(() => {
    let cancelled = false;

    const loadCoupons = async () => {
      if (items.length === 0) {
        setAvailableCoupons([]);
        return;
      }

      try {
        setLoadingCoupons(true);
        setCouponError("");

        const results: (
          | AvailableCoupon
          | null
        )[] = await Promise.all(
          items.map(
            async (
              item
            ): Promise<AvailableCoupon | null> => {
              try {
                const params =
                  new URLSearchParams({
                    productId:
                      String(
                        item.productId
                      ),

                    subtotal:
                      String(
                        subtotal
                      ),
                  });

                const response =
                  await fetch(
                    `/api/coupon/available?${params.toString()}`,
                    {
                      cache: "no-store",
                    }
                  );

                if (!response.ok) {
                  return null;
                }

                const data =
                  await response.json();

                if (
                  !data?.success ||
                  !data?.coupon
                ) {
                  return null;
                }

                const coupon =
                  data.coupon;

                return {
                  id: Number(
                    coupon.id
                  ),

                  code: String(
                    coupon.code
                  ),

                  discountType:
                    coupon.discountType,

                  discountValue:
                    Number(
                      coupon.discountValue ||
                        0
                    ),

                  minimumOrderAmount:
                    Number(
                      coupon.minimumOrderAmount ||
                        0
                    ),

                  expiresAt:
                    coupon.expiresAt ||
                    null,

                  productId:
                    String(
                      item.productId
                    ),

                  productName:
                    item.productName,
                } satisfies AvailableCoupon;
              } catch (error) {
                console.error(
                  "Coupon availability error:",
                  error
                );

                return null;
              }
            })
          );

        if (cancelled) {
          return;
        }

        /*
        --------------------------------------------------------
        REMOVE NULL VALUES
        --------------------------------------------------------
        */

        const validCoupons =
          results.filter(
            (
              coupon
            ): coupon is AvailableCoupon =>
              coupon !== null
          );

        /*
        --------------------------------------------------------
        DEDUPLICATE COUPONS
        --------------------------------------------------------
        */

        const uniqueCoupons =
          Array.from(
            new Map(
              validCoupons.map(
                (coupon) => [
                  coupon.code
                    .trim()
                    .toUpperCase(),
                  coupon,
                ]
              )
            ).values()
          );

        setAvailableCoupons(
          uniqueCoupons
        );

        /*
        --------------------------------------------------------
        REMOVE APPLIED COUPON IF IT IS NO LONGER AVAILABLE
        --------------------------------------------------------
        */

        if (
          appliedCoupon &&
          !uniqueCoupons.some(
            (coupon) =>
              coupon.code
                .trim()
                .toUpperCase() ===
              appliedCoupon.code
                .trim()
                .toUpperCase()
          )
        ) {
          setAppliedCoupon(null);
          setDiscount(0);
          setCouponCode("");
          setCouponMessage("");
        }
      } catch (error) {
        console.error(
          "Load coupons error:",
          error
        );

        if (!cancelled) {
          setAvailableCoupons([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCoupons(false);
        }
      }
    };

    loadCoupons();

    return () => {
      cancelled = true;
    };
  }, [
    items,
    subtotal,
    appliedCoupon,
  ]);

  /*
  ============================================================
  CLEAR COUPON IF CART CHANGES
  ============================================================
  */

  useEffect(() => {
    if (!appliedCoupon) {
      return;
    }

    const stillInCart =
      items.some(
        (item) =>
          String(
            item.productId
          ) ===
          String(
            appliedCoupon.productId
          )
      );

    if (!stillInCart) {
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponCode("");
      setCouponMessage("");
    }
  }, [
    items,
    appliedCoupon,
  ]);

  /*
  ============================================================
  APPLY COUPON
  ============================================================
  */

  const applyCoupon = async (
    selectedCode?: string
  ) => {
    if (isApplyingCoupon) {
      return;
    }

    const cleanCode = (
      selectedCode ||
      couponCode
    )
      .trim()
      .toUpperCase();

    if (!cleanCode) {
      setCouponError(
        "কুপন কোড লিখুন"
      );

      setCouponMessage("");

      return;
    }

    const matchingCoupon =
      availableCoupons.find(
        (coupon) =>
          coupon.code
            .trim()
            .toUpperCase() ===
          cleanCode
      );

    if (!matchingCoupon) {
      setCouponError(
        "এই কুপনটি আপনার বর্তমান কার্টের জন্য প্রযোজ্য নয়"
      );

      setCouponMessage("");

      return;
    }

    /*
    ============================================================
    ONE ORDER = ONE COUPON
    ============================================================
    */

    setIsApplyingCoupon(true);
    setCouponError("");
    setCouponMessage("");

    try {
      /*
      ----------------------------------------------------------
      SERVER VALIDATION
      ----------------------------------------------------------

      We use the product to which this coupon is allocated.
      The server/database will perform the final validation.
      ----------------------------------------------------------
      */

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
                cleanCode,

              productId:
                matchingCoupon.productId,

              subtotal:
                subtotal,
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.coupon
      ) {
        setDiscount(0);
        setAppliedCoupon(null);

        setCouponError(
          result.error ||
            result.message ||
            "এই কুপনটি বর্তমানে ব্যবহার করা যাচ্ছে না"
        );

        return;
      }

      const validatedDiscount =
        Math.min(
          Number(
            result.discount ||
              result.coupon
                ?.discountValue ||
              0
          ),
          subtotal
        );

      /*
      ----------------------------------------------------------
      APPLY
      ----------------------------------------------------------
      */

      setAppliedCoupon(
        matchingCoupon
      );

      setCouponCode(
        matchingCoupon.code
      );

      setDiscount(
        validatedDiscount
      );

      setCouponMessage(
        `✓ ${matchingCoupon.code} কুপন প্রয়োগ হয়েছে — ৳${validatedDiscount} ছাড়`
      );

      setCouponError("");
    } catch (error) {
      console.error(
        "Apply coupon error:",
        error
      );

      setDiscount(0);
      setAppliedCoupon(null);

      setCouponError(
        "কুপন যাচাই করতে সমস্যা হয়েছে"
      );
    } finally {
      setIsApplyingCoupon(
        false
      );
    }
  };

  /*
  ============================================================
  REMOVE COUPON
  ============================================================
  */

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setDiscount(0);
    setCouponMessage("");
    setCouponError("");
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

              contents:
                items.map(
                  (item) => ({
                    id:
                      String(
                        item.productId
                      ),
                    quantity:
                      Number(
                        item.quantity
                      ),
                  })
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

        IMPORTANT:

        We still send the selected coupon code.

        The DATABASE RPC calculates the real discount.
        Client-side discount is NOT trusted by the database.
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

                deliveryArea,
                deliveryCharge,

                couponCode:
                  appliedCoupon?.code ||
                  couponCode.trim() ||
                  null,

                /*
                ------------------------------------------------
                LEGACY FIELD
                ------------------------------------------------

                The database RPC now ignores client discount
                and calculates the real discount itself.

                We send 0 for safety.
                ------------------------------------------------
                */

                discount: 0,

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
              result.error ||
              "Order Failed"
          );

          return;
        }

        /*
        ======================================================
        GET ORDER ID
        ======================================================
        */

        const orderId =
          String(
            result.orderId ||
              ""
          ).trim();

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
        IMPORTANT:
        USE SERVER CALCULATED VALUES
        ======================================================
        */

        const serverGrandTotal =
          Number(
            result.grandTotal ??
              result.total ??
              grandTotal
          );

        const serverDiscount =
          Number(
            result.discount ??
              discount
          );

        /*
        ======================================================
        FACEBOOK — PURCHASE
        ======================================================

        Browser eventID = orderId

        Server CAPI event_id = same orderId
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

              contents:
                items.map(
                  (item) => ({
                    id:
                      String(
                        item.productId
                      ),
                    quantity:
                      Number(
                        item.quantity
                      ),
                  })
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
                serverGrandTotal,

              num_items:
                totalItems,

              /*
              Optional custom parameter.
              This helps preserve coupon context.
              */

              coupon:
                appliedCoupon?.code ||
                couponCode.trim() ||
                undefined,

              discount:
                serverDiscount,
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
    <main className="min-h-screen bg-gray-50 py-5 sm:py-10">

      <div className="mx-auto max-w-6xl px-3 sm:px-5">

        <h1 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-4xl">
          Quick Order
        </h1>

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr] lg:gap-8">

          {/* ==================================================
              LEFT SIDE — CART
          ================================================== */}

          <div className="space-y-3 sm:space-y-5">

            {items.map(
              (item) => (
                <div
                  key={
                    item.productId
                  }
                  className="rounded-2xl border bg-white p-3 shadow-sm sm:p-5"
                >

                  <div className="flex items-center gap-3 sm:gap-5">

                    <img
                      src={
                        item.image
                      }
                      alt={
                        item.productName
                      }
                      className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                    />

                    <div className="min-w-0 flex-1">

                      <h2 className="line-clamp-2 text-base font-bold sm:text-xl">
                        {
                          item.productName
                        }
                      </h2>

                      <p className="mt-1 text-base font-semibold text-teal-700 sm:mt-2 sm:text-lg">
                        ৳{" "}
                        {
                          item.unitPrice
                        }
                      </p>

                      {/* Quantity */}

                      <div className="mt-3 flex items-center gap-2 sm:mt-5 sm:gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              item.productId
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:bg-gray-100 sm:h-10 sm:w-10"
                        >
                          −
                        </button>

                        <div className="min-w-[30px] text-center font-bold sm:min-w-[40px] sm:text-lg">
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
                          className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:bg-gray-100 sm:h-10 sm:w-10"
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
                          className="ml-1 rounded-lg bg-red-50 px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 sm:ml-5 sm:px-3 sm:text-sm"
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
              RIGHT SIDE — ORDER FORM
          ================================================== */}

          <div className="h-fit rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-24">

            {/* ==================================================
                FREE PALESTINE
            ================================================== */}

            <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 sm:mb-5 sm:text-sm">
              <span className="h-px flex-1 bg-gray-200" />

              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span aria-hidden="true">🇵🇸</span>
                <span>Free Palestine</span>
              </span>

              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <h2 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">
              Order Summary
            </h2>

            {/* ==================================================
                BASIC SUMMARY
            ================================================== */}

            <div className="space-y-3">

              <div className="flex items-center justify-between text-sm sm:text-base">

                <span>
                  Total Products
                </span>

                <span className="font-bold">
                  {
                    totalItems
                  }
                </span>

              </div>

              <div className="flex items-center justify-between text-sm sm:text-base">

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

            </div>

            <hr className="my-4 sm:my-6" />

            {/* ==================================================
                COUPON — FIRST / HIGH VISIBILITY
            ================================================== */}

            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3 sm:p-4">

              <div className="mb-3 flex items-center justify-between">

                <div>
                  <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                    🎟️ বিশেষ কুপন
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    একটি অর্ডারে একটি কুপন ব্যবহার করা যাবে
                  </p>
                </div>

                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={
                      removeCoupon
                    }
                    className="text-xs font-semibold text-red-600"
                  >
                    Remove
                  </button>
                )}

              </div>

              {/* ==================================================
                  AVAILABLE COUPONS
              ================================================== */}

              {loadingCoupons ? (
                <div className="rounded-xl bg-white p-3 text-center text-sm text-gray-500">
                  কুপন খোঁজা হচ্ছে...
                </div>
              ) : availableCoupons.length > 0 ? (
                <div className="space-y-2">

                  {availableCoupons.map(
                    (coupon) => {
                      const isApplied =
                        appliedCoupon?.code
                          .trim()
                          .toUpperCase() ===
                        coupon.code
                          .trim()
                          .toUpperCase();

                      return (
                        <div
                          key={
                            coupon.id
                          }
                          className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 ${
                            isApplied
                              ? "border-teal-500 ring-1 ring-teal-500"
                              : "border-gray-200"
                          }`}
                        >

                          <div className="min-w-0">

                            <div className="flex items-center gap-2">

                              <span className="truncate text-sm font-bold text-gray-900">
                                {
                                  coupon.code
                                }
                              </span>

                              {isApplied && (
                                <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                                  Applied
                                </span>
                              )}

                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              ৳
                              {
                                coupon.discountValue
                              }{" "}
                              টাকা ছাড়
                            </p>

                            {coupon.minimumOrderAmount &&
                              coupon.minimumOrderAmount >
                                0 && (
                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  মিনিমাম অর্ডার ৳
                                  {
                                    coupon.minimumOrderAmount
                                  }
                                </p>
                              )}

                          </div>

                          <button
                            type="button"
                            disabled={
                              isApplied ||
                              isApplyingCoupon
                            }
                            onClick={() =>
                              applyCoupon(
                                coupon.code
                              )
                            }
                            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition sm:px-4 ${
                              isApplied
                                ? "bg-teal-100 text-teal-700"
                                : "bg-teal-600 text-white hover:bg-teal-700"
                            } disabled:cursor-not-allowed`}
                          >
                            {isApplied
                              ? "Applied ✓"
                              : isApplyingCoupon
                              ? "..."
                              : "Apply Now"}
                          </button>

                        </div>
                      );
                    }
                  )}

                </div>
              ) : (
                <div className="rounded-xl bg-white p-3 text-center text-xs text-gray-500">
                  এই কার্টের জন্য বর্তমানে কোনো বিশেষ কুপন নেই।
                </div>
              )}

              {/* ==================================================
                  MANUAL COUPON
              ================================================== */}

              <div className="mt-3 flex gap-2">

                <input
                  type="text"
                  value={
                    couponCode
                  }
                  onChange={(
                    e
                  ) => {
                    setCouponCode(
                      e.target.value
                    );

                    if (
                      couponError
                    ) {
                      setCouponError(
                        ""
                      );
                    }
                  }}
                  onKeyDown={(
                    e
                  ) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      e.preventDefault();

                      applyCoupon();
                    }
                  }}
                  placeholder="কুপন কোড লিখুন"
                  className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    applyCoupon()
                  }
                  disabled={
                    isApplyingCoupon
                  }
                  className="shrink-0 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {isApplyingCoupon
                    ? "..."
                    : "Apply"}
                </button>

              </div>

              {couponMessage && (
                <p className="mt-2 text-xs font-semibold text-teal-700">
                  {couponMessage}
                </p>
              )}

              {couponError && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {couponError}
                </p>
              )}

            </div>

            <hr className="my-4 sm:my-6" />

            {/* ==================================================
                CUSTOMER INFORMATION
            ================================================== */}

            <div className="space-y-3 sm:space-y-4">

              <h3 className="text-lg font-bold sm:text-xl">
                Customer Information
              </h3>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />

              <input
                type="tel"
                inputMode="numeric"
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
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
                rows={2}
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
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />

            </div>

            <hr className="my-4 sm:my-6" />

            {/* ==================================================
                DELIVERY
            ================================================== */}

            <div className="space-y-3">

              <label className="text-sm font-semibold text-gray-700">
                ডেলিভারি
              </label>

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
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >

                <option value="dhaka">
                  ঢাকার ভিতরে
                </option>

                <option value="outside">
                  ঢাকার বাইরে
                </option>

              </select>

            </div>

            <hr className="my-4 sm:my-6" />

            {/* ==================================================
                FINAL TOTAL
            ================================================== */}

            <div className="space-y-3">

              <div className="flex justify-between text-sm">

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

              <div className="flex justify-between text-sm">

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
                <div className="flex justify-between text-sm font-semibold text-teal-700">

                  <span>
                    Coupon Discount
                  </span>

                  <span>
                    - ৳{" "}
                    {
                      discount
                    }
                  </span>

                </div>
              )}

              <div className="my-2 border-t" />

              <div className="flex justify-between text-xl font-bold sm:text-2xl">

                <span>
                  Grand Total
                </span>

                <span className="text-teal-700">
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
              className="mt-5 w-full rounded-xl bg-teal-600 py-3.5 text-base font-bold text-white transition hover:bg-teal-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-400 sm:mt-8 sm:py-4 sm:text-lg"
            >
              {isSubmitting
                ? "অর্ডার পাঠানো হচ্ছে..."
                : "অর্ডার কনফার্ম করুন"}
            </button>

            <p className="mt-2 text-center text-[11px] text-gray-400">
              Cash on Delivery • অর্ডার নিশ্চিত করতে উপরের তথ্যগুলো দিন
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}