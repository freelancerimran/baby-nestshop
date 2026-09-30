"use client";

import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/types/product";
import type { CartVariant } from "@/types/cart";

import { districts } from "@/data/districts";

type SelectedVariant = CartVariant & {
  quantity: number;
};

type OrderFormProps = {
  product: Product;

  hasVariants?: boolean;

  selectedVariants?: SelectedVariant[];

  onVariantQuantityChange?: (
    variantId: number,
    quantity: number
  ) => void;
};

export default function OrderForm({
  product,
  hasVariants = false,
  selectedVariants = [],
  onVariantQuantityChange,
}: OrderFormProps) {
  /*
   * =========================================================
   * CUSTOMER INFORMATION
   * =========================================================
   */

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [district, setDistrict] =
    useState("");

  const [note, setNote] =
    useState("");

  /*
   * =========================================================
   * DELIVERY
   * =========================================================
   */

  const [deliveryArea, setDeliveryArea] =
    useState<
      "dhaka" | "outside"
    >("dhaka");

  const [deliveryCharge, setDeliveryCharge] =
    useState(
      Number(
        product.deliveryInsideDhaka ||
          0
      )
    );

  /*
   * =========================================================
   * COUPON
   * =========================================================
   */

  const [couponCode, setCouponCode] =
    useState("");

  const [discount, setDiscount] =
    useState(0);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [isApplyingCoupon, setIsApplyingCoupon] =
    useState(false);

  /*
   * =========================================================
   * ORDER
   * =========================================================
   */

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [orderSuccess, setOrderSuccess] =
    useState(false);

  const [orderId, setOrderId] =
    useState("");

  /*
   * =========================================================
   * NORMAL PRODUCT QUANTITY
   * =========================================================
   */

  const [quantity, setQuantity] =
    useState(1);

  const [availableStock, setAvailableStock] =
    useState(
      Number(
        product.displayStock || 0
      )
    );

  const [loadingStock, setLoadingStock] =
    useState(true);

  /*
   * =========================================================
   * UNIT PRICE
   * =========================================================
   */

  const parentSellingPrice =
    Number(
      product.sellingPrice || 0
    );

  /*
   * =========================================================
   * SELECTED VARIANT COUNT
   * =========================================================
   */

  const selectedItemCount =
    selectedVariants.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  /*
   * =========================================================
   * VARIANT SUBTOTAL
   * =========================================================
   */

  const variantSubtotal =
    selectedVariants.reduce(
      (sum, item) => {
        const unitPrice =
          item.price != null
            ? Number(item.price)
            : parentSellingPrice;

        return (
          sum +
          unitPrice *
            Number(
              item.quantity || 0
            )
        );
      },
      0
    );

  /*
   * =========================================================
   * NORMAL PRODUCT SUBTOTAL
   * =========================================================
   */

  const normalSubtotal =
    parentSellingPrice *
    Number(quantity || 0);

  /*
   * =========================================================
   * CURRENT SUBTOTAL
   * =========================================================
   */

  const subtotal =
    hasVariants
      ? variantSubtotal
      : normalSubtotal;

  /*
   * =========================================================
   * TOTAL
   * =========================================================
   */

  const total = Math.max(
    0,
    subtotal +
      Number(
        deliveryCharge || 0
      ) -
      Number(
        discount || 0
      )
  );

  /*
   * =========================================================
   * VARIANT VALIDATION
   * =========================================================
   */

  const variantSelectionMissing =
    hasVariants &&
    selectedVariants.length === 0;

  /*
   * =========================================================
   * LOAD CURRENT STOCK
   * =========================================================
   *
   * For normal products only.
   *
   * Variant stock is validated by the
   * server-side order transaction.
   */

  useEffect(() => {
    if (hasVariants) {
      setLoadingStock(false);
      return;
    }

    let cancelled = false;

    const loadStock =
      async () => {
        try {
          const response =
            await fetch(
              "/api/products",
              {
                cache: "no-store",
              }
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          const currentProduct =
            data.products?.find(
              (
                item: {
                  productId:
                    | number
                    | string;
                }
              ) =>
                Number(
                  item.productId
                ) ===
                Number(
                  product.id
                )
            );

          if (
            !cancelled &&
            currentProduct
          ) {
            setAvailableStock(
              Number(
                currentProduct.displayStock ||
                  0
              )
            );
          }
        } catch (error) {
          console.error(
            "Stock loading error:",
            error
          );
        } finally {
          if (!cancelled) {
            setLoadingStock(
              false
            );
          }
        }
      };

    loadStock();

    return () => {
      cancelled = true;
    };
  }, [
    product.id,
    hasVariants,
  ]);

  /*
   * =========================================================
   * KEEP NORMAL QUANTITY INSIDE STOCK
   * =========================================================
   */

  useEffect(() => {
    if (hasVariants) {
      return;
    }

    if (
      availableStock <= 0
    ) {
      setQuantity(0);
      return;
    }

    if (
      quantity >
      availableStock
    ) {
      setQuantity(
        availableStock
      );
    }

    if (quantity < 1) {
      setQuantity(1);
    }
  }, [
    availableStock,
    quantity,
    hasVariants,
  ]);

  /*
   * =========================================================
   * DELIVERY CHARGE
   * =========================================================
   */

  useEffect(() => {
    if (
      deliveryArea ===
      "dhaka"
    ) {
      setDeliveryCharge(
        Number(
          product.deliveryInsideDhaka ||
            0
        )
      );
    } else {
      setDeliveryCharge(
        Number(
          product.deliveryOutsideDhaka ||
            0
        )
      );
    }

    /*
     * Changing delivery area means
     * previously calculated coupon/total
     * should be recalculated visually.
     */
  }, [
    deliveryArea,
    product.deliveryInsideDhaka,
    product.deliveryOutsideDhaka,
  ]);

  /*
   * =========================================================
   * CLEAR ERROR WHEN USER EDITS FORM
   * =========================================================
   */

  useEffect(() => {
    if (
      customerName.trim() ||
      phone.trim() ||
      address.trim() ||
      district
    ) {
      setErrorMessage("");
    }
  }, [
    customerName,
    phone,
    address,
    district,
  ]);

  /*
   * =========================================================
   * COUPON
   * =========================================================
   */

  const applyCoupon =
    async () => {
      if (isApplyingCoupon) {
        return;
      }

      const cleanCouponCode =
        couponCode
          .trim()
          .toUpperCase();

      if (!cleanCouponCode) {
        setDiscount(0);

        setCouponMessage(
          "❌ কুপন কোড লিখুন"
        );

        return;
      }

      if (subtotal <= 0) {
        setDiscount(0);

        setCouponMessage(
          "❌ আগে product/variant নির্বাচন করুন"
        );

        return;
      }

      setIsApplyingCoupon(
        true
      );

      setCouponMessage(
        "কুপন যাচাই করা হচ্ছে..."
      );

      try {
        /*
         * For multi-variant orders we send
         * the parent product ID.
         *
         * Final coupon validation is still
         * performed by the backend.
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
                  cleanCouponCode,

                productId:
                  String(
                    product.id
                  ),

                subtotal,
              }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          setDiscount(0);

          setCouponMessage(
            `❌ ${
              result.error ||
              result.message ||
              "কুপনটি প্রযোজ্য নয়"
            }`
          );

          return;
        }

        const appliedDiscount =
          Math.min(
            Math.max(
              0,
              Number(
                result.discount ||
                  0
              )
            ),
            subtotal
          );

        setDiscount(
          appliedDiscount
        );

        setCouponCode(
          cleanCouponCode
        );

        setCouponMessage(
          `✅ ৳${appliedDiscount.toLocaleString(
            "en-BD"
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
        setIsApplyingCoupon(
          false
        );
      }
    };

  /*
   * =========================================================
   * REMOVE COUPON
   * =========================================================
   */

  const removeCoupon =
    () => {
      setCouponCode("");
      setDiscount(0);
      setCouponMessage("");
    };

  /*
   * =========================================================
   * NORMAL PRODUCT QUANTITY
   * =========================================================
   */

  const decreaseQuantity =
    () => {
      setQuantity(
        (current) =>
          Math.max(
            1,
            current - 1
          )
      );

      setDiscount(0);
      setCouponMessage("");
    };

  const increaseQuantity =
    () => {
      setQuantity(
        (current) =>
          Math.min(
            availableStock,
            current + 1
          )
      );

      setDiscount(0);
      setCouponMessage("");
    };

  /*
   * =========================================================
   * ORDER
   * =========================================================
   */

  const handleOrder =
    async () => {
      if (isSubmitting) {
        return;
      }

      /*
       * -----------------------------------------------
       * VARIANT CHECK
       * -----------------------------------------------
       */

      if (
        hasVariants &&
        selectedVariants.length ===
          0
      ) {
        setErrorMessage(
          "⚠️ অর্ডার করার আগে অন্তত একটি ভ্যারিয়েশন নির্বাচন করুন।"
        );

        return;
      }

      /*
       * -----------------------------------------------
       * NORMAL STOCK CHECK
       * -----------------------------------------------
       */

      if (
        !hasVariants &&
        quantity >
          availableStock
      ) {
        setErrorMessage(
          `সর্বোচ্চ ${availableStock} টি অর্ডার করা যাবে`
        );

        return;
      }

      if (
        !hasVariants &&
        quantity <= 0
      ) {
        setErrorMessage(
          "কমপক্ষে ১টি product নির্বাচন করুন"
        );

        return;
      }

      /*
       * -----------------------------------------------
       * CUSTOMER DATA
       * -----------------------------------------------
       */

      const cleanName =
        customerName.trim();

      const cleanPhone =
        phone.trim();

      const cleanAddress =
        address.trim();

      const cleanNote =
        note.trim();

      /*
       * NAME
       */

      if (!cleanName) {
        setErrorMessage(
          "আপনার নাম লিখুন"
        );

        return;
      }

      /*
       * PHONE
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
       * DISTRICT
       */

      if (!district) {
        setErrorMessage(
          "জেলা নির্বাচন করুন"
        );

        return;
      }

      /*
       * ADDRESS
       */

      if (!cleanAddress) {
        setErrorMessage(
          "সম্পূর্ণ ঠিকানা লিখুন"
        );

        return;
      }

      /*
       * DELIVERY AREA
       */

      if (
        deliveryArea !==
          "dhaka" &&
        deliveryArea !==
          "outside"
      ) {
        setErrorMessage(
          "Delivery area নির্বাচন করুন"
        );

        return;
      }

      /*
       * -----------------------------------------------
       * CLEAR ERROR
       * -----------------------------------------------
       */

      setErrorMessage("");

      setIsSubmitting(
        true
      );

      /*
       * -----------------------------------------------
       * FACEBOOK INITIATE CHECKOUT
       * -----------------------------------------------
       */

      try {
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
                hasVariants
                  ? selectedVariants.map(
                      (item) =>
                        `${product.id}:${item.id}`
                    )
                  : [
                      String(
                        product.id
                      ),
                    ],

              content_name:
                hasVariants
                  ? `${product.name} - ${selectedVariants
                      .map(
                        (item) =>
                          item.variantName
                      )
                      .join(
                        ", "
                      )}`
                  : product.name,

              content_type:
                "product",

              currency: "BDT",

              value: total,

              num_items:
                hasVariants
                  ? selectedItemCount
                  : quantity,
            }
          );
        }
      } catch (error) {
        console.error(
          "Facebook InitiateCheckout error:",
          error
        );
      }

      /*
       * -----------------------------------------------
       * ORDER ITEMS
       * -----------------------------------------------
       */

      const orderItems =
        hasVariants
          ? selectedVariants.map(
              (item) => ({
                productId:
                  Number(
                    product.id
                  ),

                productName:
                  product.name,

                productSlug:
                  product.slug,

                variantId:
                  Number(
                    item.id
                  ),

                variantName:
                  item.variantName,

                variantSku:
                  item.sku,

                quantity:
                  Number(
                    item.quantity
                  ),

                unitPrice:
                  item.price !=
                  null
                    ? Number(
                        item.price
                      )
                    : parentSellingPrice,
              })
            )
          : undefined;

      /*
       * -----------------------------------------------
       * MAIN ORDER DATA
       * -----------------------------------------------
       */

      const orderData = {
        productId:
          Number(
            product.id
          ),

        productName:
          product.name,

        quantity:
          hasVariants
            ? selectedItemCount
            : quantity,

        productSlug:
          product.slug,

        /*
         * Variant data for single variant
         * compatibility.
         */
        variantId:
          hasVariants &&
          selectedVariants.length ===
            1
            ? Number(
                selectedVariants[0]
                  .id
              )
            : null,

        variantName:
          hasVariants &&
          selectedVariants.length ===
            1
            ? selectedVariants[0]
                .variantName
            : null,

        variantSku:
          hasVariants &&
          selectedVariants.length ===
            1
            ? selectedVariants[0]
                .sku
            : null,

        /*
         * Multiple variant items.
         */
        items:
          orderItems,

        /*
         * Customer.
         */
        customerName:
          cleanName,

        phone:
          cleanPhone,

        address:
          cleanAddress,

        district,

        note:
          cleanNote,

        /*
         * Delivery.
         */
        deliveryArea,

        deliveryCharge:

          Number(
            deliveryCharge ||
              0
          ),

        /*
         * Coupon.
         */
        discount:

          Number(
            discount || 0
          ),

        total,

        couponCode:
          couponCode
            .trim()
            .toUpperCase(),

        orderDate:
          new Date().toISOString(),
      };

      /*
       * -----------------------------------------------
       * CREATE ORDER
       * -----------------------------------------------
       */

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

              body: JSON.stringify(
                orderData
              ),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          setErrorMessage(
            result.message ||
              result.error ||
              "অর্ডার তৈরি করা যায়নি"
          );

          return;
        }

        if (
          !result.success
        ) {
          setErrorMessage(
            result.message ||
              result.error ||
              "অর্ডার তৈরি করা যায়নি"
          );

          return;
        }

        /*
         * -------------------------------------------
         * FACEBOOK PURCHASE
         * -------------------------------------------
         */

        try {
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
                  hasVariants
                    ? selectedVariants.map(
                        (item) =>
                          `${product.id}:${item.id}`
                      )
                    : [
                        String(
                          product.id
                        ),
                      ],

                content_name:
                  hasVariants
                    ? `${product.name} - ${selectedVariants
                        .map(
                          (item) =>
                            item.variantName
                        )
                        .join(
                          ", "
                        )}`
                    : product.name,

                content_type:
                  "product",

                currency: "BDT",

                value:
                  Number(
                    result.total ??
                      total
                  ),

                num_items:
                  hasVariants
                    ? selectedItemCount
                    : quantity,
              },
              {
                eventID:
                  result.orderId,
              }
            );
          }
        } catch (error) {
          console.error(
            "Facebook Purchase error:",
            error
          );
        }

        /*
         * -------------------------------------------
         * SUCCESS
         * -------------------------------------------
         */

        setOrderId(
          result.orderId ||
            ""
        );

        setOrderSuccess(
          true
        );

        /*
         * Reset customer form.
         */
        setCustomerName("");
        setPhone("");
        setAddress("");
        setDistrict("");
        setNote("");

        /*
         * Reset coupon.
         */
        setCouponCode("");
        setDiscount(0);
        setCouponMessage("");

        /*
         * Reset normal quantity.
         */
        setQuantity(1);

      } catch (error) {
        console.error(
          "Order request error:",
          error
        );

        setErrorMessage(
          "Server Error. আবার চেষ্টা করুন।"
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /*
   * =========================================================
   * ORDER SUCCESS
   * =========================================================
   */

  if (orderSuccess) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

        <div className="text-center">

          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white">
            ✓
          </div>

          <h3 className="text-xl font-extrabold text-green-800">
            অর্ডার সফল হয়েছে!
          </h3>

          {orderId && (
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Order ID:{" "}
              <span className="text-green-700">
                {orderId}
              </span>
            </p>
          )}

          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            আপনার অর্ডারটি সফলভাবে
            গ্রহণ করা হয়েছে। খুব
            শীঘ্রই আমাদের টিম আপনার
            সাথে যোগাযোগ করবে।
          </p>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * FORM UI
   * =========================================================
   */

  return (
    <div className="space-y-5">

      {/* =====================================================
          YOUR INFORMATION
          ===================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white">

        <div className="border-b bg-gray-50 px-4 py-3">

          <h3 className="font-extrabold text-gray-900">
            👤 আপনার তথ্য দিন
          </h3>

          <p className="mt-0.5 text-xs text-gray-500">
            অর্ডার ডেলিভারির জন্য
            সঠিক তথ্য দিন
          </p>

        </div>

        <div className="space-y-3 p-4">

          {/* Name */}

          <input
            value={
              customerName
            }
            onChange={(event) =>
              setCustomerName(
                event.target
                  .value
              )
            }
            placeholder="আপনার নাম"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          {/* Phone */}

          <input
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target
                  .value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(
                    0,
                    11
                  )
              )
            }
            placeholder="মোবাইল নম্বর (01XXXXXXXXX)"
            inputMode="numeric"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          {/* District */}

          <select
            value={district}
            onChange={(event) =>
              setDistrict(
                event.target
                  .value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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

          {/* Address */}

          <textarea
            value={address}
            onChange={(event) =>
              setAddress(
                event.target
                  .value
              )
            }
            placeholder="সম্পূর্ণ ঠিকানা লিখুন"
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          {/* Note */}

          <textarea
            value={note}
            onChange={(event) =>
              setNote(
                event.target
                  .value
              )
            }
            placeholder="অতিরিক্ত নোট (ঐচ্ছিক)"
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

        </div>

      </div>

      {/* =====================================================
          COUPON
          ===================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white">

        <div className="border-b bg-gray-50 px-4 py-3">

          <h3 className="font-extrabold text-gray-900">
            🎟️ কুপন কোড
          </h3>

          <p className="mt-0.5 text-xs text-gray-500">
            আপনার কাছে কুপন থাকলে
            এখানে ব্যবহার করুন
          </p>

        </div>

        <div className="p-4">

          {discount > 0 ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3">

              <div className="flex items-center justify-between gap-3">

                <div>

                  <p className="text-xs font-bold text-green-800">
                    {couponCode}
                  </p>

                  <p className="mt-0.5 text-xs text-green-700">
                    {couponMessage}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    removeCoupon
                  }
                  className="text-xs font-bold text-red-600"
                >
                  Remove
                </button>

              </div>

            </div>
          ) : (
            <>
              <div className="flex gap-2">

                <input
                  value={
                    couponCode
                  }
                  onChange={(
                    event
                  ) =>
                    setCouponCode(
                      event.target
                        .value
                        .toUpperCase()
                    )
                  }
                  placeholder="Coupon Code"
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />

                <button
                  type="button"
                  onClick={
                    applyCoupon
                  }
                  disabled={
                    isApplyingCoupon
                  }
                  className="shrink-0 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {isApplyingCoupon
                    ? "..."
                    : "Apply"}
                </button>

              </div>

              {couponMessage && (
                <p className="mt-2 text-xs font-semibold">
                  {couponMessage}
                </p>
              )}
            </>
          )}

        </div>

      </div>

      {/* =====================================================
          DELIVERY AREA
          ===================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white">

        <div className="border-b bg-gray-50 px-4 py-3">

          <h3 className="font-extrabold text-gray-900">
            🚚 ডেলিভারি নির্বাচন করুন
          </h3>

          <p className="mt-0.5 text-xs text-gray-500">
            আপনার ডেলিভারি এলাকা
            নির্বাচন করুন
          </p>

        </div>

        <div className="space-y-3 p-4">

          <div className="grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={() =>
                setDeliveryArea(
                  "dhaka"
                )
              }
              className={[
                "rounded-xl border px-3 py-3",
                "text-sm font-bold",
                "transition",

                deliveryArea ===
                "dhaka"
                  ? "border-teal-600 bg-teal-50 text-teal-700 ring-2 ring-teal-100"
                  : "border-gray-200 bg-white text-gray-700 hover:border-teal-400",
              ].join(" ")}
            >
              <span className="block">
                📍 Inside Dhaka
              </span>

              <span className="mt-1 block text-xs font-semibold">
                ৳{" "}
                {Number(
                  product.deliveryInsideDhaka ||
                    0
                ).toLocaleString(
                  "en-BD"
                )}
              </span>

            </button>

            <button
              type="button"
              onClick={() =>
                setDeliveryArea(
                  "outside"
                )
              }
              className={[
                "rounded-xl border px-3 py-3",
                "text-sm font-bold",
                "transition",

                deliveryArea ===
                "outside"
                  ? "border-teal-600 bg-teal-50 text-teal-700 ring-2 ring-teal-100"
                  : "border-gray-200 bg-white text-gray-700 hover:border-teal-400",
              ].join(" ")}
            >
              <span className="block">
                🚚 Outside Dhaka
              </span>

              <span className="mt-1 block text-xs font-semibold">
                ৳{" "}
                {Number(
                  product.deliveryOutsideDhaka ||
                    0
                ).toLocaleString(
                  "en-BD"
                )}
              </span>

            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          NORMAL PRODUCT QUANTITY
          ===================================================== */}

      {!hasVariants && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">

          <div className="flex items-center justify-between gap-3">

            <div>

              <p className="font-bold text-gray-900">
                Quantity
              </p>

              <p className="text-xs text-gray-500">
                Available:{" "}
                {loadingStock
                  ? "..."
                  : availableStock}
              </p>

            </div>

            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50">

              <button
                type="button"
                onClick={
                  decreaseQuantity
                }
                disabled={
                  quantity <=
                  1
                }
                className="flex h-10 w-10 items-center justify-center text-lg font-bold disabled:opacity-40"
              >
                −
              </button>

              <span className="min-w-10 text-center font-bold">
                {quantity}
              </span>

              <button
                type="button"
                onClick={
                  increaseQuantity
                }
                disabled={
                  quantity >=
                  availableStock
                }
                className="flex h-10 w-10 items-center justify-center text-lg font-bold disabled:opacity-40"
              >
                +
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          ORDER SUMMARY
          ===================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

        <h3 className="mb-3 font-extrabold text-gray-900">
          Order Summary
        </h3>

        <div className="space-y-2 text-sm">

          <div className="flex justify-between">

            <span className="text-gray-600">
              Subtotal
            </span>

            <span className="font-semibold">
              ৳{" "}
              {subtotal.toLocaleString(
                "en-BD"
              )}
            </span>

          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-700">

              <span>
                Discount
              </span>

              <span className="font-bold">
                − ৳{" "}
                {discount.toLocaleString(
                  "en-BD"
                )}
              </span>

            </div>
          )}

          <div className="flex justify-between">

            <span className="text-gray-600">
              Delivery
            </span>

            <span className="font-semibold">
              ৳{" "}
              {Number(
                deliveryCharge
              ).toLocaleString(
                "en-BD"
              )}
            </span>

          </div>

          <div className="border-t border-gray-200 pt-3">

            <div className="flex items-center justify-between">

              <span className="text-base font-extrabold">
                সর্বমোট
              </span>

              <span className="text-2xl font-extrabold text-teal-700">
                ৳{" "}
                {total.toLocaleString(
                  "en-BD"
                )}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          FINAL ORDER BUTTON
          ===================================================== */}

      <button
        type="button"
        onClick={
          handleOrder
        }
        disabled={
          isSubmitting ||
          (hasVariants &&
            selectedVariants.length ===
              0)
        }
        className="w-full rounded-2xl bg-teal-600 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-teal-100 transition hover:bg-teal-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "অর্ডার তৈরি হচ্ছে..."
          : "অর্ডার কনফার্ম করুন"}
      </button>

      {hasVariants &&
        selectedVariants.length ===
          0 && (
          <p className="-mt-2 text-center text-xs font-semibold text-red-600">
            ⚠️ অর্ডার করতে হলে আগে
            অন্তত একটি ভ্যারিয়েশন
            নির্বাচন করুন
          </p>
        )}

    </div>
  );
}