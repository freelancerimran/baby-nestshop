"use client";

import { useMemo, useState } from "react";

import OrderForm from "@/components/OrderForm";
import QuickCartButton from "@/components/order/QuickCartButton";

import { Product } from "@/types/product";
import { CartVariant } from "@/types/cart";

import {
  FaWhatsapp,
  FaFacebookMessenger,
} from "react-icons/fa";


/*
============================================================
TYPES
============================================================
*/

export type SelectedVariant =
  CartVariant & {
    quantity: number;
  };


type Props = {
  product: Product & {
    variants?: CartVariant[];
  };
};


/*
============================================================
COMPONENT
============================================================
*/

export default function ProductCheckout({
  product,
}: Props) {

  /*
  ==========================================================
  ALL VARIANTS
  ==========================================================
  */

  const allVariants =
    product.variants || [];


  /*
  ==========================================================
  ACTIVE + IN-STOCK VARIANTS
  ==========================================================
  */

  const variants =
    allVariants.filter(
      (variant) =>
        variant.status === "Active" &&
        Number(
          variant.realStock || 0
        ) > 0
    );


  /*
  ==========================================================
  HAS VARIANTS
  ==========================================================
  */

  const hasVariants =
    allVariants.length > 0;


  /*
  ==========================================================
  SELECTED QUANTITIES

  Example:

  {
    101: 2,
    102: 1
  }

  means:

  Variant 101 → 2 pcs
  Variant 102 → 1 pc
  ==========================================================
  */

  const [
    selectedQuantities,
    setSelectedQuantities,
  ] = useState<
    Record<number, number>
  >({});


  /*
  ==========================================================
  SELECTED VARIANTS

  Quantity > 0 only.
  ==========================================================
  */

  const selectedVariants =
    useMemo<SelectedVariant[]>(
      () =>
        variants
          .filter(
            (variant) =>
              Number(
                selectedQuantities[
                  variant.id
                ] || 0
              ) > 0
          )
          .map(
            (variant) => ({
              ...variant,

              quantity: Math.max(
                1,
                Number(
                  selectedQuantities[
                    variant.id
                  ] || 1
                )
              ),
            })
          ),

      [
        variants,
        selectedQuantities,
      ]
    );


  /*
  ==========================================================
  TOTAL SELECTED QUANTITY
  ==========================================================
  */

  const selectedItemCount =
    selectedVariants.reduce(
      (sum, variant) =>
        sum +
        Number(
          variant.quantity || 0
        ),
      0
    );


  /*
  ==========================================================
  SELECTED VARIANTS SUBTOTAL
  ==========================================================
  */

  const selectedVariantsSubtotal =
    selectedVariants.reduce(
      (sum, variant) => {

        const unitPrice =
          variant.price != null
            ? Number(
                variant.price
              )
            : Number(
                product.sellingPrice ||
                  0
              );

        return (
          sum +
          unitPrice *
            Number(
              variant.quantity || 0
            )
        );
      },

      0
    );


  /*
  ==========================================================
  PRODUCT PRICE
  ==========================================================
  */

  const regularPrice =
    Number(
      product.regularPrice || 0
    );


  /*
  ==========================================================
  LOWEST VARIANT PRICE

  Used before the customer selects
  a variant.
  ==========================================================
  */

  const minimumVariantPrice =
    variants.reduce<
      number | null
    >(
      (
        minimum,
        variant
      ) => {

        const price =
          variant.price != null
            ? Number(
                variant.price
              )
            : Number(
                product.sellingPrice ||
                  0
              );

        if (
          minimum === null
        ) {
          return price;
        }

        return Math.min(
          minimum,
          price
        );
      },

      null
    );


  /*
  ==========================================================
  DISPLAY OFFER PRICE
  ==========================================================
  */

  const offerPrice =
    hasVariants
      ? selectedItemCount > 0
        ? selectedVariantsSubtotal
        : minimumVariantPrice ??
          Number(
            product.sellingPrice ||
              0
          )
      : Number(
          product.sellingPrice ||
            0
        );


  /*
  ==========================================================
  REGULAR TOTAL

  For multiple selected quantities:
  regular price × total quantity
  ==========================================================
  */

  const regularTotal =
    hasVariants &&
    selectedItemCount > 0
      ? regularPrice *
        selectedItemCount
      : regularPrice;


  /*
  ==========================================================
  SAVING
  ==========================================================
  */

  const saving =
    regularTotal > offerPrice
      ? regularTotal -
        offerPrice
      : 0;


  /*
  ==========================================================
  DISCOUNT %
  ==========================================================
  */

  const discountPercent =
    regularTotal > 0 &&
    saving > 0
      ? Math.round(
          (saving /
            regularTotal) *
            100
        )
      : 0;


  /*
  ==========================================================
  SELECT / UNSELECT VARIANT
  ==========================================================
  */

  const toggleVariant = (
    variantId: number
  ) => {

    setSelectedQuantities(
      (previous) => {

        const next = {
          ...previous,
        };

        const currentQuantity =
          Number(
            next[variantId] || 0
          );

        /*
        ----------------------------------------------------
        Already selected
        → Remove
        ----------------------------------------------------
        */

        if (
          currentQuantity > 0
        ) {

          delete next[
            variantId
          ];

        }

        /*
        ----------------------------------------------------
        Not selected
        → Add with quantity 1
        ----------------------------------------------------
        */

        else {

          next[variantId] = 1;

        }

        return next;
      }
    );
  };


  /*
  ==========================================================
  CHANGE VARIANT QUANTITY
  ==========================================================
  */

  const changeVariantQuantity = (
    variantId: number,
    quantity: number
  ) => {

    setSelectedQuantities(
      (previous) => {

        const next = {
          ...previous,
        };

        /*
        ----------------------------------------------------
        Quantity 0
        → Automatically remove variant
        ----------------------------------------------------
        */

        if (
          quantity <= 0
        ) {

          delete next[
            variantId
          ];

        }

        /*
        ----------------------------------------------------
        Check stock
        ----------------------------------------------------
        */

        else {

          const variant =
            variants.find(
              (item) =>
                item.id ===
                variantId
            );

          const maxStock =
            Number(
              variant?.realStock ||
                0
            );

          next[variantId] =
            Math.min(
              quantity,
              maxStock
            );

        }

        return next;
      }
    );
  };


  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div className="sticky top-24">

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

        {/* ==================================================
            FREE PALESTINE
        ================================================== */}

        <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-gray-500">

          <span className="h-px flex-1 bg-gray-200" />

          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">

            <span aria-hidden="true">
              🇵🇸
            </span>

            <span>
              Free Palestine
            </span>

          </span>

          <span className="h-px flex-1 bg-gray-200" />

        </div>


        {/* ==================================================
            PRODUCT TITLE
        ================================================== */}

        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
          {product.name}
        </h1>


        {/* ==================================================
            SHORT DESCRIPTION
        ================================================== */}

        {product.shortDescription && (
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {
              product.shortDescription
            }
          </p>
        )}


        {/* ==================================================
            PRICE
        ================================================== */}

        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/80 p-4">

          {regularTotal >
          offerPrice ? (

            <>

              <div className="flex items-center justify-between gap-3">

                <span className="text-sm font-semibold text-gray-600">
                  রেগুলার মূল্য
                </span>

                <span className="text-lg font-semibold text-gray-400 line-through">
                  ৳{" "}
                  {regularTotal.toLocaleString(
                    "en-US"
                  )}
                </span>

              </div>


              <div className="mt-2 flex items-center justify-between gap-3">

                <span className="text-sm font-bold text-red-600">
                  অফার মূল্য
                </span>

                <span className="text-2xl font-extrabold text-teal-700">
                  ৳{" "}
                  {offerPrice.toLocaleString(
                    "en-US"
                  )}
                </span>

              </div>


              <div className="mt-2 flex flex-wrap gap-2">

                {saving > 0 && (
                  <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                    💰 সাশ্রয় ৳{" "}
                    {saving.toLocaleString(
                      "en-US"
                    )}
                  </span>
                )}


                {discountPercent >
                  0 && (
                  <span className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                    🔥{" "}
                    {
                      discountPercent
                    }
                    % OFF
                  </span>
                )}

              </div>

            </>

          ) : (

            <div className="flex items-center justify-between gap-3">

              <span className="text-sm font-bold text-gray-600">
                মূল্য
              </span>

              <span className="text-2xl font-extrabold text-teal-700">
                ৳{" "}
                {offerPrice.toLocaleString(
                  "en-US"
                )}
              </span>

            </div>

          )}

        </div>


        {/* ==================================================
            ADD TO CART
        ================================================== */}

        <div className="mt-4">

          <QuickCartButton
            product={
              product
            }
          />

          <p className="mt-2 text-center text-xs leading-relaxed text-gray-500">
            🛒 একাধিক প্রোডাক্ট একসাথে
            অর্ডার করতে Add to Cart করুন
          </p>

        </div>


        {/* ==================================================
            SINGLE PRODUCT ORDER
        ================================================== */}

        <div
          id="product-order-form"
          className="mt-5 scroll-mt-24 border-t border-gray-200 pt-5"
        >

          {/* ==================================================
              ORDER TITLE
          ================================================== */}

          <div className="mb-4 flex items-center gap-2">

            <span className="text-xl">
              🛍️
            </span>

            <h2 className="text-xl font-extrabold text-gray-900">
              অর্ডার করুন
            </h2>

          </div>


          {/* ==================================================
              VARIANT SELECTION
          ================================================== */}

          {hasVariants && (

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">

              <div className="mb-3 flex items-center justify-between gap-3">

                <div>

                  <p className="text-sm font-bold text-gray-900">
                    Variant Selection
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    এক বা একাধিক variant নির্বাচন করুন
                  </p>

                </div>


                {selectedItemCount >
                  0 && (
                  <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-700">
                    {
                      selectedItemCount
                    }{" "}
                    টি
                  </span>
                )}

              </div>


              {/* =================================================
                  VARIANT CARDS

                  All variants stay on one horizontal line.
                  Horizontal scrolling is allowed.
              ================================================= */}

              {variants.length >
              0 ? (

                <div className="w-full overflow-hidden pb-1">

                  <div
                    className="grid w-full gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${variants.length}, minmax(0, 1fr))`,
                    }}
                  >

                    {variants.map(
                      (variant) => {

                        const quantity =
                          Number(
                            selectedQuantities[
                              variant.id
                            ] || 0
                          );

                        const isSelected =
                          quantity > 0;

                        const variantImage =
                          variant.image ||
                          product.image ||
                          "";

                        return (

                          <button
                            key={
                              variant.id
                            }
                            type="button"
                            onClick={() =>
                              toggleVariant(
                                variant.id
                              )
                            }
                            aria-pressed={
                              isSelected
                            }
                            className={`relative w-full min-w-0 overflow-hidden rounded-xl border bg-white p-1.5 transition active:scale-[0.98] sm:p-2 ${
                              isSelected
                                ? "border-teal-600 ring-2 ring-teal-100"
                                : "border-gray-200 hover:border-teal-400"
                            }`}
                          >

                            {/* IMAGE */}

                            <div className="relative mx-auto aspect-square w-full max-w-16 overflow-hidden rounded-lg bg-gray-100">

                              {variantImage ? (

                                <img
                                  src={
                                    variantImage
                                  }
                                  alt={
                                    variant.variantName
                                  }
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />

                              ) : (

                                <div className="flex h-full items-center justify-center text-[9px] text-gray-400">
                                  No image
                                </div>

                              )}


                              {/* CHECK */}

                              {isSelected && (

                                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                                  ✓
                                </span>

                              )}

                            </div>


                            {/* NAME */}

                            <p className="mt-1 truncate text-center text-[clamp(8px,2.5vw,12px)] font-bold leading-tight text-gray-900 sm:mt-2">
                              {
                                variant.variantName
                              }
                            </p>


                            {/* PRICE */}

                            <p className="mt-0.5 truncate text-center text-[clamp(7px,2vw,10px)] text-gray-500 sm:mt-1">
                              ৳{" "}
                              {Number(
                                variant.price ??
                                  product.sellingPrice ??
                                  0
                              ).toLocaleString(
                                "en-US"
                              )}
                            </p>

                          </button>

                        );
                      }
                    )}

                  </div>

                </div>

              ) : (

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-orange-700">
                  বর্তমানে কোনো variant stock-এ নেই।
                </div>

              )}


              {/* =================================================
                  VARIANT REQUIRED WARNING
              ================================================= */}

              {variants.length >
                0 &&
                selectedVariants.length ===
                  0 && (

                  <p className="mt-3 text-xs font-semibold text-red-600">
                    ⚠️ অর্ডার করতে অন্তত
                    একটি variant নির্বাচন করুন।
                  </p>

                )}

            </div>

          )}


          {/* ==================================================
              SELECTED VARIANT + QUANTITY
          ================================================== */}

          {hasVariants &&
            selectedVariants.length >
              0 && (

            <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50 p-3">

              <div className="mb-3 flex items-center justify-between">

                <p className="text-sm font-bold text-gray-900">
                  Selected Variant + Quantity
                </p>

                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-700">
                  {
                    selectedItemCount
                  }{" "}
                  টি
                </span>

              </div>


              <div className="space-y-2">

                {selectedVariants.map(
                  (variant) => {

                    const unitPrice =
                      Number(
                        variant.price ??
                          product.sellingPrice ??
                          0
                      );

                    const maxStock =
                      Number(
                        variant.realStock ||
                          0
                      );

                    return (

                      <div
                        key={
                          variant.id
                        }
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5"
                      >

                        {/* IMAGE */}

                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">

                          {variant.image ||
                          product.image ? (

                            <img
                              src={
                                variant.image ||
                                product.image ||
                                ""
                              }
                              alt={
                                variant.variantName
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            <div className="flex h-full items-center justify-center text-[8px] text-gray-400">
                              No image
                            </div>

                          )}

                        </div>


                        {/* NAME + PRICE */}

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-bold text-gray-900">
                            {
                              variant.variantName
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            ৳{" "}
                            {unitPrice.toLocaleString(
                              "en-US"
                            )}{" "}
                            ×{" "}
                            {
                              variant.quantity
                            }
                          </p>

                        </div>


                        {/* QUANTITY */}

                        <div className="flex shrink-0 items-center gap-2">

                          <div className="flex items-center rounded-lg border border-gray-300 bg-white">

                            <button
                              type="button"
                              onClick={() =>
                                changeVariantQuantity(
                                  variant.id,
                                  variant.quantity -
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center text-lg font-bold text-gray-700 transition hover:bg-gray-100"
                              aria-label={`Decrease ${variant.variantName}`}
                            >
                              −
                            </button>


                            <span className="flex h-8 min-w-8 items-center justify-center px-1 text-sm font-bold text-gray-900">
                              {
                                variant.quantity
                              }
                            </span>


                            <button
                              type="button"
                              disabled={
                                variant.quantity >=
                                maxStock
                              }
                              onClick={() =>
                                changeVariantQuantity(
                                  variant.id,
                                  variant.quantity +
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center text-lg font-bold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Increase ${variant.variantName}`}
                            >
                              +
                            </button>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              changeVariantQuantity(
                                variant.id,
                                0
                              )
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
                            aria-label={`Remove ${variant.variantName}`}
                            title="Remove variant"
                          >
                            ×
                          </button>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>


              {/* =================================================
                  SELECTED SUBTOTAL
              ================================================= */}

              <div className="mt-3 flex items-center justify-between border-t border-teal-100 pt-3">

                <span className="text-sm font-semibold text-gray-600">
                  Selected Subtotal
                </span>

                <span className="text-lg font-extrabold text-teal-700">
                  ৳{" "}
                  {selectedVariantsSubtotal.toLocaleString(
                    "en-US"
                  )}
                </span>

              </div>

            </div>

          )}


          {/* ==================================================
              NON-VARIANT QUANTITY

              OrderForm will handle the normal product
              quantity for non-variant products.
          ================================================== */}


          {/* ==================================================
              CUSTOMER / COUPON / DELIVERY / SUMMARY
          ================================================== */}

          <div className="mt-4">

            <OrderForm
              product={
                product
              }

              hasVariants={
                hasVariants
              }

              selectedVariants={
                selectedVariants
              }

              onVariantQuantityChange={(
                variantId,
                quantity
              ) => {

                changeVariantQuantity(
                  variantId,
                  quantity
                );

              }}
            />

          </div>

        </div>


        {/* ==================================================
            WHATSAPP + MESSENGER
        ================================================== */}

        <div className="mt-5 grid grid-cols-2 gap-3">

          <a
            href="https://wa.me/8801734330771"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >

            <FaWhatsapp
              size={19}
            />

            WhatsApp

          </a>


          <a
            href="https://m.me/babynestshops"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >

            <FaFacebookMessenger
              size={19}
            />

            Messenger

          </a>

        </div>


        {/* ==================================================
            TRUST SECTION
        ================================================== */}

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
              ⭐ হাজারো অভিভাবকের
              আস্থার Baby Nest
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