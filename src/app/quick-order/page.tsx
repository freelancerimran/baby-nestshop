"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { districts } from "@/data/districts";
import {
  CartItem,
  CartVariant,
} from "@/types/cart";
import { useQuickCart } from "@/lib/store/quick-cart";

type AvailableCoupon = {
  id: number;
  code: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumOrderAmount: number;
  expiresAt: string | null;
  productId: string;
  productName: string;
};

type VariantSelection = Record<
  number,
  Record<number, number>
>;

type OrderItemPayload = {
  productId: number;
  variantId: number | null;
  quantity: number;
};

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString(
    "en-BD"
  )}`;
}

function getActiveVariants(
  item: CartItem
): CartVariant[] {
  return (item.variants || []).filter(
    (variant) =>
      variant.status === "Active" &&
      Number(variant.realStock) > 0
  );
}

export default function QuickOrderPage() {
  const {
    items,
    clearCart,
  } = useQuickCart();

  const router = useRouter();

  /* ============================================================
     VARIANT SELECTION
     ============================================================ */

  const [
    variantSelections,
    setVariantSelections,
  ] = useState<VariantSelection>({});

  /* ============================================================
     CUSTOMER
     ============================================================ */

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [district, setDistrict] =
    useState("");

  const [address, setAddress] =
    useState("");

  /* ============================================================
     DELIVERY
     ============================================================ */

  const [deliveryArea, setDeliveryArea] =
    useState("dhaka");

  const [deliveryCharge, setDeliveryCharge] =
    useState(0);

  /* ============================================================
     COUPON
     ============================================================ */

  const [
    availableCoupons,
    setAvailableCoupons,
  ] = useState<AvailableCoupon[]>([]);

  const [
    loadingCoupons,
    setLoadingCoupons,
  ] = useState(false);

  const [couponCode, setCouponCode] =
    useState("");

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] = useState<AvailableCoupon | null>(
    null
  );

  const [discount, setDiscount] =
    useState(0);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [couponError, setCouponError] =
    useState("");

  const [
    isApplyingCoupon,
    setIsApplyingCoupon,
  ] = useState(false);

  /* ============================================================
     GENERAL
     ============================================================ */

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /* ============================================================
     CLASSIFY PRODUCTS
     ============================================================ */

  const variantItems = useMemo(() => {
    return items.filter(
      (item) =>
        getActiveVariants(item).length > 0
    );
  }, [items]);

  const regularItems = useMemo(() => {
    return items.filter(
      (item) =>
        getActiveVariants(item).length === 0
    );
  }, [items]);

  /* ============================================================
     SELECTED VARIANTS FOR PRODUCT UI

     Keeps the presentation layer aligned with the
     variant selection rules without changing the
     order payload or stock logic.
     ============================================================ */

  const selectedOrderItemsForProduct = (
    item: CartItem,
    variants: CartVariant[],
    selections: VariantSelection
  ) => {
    const productSelections =
      selections[item.productId] || {};

    return variants
      .map((variant) => {
        const quantity = Math.max(
          0,
          Number(
            productSelections[variant.id] ||
              0
          )
        );

        if (quantity <= 0) {
          return null;
        }

        const unitPrice =
          variant.price !== null
            ? Number(variant.price)
            : Number(item.unitPrice || 0);

        return {
          variant,
          quantity,
          unitPrice,
        };
      })
      .filter(
        (entry): entry is {
          variant: CartVariant;
          quantity: number;
          unitPrice: number;
        } => entry !== null
      );
  };

  /* ============================================================
     SELECTED ORDER ITEMS

     Variant product:
       Product A
         Variant 1 × 2
         Variant 2 × 3

     becomes:

       [
         {
           productId: A,
           variantId: 1,
           quantity: 2
         },
         {
           productId: A,
           variantId: 2,
           quantity: 3
         }
       ]

     Normal product:

       {
         productId: B,
         variantId: null,
         quantity: 2
       }
     ============================================================ */

  const selectedOrderItems =
    useMemo<OrderItemPayload[]>(() => {
      const result: OrderItemPayload[] =
        [];

      /* Normal products */
      for (const item of regularItems) {
        const quantity = Math.max(
          0,
          Number(item.quantity || 0)
        );

        if (quantity <= 0) {
          continue;
        }

        result.push({
          productId: Number(
            item.productId
          ),
          variantId: null,
          quantity,
        });
      }

      /* Variant products */
      for (const item of variantItems) {
        const selections =
          variantSelections[
            item.productId
          ] || {};

        for (const variant of getActiveVariants(
          item
        )) {
          const quantity = Math.max(
            0,
            Number(
              selections[variant.id] || 0
            )
          );

          if (quantity <= 0) {
            continue;
          }

          result.push({
            productId: Number(
              item.productId
            ),
            variantId: Number(
              variant.id
            ),
            quantity,
          });
        }
      }

      return result;
    }, [
      regularItems,
      variantItems,
      variantSelections,
    ]);

  /* ============================================================
     TOTAL ITEMS
     ============================================================ */

  const totalItems = useMemo(() => {
    return selectedOrderItems.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
  }, [selectedOrderItems]);

  /* ============================================================
     SUBTOTAL

     IMPORTANT:
     Variant price comes from variant.price.
     Normal product price comes from item.unitPrice.
     ============================================================ */

  const subtotal = useMemo(() => {
    let total = 0;

    /* Normal products */
    for (const item of regularItems) {
      total +=
        Number(item.unitPrice || 0) *
        Number(item.quantity || 0);
    }

    /* Variant products */
    for (const item of variantItems) {
      const selections =
        variantSelections[
          item.productId
        ] || {};

      for (const variant of getActiveVariants(
        item
      )) {
        const quantity = Number(
          selections[variant.id] || 0
        );

        if (quantity <= 0) {
          continue;
        }

        const unitPrice =
          variant.price !== null
            ? Number(variant.price)
            : Number(item.unitPrice || 0);

        total +=
          unitPrice * quantity;
      }
    }

    return total;
  }, [
    regularItems,
    variantItems,
    variantSelections,
  ]);

  /* ============================================================
     GRAND TOTAL
     ============================================================ */

  const grandTotal = Math.max(
    0,
    subtotal +
      deliveryCharge -
      discount
  );

  /* ============================================================
     VARIANT SELECTION STATUS

     IMPORTANT:
     Warning is checked per product.

     Product A missing selection
       → warning under Product A

     Product B selected correctly
       → no warning under Product B
     ============================================================ */

  const productVariantErrors =
    useMemo(() => {
      const errors: Record<
        number,
        boolean
      > = {};

      for (const item of variantItems) {
        const variants =
          getActiveVariants(item);

        const selections =
          variantSelections[
            item.productId
          ] || {};

        const hasSelection =
          variants.some(
            (variant) =>
              Number(
                selections[variant.id] || 0
              ) > 0
          );

        errors[item.productId] =
          !hasSelection;
      }

      return errors;
    }, [
      variantItems,
      variantSelections,
    ]);

  const hasMissingVariantSelection =
    Object.values(
      productVariantErrors
    ).some(Boolean);

  /* ============================================================
     DELIVERY CHARGE

     Use highest delivery charge among
     products in the cart.
     ============================================================ */

  useEffect(() => {
    if (items.length === 0) {
      setDeliveryCharge(0);
      return;
    }

    const charges = items.map((item) => {
      if (deliveryArea === "dhaka") {
        return Number(
          item.deliveryInsideDhaka || 0
        );
      }

      return Number(
        item.deliveryOutsideDhaka || 0
      );
    });

    setDeliveryCharge(
      Math.max(0, ...charges)
    );
  }, [
    items,
    deliveryArea,
  ]);

  /* ============================================================
     LOAD AVAILABLE COUPONS
     ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadCoupons() {
      if (
        items.length === 0 ||
        subtotal <= 0
      ) {
        setAvailableCoupons([]);
        return;
      }

      setLoadingCoupons(true);

      try {
        const results =
          await Promise.all(
            items.map(
              async (
                item
              ): Promise<
                AvailableCoupon | null
              > => {
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
                        cache:
                          "no-store",
                      }
                    );

                  if (
                    !response.ok
                  ) {
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
                      coupon.discountType ===
                      "percentage"
                        ? "percentage"
                        : "fixed",

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
                  };
                } catch {
                  return null;
                }
              }
            )
          );

        if (cancelled) {
          return;
        }

        const valid =
          results.filter(
            (
              coupon
            ): coupon is AvailableCoupon =>
              coupon !== null
          );

        const unique =
          Array.from(
            new Map(
              valid.map(
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
          unique
        );

        /* Remove applied coupon if it is no longer available */
        if (
          appliedCoupon &&
          !unique.some(
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
          setCouponCode("");
          setDiscount(0);
          setCouponMessage("");
        }
      } finally {
        if (!cancelled) {
          setLoadingCoupons(false);
        }
      }
    }

    loadCoupons();

    return () => {
      cancelled = true;
    };
  }, [
    items,
    subtotal,
    appliedCoupon,
  ]);

  /* ============================================================
     SET VARIANT QUANTITY
     ============================================================ */

  const setVariantQuantity = (
    productId: number,
    variant: CartVariant,
    nextQuantity: number
  ) => {
    const maxStock = Math.max(
      0,
      Number(
        variant.realStock || 0
      )
    );

    const quantity = Math.max(
      0,
      Math.min(
        maxStock,
        Math.floor(
          Number(nextQuantity || 0)
        )
      )
    );

    setVariantSelections(
      (current) => {
        const productSelections =
          {
            ...(current[
              productId
            ] || {}),
          };

        if (quantity <= 0) {
          delete productSelections[
            variant.id
          ];
        } else {
          productSelections[
            variant.id
          ] = quantity;
        }

        return {
          ...current,
          [productId]:
            productSelections,
        };
      }
    );

    /* Selection change invalidates coupon calculation */
    setAppliedCoupon(null);
    setCouponCode("");
    setDiscount(0);
    setCouponMessage("");
    setCouponError("");
  };

  /* ============================================================
     NORMAL PRODUCT QUANTITY
     ============================================================ */

  const increaseRegularQuantity = (
    productId: number
  ) => {
    useQuickCart
      .getState()
      .increaseQuantity(productId);

    setAppliedCoupon(null);
    setCouponCode("");
    setDiscount(0);
    setCouponMessage("");
    setCouponError("");
  };

  const decreaseRegularQuantity = (
    productId: number
  ) => {
    useQuickCart
      .getState()
      .decreaseQuantity(productId);

    setAppliedCoupon(null);
    setCouponCode("");
    setDiscount(0);
    setCouponMessage("");
    setCouponError("");
  };

  /* ============================================================
     REMOVE PRODUCT
     ============================================================ */

  const removeProduct = (
    productId: number
  ) => {
    useQuickCart
      .getState()
      .removeItem(productId);

    setVariantSelections(
      (current) => {
        const next = {
          ...current,
        };

        delete next[productId];

        return next;
      }
    );

    setAppliedCoupon(null);
    setCouponCode("");
    setDiscount(0);
    setCouponMessage("");
    setCouponError("");
  };

  /* ============================================================
     APPLY COUPON
     ============================================================ */

  const applyCoupon = async (
    code = couponCode
  ) => {
    if (isApplyingCoupon) {
      return;
    }

    const cleanCode =
      code.trim().toUpperCase();

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

    setIsApplyingCoupon(true);
    setCouponError("");
    setCouponMessage("");

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
                cleanCode,

              productId:
                matchingCoupon.productId,

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
            result.discount || 0
          ),
          subtotal
        );

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
        `✓ ${
          matchingCoupon.code
        } — ${money(
          validatedDiscount
        )} ছাড়`
      );

      setCouponError("");
    } catch {
      setDiscount(0);
      setAppliedCoupon(null);

      setCouponError(
        "কুপন যাচাই করতে সমস্যা হয়েছে"
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  /* ============================================================
     REMOVE COUPON
     ============================================================ */

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setDiscount(0);
    setCouponMessage("");
    setCouponError("");
  };

  /* ============================================================
     FORM VALIDATION
     ============================================================ */

  const validateForm = () => {
    if (hasMissingVariantSelection) {
      setErrorMessage(
        "প্রতিটি variant product থেকে অন্তত একটি variant নির্বাচন করুন।"
      );

      return false;
    }

    if (
      selectedOrderItems.length === 0
    ) {
      setErrorMessage(
        "অর্ডার করার জন্য অন্তত একটি product নির্বাচন করুন।"
      );

      return false;
    }

    if (!customerName.trim()) {
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

    if (!address.trim()) {
      setErrorMessage(
        "সম্পূর্ণ ঠিকানা লিখুন"
      );

      return false;
    }

    setErrorMessage("");

    return true;
  };

  /* ============================================================
     COMPLETE ORDER
     ============================================================ */

  const handleCompleteOrder =
    async () => {
      if (isSubmitting) {
        return;
      }

      if (!validateForm()) {
        return;
      }

      try {
        setIsSubmitting(true);

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
                customerName:
                  customerName.trim(),

                phone:
                  phone.trim(),

                district,

                address:
                  address.trim(),

                deliveryArea,

                deliveryCharge,

                couponCode:
                  appliedCoupon?.code ||
                  couponCode
                    .trim() ||
                  null,

                /*
                 * Server/database calculates
                 * the real discount.
                 */
                discount: 0,

                subtotal,

                total:
                  grandTotal,

                items:
                  selectedOrderItems,
              }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          setErrorMessage(
            result.message ||
              result.error ||
              "Order failed."
          );

          return;
        }

        const orderId =
          String(
            result.orderId || ""
          ).trim();

        if (!orderId) {
          setErrorMessage(
            "Order তৈরি হয়েছে, কিন্তু Order ID পাওয়া যায়নি।"
          );

          return;
        }

        /* Clear cart ONLY after successful order */
        clearCart();

        router.replace(
          `/order-success?order=${encodeURIComponent(
            orderId
          )}`
        );
      } catch {
        setErrorMessage(
          "Server Error"
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  /* ============================================================
     EMPTY CART
     ============================================================ */

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-3xl px-5">
          <div className="rounded-3xl bg-white p-10 text-center shadow-lg">

            <div className="mb-5 text-6xl">
              🛒
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">
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

  /* ============================================================
     PAGE
     ============================================================ */

  return (
    <main className="min-h-screen bg-gray-50 py-5 sm:py-10">
      <div className="mx-auto max-w-6xl px-3 sm:px-5">

        <h1 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-4xl">
          Quick Order
        </h1>

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr] lg:gap-8">

          {/* ==================================================
              CART PRODUCTS
          ================================================== */}

          <div className="space-y-4">

            {items.map((item) => {
              const variants =
                getActiveVariants(item);

              const isVariantProduct =
                variants.length > 0;

              const productHasError =
                Boolean(
                  productVariantErrors[
                    item.productId
                  ]
                );

              return (
                <div
                  key={item.productId}
                  className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5"
                >

                  {/* ==================================================
                      PRODUCT HEADER
                  ================================================== */}

                  <div className="flex gap-3 sm:gap-4">

                    <img
                      src={item.image}
                      alt={
                        item.productName
                      }
                      className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                    />

                    <div className="min-w-0 flex-1">

                      <h2 className="text-base font-bold sm:text-xl">
                        {
                          item.productName
                        }
                      </h2>

                      {!isVariantProduct && (
                        <p className="mt-1 text-base font-semibold text-teal-700">
                          {money(
                            item.unitPrice
                          )}
                        </p>
                      )}

                      {isVariantProduct && (
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          আপনার পছন্দের variant নির্বাচন করুন
                        </p>
                      )}

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeProduct(
                          item.productId
                        )
                      }
                      className="h-fit shrink-0 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Remove
                    </button>

                  </div>

                  {/* ==================================================
                      VARIANT PRODUCT
                  ================================================== */}

                  {isVariantProduct ? (
                    <div className="mt-4">

                      {/* ==================================================
                          VARIANT SELECTION

                          Variant cards are selection-only.
                          Quantity controls stay in the selected
                          variants list below.
                      ================================================== */}

                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                          ভ্যারিয়েশন নির্বাচন করুন
                        </h3>

                        <span className="shrink-0 text-[11px] font-medium text-gray-500">
                          একাধিক সিলেক্ট করা যাবে
                        </span>
                      </div>

                      <div className="flex gap-3 overflow-x-auto pb-2">

                        {variants.map(
                          (variant) => {
                            const quantity =
                              Number(
                                variantSelections[
                                  item.productId
                                ]?.[
                                  variant.id
                                ] || 0
                              );

                            const isSelected =
                              quantity > 0;

                            return (
                              <button
                                key={
                                  variant.id
                                }
                                type="button"
                                onClick={() =>
                                  setVariantQuantity(
                                    item.productId,
                                    variant,
                                    isSelected
                                      ? 0
                                      : 1
                                  )
                                }
                                className={`relative w-[112px] shrink-0 rounded-xl border bg-white p-2 text-left transition active:scale-[0.98] sm:w-[125px] ${
                                  isSelected
                                    ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500"
                                    : "border-gray-200 hover:border-teal-300"
                                }`}
                              >

                                {/* IMAGE */}

                                <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
                                  {variant.image ||
                                  item.image ? (
                                    <img
                                      src={
                                        variant.image ||
                                        item.image
                                      }
                                      alt={
                                        variant.variantName
                                      }
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                      No Image
                                    </div>
                                  )}
                                </div>

                                {/* SELECTED CHECK */}

                                {isSelected && (
                                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-sm">
                                    ✓
                                  </span>
                                )}

                                {/* NAME */}

                                <p className="mt-2 truncate text-xs font-bold text-gray-900">
                                  {
                                    variant.variantName
                                  }
                                </p>

                              </button>
                            );
                          }
                        )}

                      </div>

                      {/* ==================================================
                          SELECTED VARIANTS
                      ================================================== */}

                      {selectedOrderItemsForProduct(
                        item,
                        variants,
                        variantSelections
                      ).length > 0 && (
                        <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/50 p-3">

                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-gray-900">
                              নির্বাচিত ভ্যারিয়েন্ট (
                              {selectedOrderItemsForProduct(
                                item,
                                variants,
                                variantSelections
                              ).length}
                              টি)
                            </h4>
                          </div>

                          <div className="space-y-2">
                            {selectedOrderItemsForProduct(
                              item,
                              variants,
                              variantSelections
                            ).map(
                              ({
                                variant,
                                quantity,
                                unitPrice,
                              }) => (
                                <div
                                  key={
                                    variant.id
                                  }
                                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5"
                                >

                                  {/* CHECK + IMAGE */}
                                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                                    {variant.image ||
                                    item.image ? (
                                      <img
                                        src={
                                          variant.image ||
                                          item.image
                                        }
                                        alt={
                                          variant.variantName
                                        }
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-[9px] text-gray-400">
                                        No Image
                                      </div>
                                    )}

                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">
                                      ✓
                                    </span>
                                  </div>

                                  {/* NAME + PRICE */}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-gray-900 sm:text-sm">
                                      {
                                        variant.variantName
                                      }
                                    </p>

                                    <p className="mt-0.5 text-xs font-semibold text-teal-700">
                                      {money(
                                        unitPrice
                                      )}
                                    </p>
                                  </div>

                                  {/* QUANTITY */}
                                  <div className="flex shrink-0 items-center overflow-hidden rounded-lg border bg-white">
                                    <button
                                      type="button"
                                      aria-label={`Decrease ${variant.variantName} quantity`}
                                      onClick={() =>
                                        setVariantQuantity(
                                          item.productId,
                                          variant,
                                          quantity -
                                            1
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center font-bold text-gray-700 transition hover:bg-gray-50"
                                    >
                                      −
                                    </button>

                                    <span className="flex h-8 min-w-9 items-center justify-center border-x bg-gray-50 px-2 text-sm font-bold text-gray-900">
                                      {
                                        quantity
                                      }
                                    </span>

                                    <button
                                      type="button"
                                      aria-label={`Increase ${variant.variantName} quantity`}
                                      onClick={() =>
                                        setVariantQuantity(
                                          item.productId,
                                          variant,
                                          quantity +
                                            1
                                        )
                                      }
                                      disabled={
                                        quantity >=
                                        Number(
                                          variant.realStock ||
                                            0
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* REMOVE */}
                                  <button
                                    type="button"
                                    aria-label={`Remove ${variant.variantName}`}
                                    onClick={() =>
                                      setVariantQuantity(
                                        item.productId,
                                        variant,
                                        0
                                      )
                                    }
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                                  >
                                    🗑️
                                  </button>

                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* PRODUCT-SPECIFIC WARNING */}

                      {productHasError && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700">
                          ⚠️ এই প্রোডাক্টের জন্য অন্তত একটি variant নির্বাচন করুন।
                        </div>
                      )}

                    </div>
                  ) : (

                    /* ==================================================
                       NORMAL PRODUCT
                    ================================================== */

                    <div className="mt-4 flex items-center gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          decreaseRegularQuantity(
                            item.productId
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-lg font-bold transition hover:bg-gray-50"
                      >
                        −
                      </button>

                      <span className="min-w-8 text-center font-bold">
                        {
                          item.quantity
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          increaseRegularQuantity(
                            item.productId
                          )
                        }
                        disabled={
                          item.maxStock >
                            0 &&
                          item.quantity >=
                            item.maxStock
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-lg font-bold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>

                    </div>
                  )}

                </div>
              );
            })}

          </div>

          {/* ==================================================
              ORDER SUMMARY
          ================================================== */}

          <div className="h-fit rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-24">

            <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold text-gray-500">
              <span className="h-px flex-1 bg-gray-200" />

              <span>
                🇵🇸 Free Palestine
              </span>

              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <h2 className="mb-5 text-2xl font-bold">
              Order Summary
            </h2>

            {/* BASIC SUMMARY */}

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">
                <span>
                  Total Items
                </span>

                <strong>
                  {totalItems}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Subtotal
                </span>

                <strong>
                  {money(subtotal)}
                </strong>
              </div>

            </div>

            <hr className="my-5" />

            {/* ==================================================
                COUPON
            ================================================== */}

            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">

              <div className="mb-3 flex items-center justify-between">

                <div>
                  <h3 className="font-bold">
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

              {loadingCoupons ? (
                <div className="rounded-xl bg-white p-3 text-center text-sm text-gray-500">
                  কুপন খোঁজা হচ্ছে...
                </div>
              ) : availableCoupons.length >
                0 ? (
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
                        <button
                          key={
                            coupon.id
                          }
                          type="button"
                          onClick={() =>
                            applyCoupon(
                              coupon.code
                            )
                          }
                          disabled={
                            isApplyingCoupon ||
                            isApplied
                          }
                          className={`w-full rounded-xl border bg-white p-3 text-left transition ${
                            isApplied
                              ? "border-teal-500 ring-1 ring-teal-500"
                              : "border-gray-200 hover:border-teal-300"
                          } disabled:cursor-not-allowed`}
                        >

                          <div className="flex items-center justify-between gap-3">

                            <div className="min-w-0">

                              <p className="truncate text-sm font-bold">
                                {
                                  coupon.code
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-gray-500">
                                {coupon.discountType ===
                                "percentage"
                                  ? `${coupon.discountValue}% ছাড়`
                                  : `${money(
                                      coupon.discountValue
                                    )} টাকা ছাড়`}
                              </p>

                            </div>

                            <span className="shrink-0 text-xs font-bold text-teal-700">
                              {isApplied
                                ? "Applied ✓"
                                : "Apply"}
                            </span>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>
              ) : (
                <div className="rounded-xl bg-white p-3 text-center text-xs text-gray-500">
                  এই কার্টের জন্য বর্তমানে কোনো বিশেষ কুপন নেই।
                </div>
              )}

              {/* MANUAL COUPON */}

              <div className="mt-3 flex gap-2">

                <input
                  value={
                    couponCode
                  }
                  onChange={(
                    event
                  ) => {
                    setCouponCode(
                      event.target.value.toUpperCase()
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
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      applyCoupon();
                    }
                  }}
                  placeholder="Coupon code"
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
                  {
                    couponMessage
                  }
                </p>
              )}

              {couponError && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {
                    couponError
                  }
                </p>
              )}

            </div>

            <hr className="my-5" />

            {/* ==================================================
                DELIVERY
            ================================================== */}

            <div className="space-y-3">

              <h3 className="font-bold">
                🚚 Delivery
              </h3>

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setDeliveryArea(
                      "dhaka"
                    )
                  }
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    deliveryArea ===
                    "dhaka"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "bg-white"
                  }`}
                >
                  Inside Dhaka
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDeliveryArea(
                      "outside"
                    )
                  }
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    deliveryArea ===
                    "outside"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "bg-white"
                  }`}
                >
                  Outside Dhaka
                </button>

              </div>

              <div className="flex justify-between text-sm">
                <span>
                  Delivery Charge
                </span>

                <strong>
                  {money(
                    deliveryCharge
                  )}
                </strong>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm font-semibold text-teal-700">
                  <span>
                    Discount
                  </span>

                  <strong>
                    -{" "}
                    {money(
                      discount
                    )}
                  </strong>
                </div>
              )}

              <div className="flex justify-between border-t pt-3 text-lg">
                <strong>
                  Grand Total
                </strong>

                <strong className="text-teal-700">
                  {money(
                    grandTotal
                  )}
                </strong>
              </div>

            </div>

            <hr className="my-5" />

            {/* ==================================================
                CUSTOMER INFORMATION
            ================================================== */}

            <div className="space-y-3">

              <h3 className="font-bold">
                Customer Information
              </h3>

              <input
                type="text"
                value={
                  customerName
                }
                onChange={(
                  event
                ) =>
                  setCustomerName(
                    event.target.value
                  )
                }
                placeholder="আপনার নাম"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />

              <input
                type="tel"
                value={phone}
                onChange={(
                  event
                ) =>
                  setPhone(
                    event.target.value
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
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />

              <select
                value={district}
                onChange={(
                  event
                ) =>
                  setDistrict(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >

                <option value="">
                  জেলা নির্বাচন করুন
                </option>

                {districts.map(
                  (districtName) => (
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
                value={address}
                onChange={(
                  event
                ) =>
                  setAddress(
                    event.target.value
                  )
                }
                placeholder="সম্পূর্ণ ঠিকানা"
                rows={4}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {
                    errorMessage
                  }
                </div>
              )}

              {/* ==================================================
                  COMPLETE ORDER
              ================================================== */}

              <button
                type="button"
                onClick={
                  handleCompleteOrder
                }
                disabled={
                  isSubmitting ||
                  hasMissingVariantSelection ||
                  selectedOrderItems.length ===
                    0
                }
                className="w-full rounded-xl bg-black py-3.5 font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "অর্ডার তৈরি হচ্ছে..."
                  : "অর্ডার কনফার্ম করুন"}
              </button>

              <p className="text-center text-[11px] text-gray-400">
                Cash on Delivery • অর্ডার নিশ্চিত করতে উপরের তথ্যগুলো দিন
              </p>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
}