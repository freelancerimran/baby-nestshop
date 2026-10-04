"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import type {
  LandingPage,
  LandingPageVariant,
} from "@/types/landing-page";

type Props = {
  landingPage: LandingPage;
};

type SelectedVariant =
  LandingPageVariant & {
    quantity: number;
  };

type DeliveryArea =
  | "dhaka"
  | "outside";

type ProductData = {
  productId:
    | string
    | number;

  productName?: string;

  image?: string;

  galleryImage1?: string;
  galleryImage2?: string;
  galleryImage3?: string;
  galleryImage4?: string;
};

declare global {
  interface Window {
    fbq?: (
      command: string,
      eventName: string,
      params?: Record<
        string,
        unknown
      >,
      options?: Record<
        string,
        unknown
      >
    ) => void;
  }
}

function money(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "en-BD"
  );
}

function cleanPhoneValue(
  value: string
) {
  return value
    .replace(/\D/g, "")
    .trim();
}

function getDiscountPercent(
  regularPrice: number,
  offerPrice: number
) {
  if (
    regularPrice <= 0 ||
    offerPrice <= 0 ||
    offerPrice >=
      regularPrice
  ) {
    return 0;
  }

  return Math.round(
    ((regularPrice -
      offerPrice) /
      regularPrice) *
      100
  );
}

export default function LandingPageClient({
  landingPage,
}: Props) {
  /*
  ============================================================
  LANDING PAGE DATA
  ============================================================
  */

  const title =
    landingPage.pageTitle?.trim() ||
    "Baby Nest Product";

  const description =
    landingPage.description?.trim() ||
    "";

  const regularPrice =
    Number(
      landingPage.regularPrice ||
        0
    );

  const offerPrice =
    Number(
      landingPage.offerPrice ||
        landingPage.regularPrice ||
        0
    );

  const discountPercent =
    getDiscountPercent(
      regularPrice,
      offerPrice
    );

  const images =
    Array.isArray(
      landingPage.images
    )
      ? landingPage.images.filter(
          Boolean
        )
      : [];

  const variants =
    Array.isArray(
      landingPage.variants
    )
      ? landingPage.variants
      : [];

  const hasVariants =
    variants.length > 0;

  /*
  ============================================================
  DELIVERY CONFIG
  ============================================================
  */

  const deliveryMode =
    landingPage.deliveryMode ===
    "paid"
      ? "paid"
      : "free";

  const deliveryInsideDhaka =
    Math.max(
      0,
      Number(
        landingPage.deliveryInsideDhaka ||
          0
      )
    );

  const deliveryOutsideDhaka =
    Math.max(
      0,
      Number(
        landingPage.deliveryOutsideDhaka ||
          0
      )
    );

  /*
  ============================================================
  STATE
  ============================================================
  */

  const [
    activeImage,
    setActiveImage,
  ] = useState(0);

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    selectedVariants,
    setSelectedVariants,
  ] = useState<
    SelectedVariant[]
  >([]);

  const [
    customerName,
    setCustomerName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    district,
    setDistrict,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    note,
    setNote,
  ] = useState("");

  const [
    deliveryArea,
    setDeliveryArea,
  ] =
    useState<DeliveryArea>(
      "dhaka"
    );

  const [
    productData,
    setProductData,
  ] =
    useState<ProductData | null>(
      null
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    logoFailed,
    setLogoFailed,
  ] = useState(false);

  /*
  ============================================================
  SOURCE PRODUCT
  ============================================================
  */

  useEffect(() => {
    if (
      landingPage.isManual ||
      !landingPage.productId
    ) {
      return;
    }

    let cancelled =
      false;

    async function loadProduct() {
      try {
        const response =
          await fetch(
            "/api/products",
            {
              cache:
                "no-store",
            }
          );

        if (
          !response.ok
        ) {
          return;
        }

        const result =
          await response.json();

        const products =
          Array.isArray(
            result?.products
          )
            ? result.products
            : [];

        const found =
          products.find(
            (
              product: ProductData
            ) =>
              String(
                product.productId
              ) ===
              String(
                landingPage.productId
              )
          );

        if (
          !cancelled &&
          found
        ) {
          setProductData(
            found
          );
        }
      } catch (error) {
        console.error(
          "Landing page product load error:",
          error
        );
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [
    landingPage.isManual,
    landingPage.productId,
  ]);

  /*
  ============================================================
  FACEBOOK VIEW CONTENT
  ============================================================
  */

  useEffect(() => {
    if (
      typeof window ===
        "undefined" ||
      !window.fbq
    ) {
      return;
    }

    try {
      window.fbq(
        "track",
        "ViewContent",
        {
          content_ids: [
            String(
              landingPage.productId ||
                landingPage.id
            ),
          ],

          content_name:
            title,

          content_type:
            "product",

          currency:
            "BDT",

          value:
            offerPrice,
        }
      );
    } catch (error) {
      console.error(
        "Landing Page ViewContent error:",
        error
      );
    }
  }, [
    landingPage.id,
    landingPage.productId,
    title,
    offerPrice,
  ]);

  /*
  ============================================================
  DELIVERY CHARGE
  ============================================================
  */

  const deliveryCharge =
    deliveryMode === "free"
      ? 0
      : deliveryArea ===
          "dhaka"
        ? deliveryInsideDhaka
        : deliveryOutsideDhaka;

  /*
  ============================================================
  VARIANT TOTAL
  ============================================================
  */

  const selectedVariantTotal =
    selectedVariants.reduce(
      (
        sum,
        item
      ) => {
        const price =
          item.price !=
          null
            ? Number(
                item.price
              )
            : offerPrice;

        return (
          sum +
          price *
            Number(
              item.quantity ||
                0
            )
        );
      },
      0
    );

  const selectedVariantCount =
    selectedVariants.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.quantity ||
            0
        ),
      0
    );

  /*
  ============================================================
  SUBTOTAL
  ============================================================
  */

  const subtotal =
    hasVariants
      ? selectedVariantTotal
      : offerPrice *
        Number(
          quantity || 0
        );

  /*
  ============================================================
  TOTAL
  ============================================================
  */

  const total =
    Math.max(
      0,
      subtotal +
        deliveryCharge
    );

  /*
  ============================================================
  VARIANT
  ============================================================
  */

  function toggleVariant(
    variant: LandingPageVariant
  ) {
    setSelectedVariants(
      (current) => {
        const exists =
          current.find(
            (item) =>
              item.id ===
              variant.id
          );

        if (exists) {
          return current.filter(
            (item) =>
              item.id !==
              variant.id
          );
        }

        return [
          ...current,
          {
            ...variant,
            quantity: 1,
          },
        ];
      }
    );

    setErrorMessage("");
  }

  function updateVariantQuantity(
    variantId: number,
    nextQuantity: number
  ) {
    const safeQuantity =
      Math.max(
        1,
        Number(
          nextQuantity || 1
        )
      );

    setSelectedVariants(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            variantId
              ? {
                  ...item,
                  quantity:
                    safeQuantity,
                }
              : item
        )
    );
  }

  /*
  ============================================================
  FACEBOOK INITIATE CHECKOUT
  ============================================================
  */

  function trackInitiateCheckout() {
    if (
      typeof window ===
        "undefined" ||
      !window.fbq
    ) {
      return;
    }

    try {
      window.fbq(
        "track",
        "InitiateCheckout",
        {
          content_ids:
            hasVariants
              ? selectedVariants.map(
                  (
                    item
                  ) =>
                    `${landingPage.productId}:${item.id}`
                )
              : [
                  String(
                    landingPage.productId ||
                      landingPage.id
                  ),
                ],

          content_name:
            title,

          content_type:
            "product",

          currency:
            "BDT",

          value:
            total,

          num_items:
            hasVariants
              ? selectedVariantCount
              : quantity,
        }
      );
    } catch (error) {
      console.error(
        "Landing Page InitiateCheckout error:",
        error
      );
    }
  }

  /*
  ============================================================
  VALIDATION
  ============================================================
  */

  function validateForm() {
    if (
      hasVariants &&
      selectedVariants.length ===
        0
    ) {
      setErrorMessage(
        "অনুগ্রহ করে একটি ডিজাইন/ভ্যারিয়েন্ট নির্বাচন করুন।"
      );

      return false;
    }

    const cleanName =
      customerName.trim();

    const cleanPhone =
      cleanPhoneValue(
        phone
      );

    const cleanAddress =
      address.trim();

    if (!cleanName) {
      setErrorMessage(
        "আপনার নাম লিখুন।"
      );

      return false;
    }

    if (!cleanPhone) {
      setErrorMessage(
        "মোবাইল নম্বর লিখুন।"
      );

      return false;
    }

    if (
      !/^01\d{9}$/.test(
        cleanPhone
      )
    ) {
      setErrorMessage(
        "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন।"
      );

      return false;
    }

    if (
      !district.trim()
    ) {
      setErrorMessage(
        "জেলা লিখুন।"
      );

      return false;
    }

    if (!cleanAddress) {
      setErrorMessage(
        "সম্পূর্ণ ঠিকানা লিখুন।"
      );

      return false;
    }

    setErrorMessage("");

    return true;
  }

  /*
  ============================================================
  ORDER
  ============================================================
  */

  async function handleOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      isSubmitting
    ) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(
      true
    );

    setErrorMessage("");

    trackInitiateCheckout();

    const parentProductId =
      String(
        landingPage.productId ||
          ""
      );

    const orderItems =
      hasVariants
        ? selectedVariants.map(
            (item) => ({
              productId:
                Number(
                  parentProductId
                ),

              productName:
                title,

              productSlug:
                landingPage.slug ||
                "",

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
                  : offerPrice,
            })
          )
        : undefined;

    const orderData = {
      productId:
        Number(
          parentProductId
        ),

      productName:
        title,

      quantity:
        hasVariants
          ? selectedVariantCount
          : quantity,

      productSlug:
        landingPage.slug ||
        "",

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

      items:
        orderItems,

      customerName:
        customerName.trim(),

      phone:
        cleanPhoneValue(
          phone
        ),

      district:
        district.trim(),

      address:
        address.trim(),

      note:
        note.trim(),

      /*
      ========================================================
      DELIVERY
      ========================================================
      */

      deliveryArea,

      deliveryMode,

      deliveryCharge:
        Number(
          deliveryCharge
        ),

      discount: 0,

      total:
        Number(total),

      /*
      ========================================================
      LANDING PAGE SOURCE
      ========================================================
      */

      landingPageId:
        Number(
          landingPage.id
        ),

      landingPageSlug:
        landingPage.slug ||
        "",

      source:
        "landing_page",

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

      if (
        !response.ok ||
        !result?.success
      ) {
        setErrorMessage(
          result?.message ||
            result?.error ||
            "অর্ডার তৈরি করা যায়নি।"
        );

        return;
      }

      /*
      ========================================================
      FACEBOOK PURCHASE
      ========================================================
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
                      (
                        item
                      ) =>
                        `${parentProductId}:${item.id}`
                    )
                  : [
                      parentProductId,
                    ],

              content_name:
                title,

              content_type:
                "product",

              currency:
                "BDT",

              value:
                Number(
                  result?.total ??
                    total
                ),

              num_items:
                hasVariants
                  ? selectedVariantCount
                  : quantity,
            },
            {
              eventID:
                result?.orderId,
            }
          );
        }
      } catch (error) {
        console.error(
          "Landing Page Purchase error:",
          error
        );
      }

      const orderId =
        String(
          result?.orderId ||
            ""
        ).trim();

      if (!orderId) {
        setErrorMessage(
          "অর্ডার তৈরি হয়েছে, কিন্তু Order ID পাওয়া যায়নি।"
        );

        return;
      }

      window.location.href =
        `/order-success?order=${encodeURIComponent(
          orderId
        )}`;
    } catch (error) {
      console.error(
        "Landing Page order error:",
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
  }

  /*
  ============================================================
  IMAGE LIST
  ============================================================
  */

  const displayImages =
    images.length > 0
      ? images
      : productData
        ? [
            productData.image,
            productData.galleryImage1,
            productData.galleryImage2,
            productData.galleryImage3,
            productData.galleryImage4,
          ].filter(
            Boolean
          ) as string[]
        : [];

  const safeActiveImage =
    Math.min(
      activeImage,
      Math.max(
        0,
        displayImages.length -
          1
      )
    );

  const currentImage =
    displayImages[
      safeActiveImage
    ] || "";

  /*
  ============================================================
  BENEFITS / FEATURES
  ============================================================
  */

  const benefits =
    Array.isArray(
      landingPage.benefits
    )
      ? landingPage.benefits.filter(
          (
            item
          ) =>
            item?.trim()
        )
      : [];

  const features =
    Array.isArray(
      landingPage.features
    )
      ? landingPage.features.filter(
          (
            item
          ) =>
            item?.trim()
        )
      : [];

  /*
  ============================================================
  SCROLL
  ============================================================
  */

  function scrollToOrder() {
    document
      .getElementById(
        "landing-order-form"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start",
      });
  }

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">

          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <img
                src="/logo.png"
                alt="Baby Nest"
                width={46}
                height={46}
                loading="eager"
                decoding="async"
                onError={() =>
                  setLogoFailed(
                    true
                  )
                }
                className="h-10 w-10 rounded-xl object-contain sm:h-11 sm:w-11"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-sm font-black text-white sm:h-11 sm:w-11">
                BN
              </div>
            )}

            <div>
              <div className="text-lg font-black tracking-tight sm:text-xl">
                <span className="text-pink-600">
                  Baby
                </span>

                <span className="text-sky-500">
                  Nest
                </span>
              </div>

              <p className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                Play · Learn · Grow
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              🚚 দ্রুত ডেলিভারি
            </span>

            <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
              💵 Cash on Delivery
            </span>
          </div>

        </div>
      </header>

      {/* HERO */}

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-2 lg:gap-10 lg:py-10">

          {/* IMAGE */}

          <div className="lg:sticky lg:top-6 lg:self-start">

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">

              {currentImage ? (
                <img
                  src={
                    currentImage
                  }
                  alt={title}
                  width={900}
                  height={900}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm font-semibold text-slate-400">
                  Product Image
                </div>
              )}

            </div>

            {displayImages.length >
              1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {displayImages.map(
                  (
                    image,
                    index
                  ) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImage(
                          index
                        )
                      }
                      className={[
                        "overflow-hidden rounded-xl border-2 bg-white transition",
                        safeActiveImage ===
                        index
                          ? "border-pink-500 ring-2 ring-pink-100"
                          : "border-slate-200",
                      ].join(
                        " "
                      )}
                    >
                      <img
                        src={image}
                        alt=""
                        width={120}
                        height={120}
                        loading="lazy"
                        decoding="async"
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}

          </div>

          {/* PRODUCT */}

          <div className="min-w-0">

            <div className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1.5 text-[11px] font-black text-pink-600">
              ⭐ বিশেষ অফার
            </div>

            <h1 className="mt-3 text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem]">
              {title}
            </h1>

            {/* PRICE */}

            <div className="mt-5 flex flex-wrap items-end gap-3">

              {regularPrice >
                offerPrice && (
                <span className="text-lg font-medium text-slate-400 line-through">
                  ৳{" "}
                  {money(
                    regularPrice
                  )}
                </span>
              )}

              <span className="text-4xl font-black tracking-tight text-pink-600 sm:text-5xl">
                ৳{" "}
                {money(
                  offerPrice
                )}
              </span>

              {discountPercent >
                0 && (
                <span className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white">
                  {discountPercent}% ছাড়
                </span>
              )}

            </div>

            {/* TRUST */}

            <div className="mt-5 grid grid-cols-3 gap-2.5">

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                <div className="text-lg">
                  ✓
                </div>

                <p className="mt-1 text-[10px] font-black text-emerald-700 sm:text-xs">
                  নিরাপদ
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-center">
                <div className="text-lg">
                  🚚
                </div>

                <p className="mt-1 text-[10px] font-black text-sky-700 sm:text-xs">
                  হোম ডেলিভারি
                </p>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-3 text-center">
                <div className="text-lg">
                  💵
                </div>

                <p className="mt-1 text-[10px] font-black text-orange-700 sm:text-xs">
                  COD
                </p>
              </div>

            </div>

            {/* VARIANTS */}

            {hasVariants && (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">

                <div className="mb-4">
                  <h2 className="text-lg font-black">
                    ডিজাইন নির্বাচন করুন
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    আপনার পছন্দের ডিজাইন নির্বাচন করুন
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                  {variants.map(
                    (
                      variant
                    ) => {
                      const selected =
                        selectedVariants.some(
                          (
                            item
                          ) =>
                            item.id ===
                            variant.id
                        );

                      return (
                        <button
                          key={
                            variant.id
                          }
                          type="button"
                          onClick={() =>
                            toggleVariant(
                              variant
                            )
                          }
                          className={[
                            "overflow-hidden rounded-2xl border-2 bg-white text-left transition-all",
                            selected
                              ? "border-pink-500 ring-4 ring-pink-100"
                              : "border-slate-200 hover:border-pink-300",
                          ].join(
                            " "
                          )}
                        >

                          {variant.image && (
                            <img
                              src={
                                variant.image
                              }
                              alt={
                                variant.variantName
                              }
                              width={300}
                              height={300}
                              loading="lazy"
                              decoding="async"
                              className="aspect-square w-full object-cover"
                            />
                          )}

                          <div className="p-3">

                            <p className="text-sm font-bold leading-5">
                              {
                                variant.variantName
                              }
                            </p>

                            {variant.price !=
                              null && (
                              <p className="mt-1 text-xs font-black text-pink-600">
                                ৳{" "}
                                {money(
                                  Number(
                                    variant.price
                                  )
                                )}
                              </p>
                            )}

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

                {selectedVariants.length >
                  0 && (
                  <div className="mt-4 space-y-2">

                    {selectedVariants.map(
                      (
                        variant
                      ) => (
                        <div
                          key={
                            variant.id
                          }
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                        >

                          <span className="min-w-0 pr-3 text-sm font-bold">
                            {
                              variant.variantName
                            }
                          </span>

                          <div className="flex shrink-0 items-center gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                updateVariantQuantity(
                                  variant.id,
                                  variant.quantity -
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg font-black"
                            >
                              −
                            </button>

                            <span className="w-6 text-center text-sm font-black">
                              {
                                variant.quantity
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateVariantQuantity(
                                  variant.id,
                                  variant.quantity +
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg font-black"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleVariant(
                                  variant
                                )
                              }
                              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-sm font-black text-red-600"
                              aria-label="Remove variant"
                            >
                              ×
                            </button>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

            {/* QUANTITY */}

            {!hasVariants && (
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                <div>
                  <p className="font-black">
                    Quantity
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    প্রয়োজন অনুযায়ী quantity নির্বাচন করুন
                  </p>
                </div>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (
                          current
                        ) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-black"
                  >
                    −
                  </button>

                  <span className="w-8 text-center font-black">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (
                          current
                        ) =>
                          current +
                          1
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-black"
                  >
                    +
                  </button>

                </div>

              </div>
            )}

            {/* ORDER FORM */}

            <form
              id="landing-order-form"
              onSubmit={
                handleOrder
              }
              className="mt-5 scroll-mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.07)] sm:p-6"
            >

              <div className="mb-5">
                <div className="flex items-center justify-between gap-3">

                  <div>
                    <h2 className="text-xl font-black">
                      অর্ডার করতে তথ্য দিন
                    </h2>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Cash on Delivery
                    </p>
                  </div>

                  <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                    ✓ Secure Order
                  </div>

                </div>
              </div>

              <div className="space-y-4">

                {/* NAME */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    আপনার নাম
                  </label>

                  <input
                    value={
                      customerName
                    }
                    onChange={(
                      event
                    ) =>
                      setCustomerName(
                        event
                          .target
                          .value
                      )
                    }
                    autoComplete="name"
                    placeholder="আপনার পূর্ণ নাম"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    মোবাইল নম্বর
                  </label>

                  <input
                    value={
                      phone
                    }
                    onChange={(
                      event
                    ) =>
                      setPhone(
                        event
                          .target
                          .value
                      )
                    }
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                {/* DISTRICT */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    জেলা
                  </label>

                  <input
                    value={
                      district
                    }
                    onChange={(
                      event
                    ) =>
                      setDistrict(
                        event
                          .target
                          .value
                      )
                    }
                    autoComplete="address-level2"
                    placeholder="যেমন: ঢাকা"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                {/* ADDRESS */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    সম্পূর্ণ ঠিকানা
                  </label>

                  <textarea
                    value={
                      address
                    }
                    onChange={(
                      event
                    ) =>
                      setAddress(
                        event
                          .target
                          .value
                      )
                    }
                    rows={3}
                    autoComplete="street-address"
                    placeholder="বাড়ি/রোড/এলাকা"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                {/* NOTE */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    অতিরিক্ত নোট{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    value={
                      note
                    }
                    onChange={(
                      event
                    ) =>
                      setNote(
                        event
                          .target
                          .value
                      )
                    }
                    rows={2}
                    placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                {/* DELIVERY */}

                <div>

                  <label className="mb-2 block text-sm font-bold">
                    ডেলিভারি এলাকা
                  </label>

                  {deliveryMode ===
                  "free" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800">
                          🚚 Free Delivery
                        </span>

                        <span className="font-black text-emerald-700">
                          ৳0
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-emerald-700">
                        এই অফারে Inside Dhaka এবং Outside Dhaka — উভয় ক্ষেত্রেই ডেলিভারি ফ্রি।
                      </p>

                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          setDeliveryArea(
                            "dhaka"
                          )
                        }
                        className={[
                          "rounded-xl border px-3 py-3 text-sm font-bold transition",
                          deliveryArea ===
                          "dhaka"
                            ? "border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-100"
                            : "border-slate-200 bg-white text-slate-700",
                        ].join(
                          " "
                        )}
                      >
                        📍 Inside Dhaka

                        <span className="mt-1 block text-xs">
                          ৳{" "}
                          {money(
                            deliveryInsideDhaka
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
                          "rounded-xl border px-3 py-3 text-sm font-bold transition",
                          deliveryArea ===
                          "outside"
                            ? "border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-100"
                            : "border-slate-200 bg-white text-slate-700",
                        ].join(
                          " "
                        )}
                      >
                        🚚 Outside Dhaka

                        <span className="mt-1 block text-xs">
                          ৳{" "}
                          {money(
                            deliveryOutsideDhaka
                          )}
                        </span>
                      </button>

                    </div>
                  )}

                </div>

              </div>

              {/* SUMMARY */}

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">

                <div className="flex justify-between text-sm">
                  <span>
                    Product
                  </span>

                  <span className="font-bold">
                    ৳{" "}
                    {money(
                      subtotal
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">

                  <span>
                    Delivery
                  </span>

                  <span className="font-bold">
                    {deliveryMode ===
                    "free"
                      ? "Free Delivery"
                      : `৳ ${money(
                          deliveryCharge
                        )}`}
                  </span>

                </div>

                <div className="my-3 border-t border-slate-200" />

                <div className="flex items-center justify-between">

                  <span className="font-black">
                    সর্বমোট
                  </span>

                  <span className="text-2xl font-black text-pink-600">
                    ৳{" "}
                    {money(
                      total
                    )}
                  </span>

                </div>

              </div>

              {/* ERROR */}

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                  {
                    errorMessage
                  }
                </div>
              )}

              {/* ORDER */}

              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 px-5 py-4 text-base font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "অর্ডার প্রসেস হচ্ছে..."
                  : "🛒 অর্ডার করুন এখনই"}
              </button>

              <p className="mt-3 text-center text-xs font-medium leading-5 text-slate-500">
                Cash on Delivery · অর্ডার নিশ্চিত হওয়ার পর আমাদের টিম যোগাযোগ করবে
              </p>

            </form>

          </div>

        </div>
      </section>

      {/* BENEFITS */}

      {benefits.length >
        0 && (
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">

            <div className="mx-auto max-w-2xl text-center">

              <span className="text-xs font-black uppercase tracking-widest text-pink-600">
                Why Parents Love It
              </span>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                কেন আপনার শিশুর জন্য এটি ভালো?
              </h2>

            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {benefits.map(
                (
                  benefit,
                  index
                ) => (
                  <div
                    key={`${benefit}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >

                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                      ✓
                    </div>

                    <p className="text-sm font-bold leading-6 text-slate-800">
                      {benefit}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>
        </section>
      )}

      {/* DESCRIPTION */}

      {description && (
        <section className="bg-slate-50">

          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">

            <div className="text-center">

              <span className="text-xs font-black uppercase tracking-widest text-pink-600">
                Product Details
              </span>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                প্রোডাক্ট সম্পর্কে
              </h2>

            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm sm:p-8">

              <div className="whitespace-pre-line">
                {
                  description
                }
              </div>

            </div>

          </div>

        </section>
      )}

      {/* FEATURES */}

      {features.length >
        0 && (
        <section className="bg-white">

          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">

            <div className="mx-auto max-w-2xl text-center">

              <span className="text-xs font-black uppercase tracking-widest text-pink-600">
                What's Included
              </span>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                প্রোডাক্টের ভিতরে যা থাকছে
              </h2>

            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {features.map(
                (
                  feature,
                  index
                ) => (
                  <div
                    key={`${feature}-${index}`}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >

                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-black text-pink-600">
                      ✓
                    </span>

                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      {feature}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>

        </section>
      )}

      {/* FINAL CTA */}

      <section className="bg-slate-950">

        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-xl">
            🛒
          </div>

          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            আপনার শিশুর জন্য আজই অর্ডার করুন
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
            সীমিত অফার মূল্যে পণ্যটি অর্ডার করুন এবং Cash on Delivery সুবিধা নিন।
          </p>

          <button
            type="button"
            onClick={
              scrollToOrder
            }
            className="mt-6 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 px-7 py-4 text-sm font-black text-white"
          >
            🛒 এখনই অর্ডার করুন
          </button>

        </div>

      </section>

      {/* MOBILE CTA */}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-2.5 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">

        <div className="mx-auto flex max-w-xl items-center gap-2">

          <div className="min-w-0 flex-1 pl-2">

            <p className="truncate text-[10px] font-bold text-slate-500">
              আজকের অফার
            </p>

            <p className="text-lg font-black text-pink-600">
              ৳{" "}
              {money(
                offerPrice
              )}
            </p>

          </div>

          <button
            type="button"
            onClick={
              scrollToOrder
            }
            className="min-h-12 flex-1 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-3 text-sm font-black text-white"
          >
            🛒 অর্ডার করুন
          </button>

        </div>

      </div>

      <div className="h-20 md:hidden" />

    </main>
  );
}