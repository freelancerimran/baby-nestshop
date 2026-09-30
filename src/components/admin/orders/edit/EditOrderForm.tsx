"use client";

import {
  useEffect,
  useState,
} from "react";

interface EditOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;

  variantId?: number | null;
  variantName?: string | null;
  variantSku?: string | null;

  /** Quantity that belonged to this order when the editor opened. */
  originalQuantity?: number;
}

interface ProductVariant {
  id: number;
  productId: string;
  variantName: string;
  sku?: string | null;
  price?: number | null;
  realStock?: number | null;
  displayStock?: number | null;
  image?: string | null;
  status?: string | null;
  sortOrder?: number | null;
}

interface EditOrderData {
  orderId: string;

  customerName: string;
  phone: string;
  district: string;
  deliveryArea: string;
  address: string;
  note?: string;

  deliveryCharge: number;
  discount: number;
  couponCode: string;

  total: number;

  paidAmount?: number;
  paymentMethod?: string;

  status: string;

  items?: EditOrderItem[];
}

interface Product {
  productId: string;
  productName: string;

  price: number;

  regularPrice?: number;

  realStock?: number;
  displayStock?: number;

  status?: string;

  slug?: string;

  image?: string;

  galleryImage1?: string;
  galleryImage2?: string;
  galleryImage3?: string;
  galleryImage4?: string;

  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;

  hasVariants?: boolean | null;
  variants?: ProductVariant[] | null;
}

const getOrderItemKey = (
  productId: string,
  variantId?: number | null
) =>
  `${String(productId).trim()}::${
    variantId == null ? "product" : String(variantId)
  }`;

const normalizeOrderItems = (
  source: any[]
): EditOrderItem[] => {
  const map = new Map<string, EditOrderItem>();

  for (const raw of source || []) {
    const productId = String(
      raw?.productId ?? raw?.product_id ?? ""
    ).trim();

    if (!productId) continue;

    const variantId =
      raw?.variantId != null
        ? Number(raw.variantId)
        : raw?.variant_id != null
          ? Number(raw.variant_id)
          : null;

    const quantity = Math.max(
      1,
      Number(raw?.quantity ?? 1) || 1
    );

    const unitPrice = Math.max(
      0,
      Number(
        raw?.unitPrice ?? raw?.unit_price ?? 0
      ) || 0
    );

    const key = getOrderItemKey(
      productId,
      variantId
    );

    const existing = map.get(key);

    if (existing) {
      existing.quantity += quantity;
      existing.originalQuantity =
        Number(existing.originalQuantity ?? 0) +
        quantity;
      existing.lineTotal =
        Number(existing.unitPrice || 0) *
        existing.quantity;
      continue;
    }

    map.set(key, {
      productId,
      productName:
        raw?.productName ??
        raw?.product_name ??
        "",
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      variantId,
      variantName:
        raw?.variantName ??
        raw?.variant_name ??
        null,
      variantSku:
        raw?.variantSku ??
        raw?.variant_sku ??
        null,
      originalQuantity: quantity,
    });
  }

  return Array.from(map.values());
};

interface Props {
  order: EditOrderData;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditOrderForm({
  order,
  onClose,
  onSaved,
}: Props) {
  /*
  ========================================
  CUSTOMER
  ========================================
  */

  const [
    customerName,
    setCustomerName,
  ] = useState(
    order.customerName || ""
  );

  const [
    phone,
    setPhone,
  ] = useState(
    order.phone || ""
  );

  const [
    district,
    setDistrict,
  ] = useState(
    order.district || ""
  );

  const [
    address,
    setAddress,
  ] = useState(
    order.address || ""
  );

  const [
    note,
    setNote,
  ] = useState(
    order.note || ""
  );

  /*
  ========================================
  ORDER ITEMS
  ========================================
  */

  const initialItems: EditOrderItem[] =
    normalizeOrderItems(
      Array.isArray(order.items)
        ? order.items
        : []
    );

  const [
    items,
    setItems,
  ] = useState<
    EditOrderItem[]
  >(initialItems);

  /*
  ========================================
  LOAD FRESH ORDER ITEMS
  ========================================

  The Orders table may contain a lightweight
  order snapshot without variant fields.
  Edit Order therefore fetches the authoritative
  order detail here so variantId/name/SKU are
  always available before editing.
  ========================================
  */

  useEffect(() => {
    let active = true;

    const loadOrderItems = async () => {
      try {
        const response = await fetch(
          `/api/admin/orders/${encodeURIComponent(
            order.orderId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data?.success ||
          !Array.isArray(data.items)
        ) {
          return;
        }

        if (!active || data.items.length === 0) {
          return;
        }

        const freshItems =
          normalizeOrderItems(
            data.items
          );

        setItems(freshItems);
      } catch (error) {
        console.error(
          "Load edit order details error:",
          error
        );
      }
    };

    loadOrderItems();

    return () => {
      active = false;
    };
  }, [order.orderId]);

  /*
  ========================================
  PRODUCTS
  ========================================
  */

  const [
    products,
    setProducts,
  ] = useState<Product[]>(
    []
  );

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(false);

  const [
    productSearch,
    setProductSearch,
  ] = useState("");

  const [
    showProductSelector,
    setShowProductSelector,
  ] = useState(false);

  const [
    variantProduct,
    setVariantProduct,
  ] = useState<Product | null>(null);

  const [
    variantModalOpen,
    setVariantModalOpen,
  ] = useState(false);

  /*
  ========================================
  FINANCIAL
  ========================================
  */

  const [
    deliveryCharge,
    setDeliveryCharge,
  ] = useState(
    String(
      order.deliveryCharge || 0
    )
  );

  const [
    manualDiscount,
    setManualDiscount,
  ] = useState(
    "0"
  );

  const [
    couponCode,
    setCouponCode,
  ] = useState(
    order.couponCode || ""
  );

  const [
    paidAmount,
    setPaidAmount,
  ] = useState(
    String(
      order.paidAmount || 0
    )
  );

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState(
    order.paymentMethod || ""
  );

  const [
    orderStatus,
    setOrderStatus,
  ] = useState(
    order.status || "Pending"
  );

  /*
  ========================================
  UI STATE
  ========================================
  */

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    loadingError,
    setLoadingError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  /*
  ========================================
  LOAD PRODUCTS
  ========================================
  */

  useEffect(() => {
    let active = true;

    const loadProducts =
      async () => {
        try {
          setProductsLoading(
            true
          );

          setLoadingError(
            ""
          );

          const response =
            await fetch(
              "/api/admin/products",
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
                data.message ||
                "Failed to load products."
            );
          }

          if (!active) {
            return;
          }

          /*
          ====================================
          API ALREADY RETURNS CAMELCASE
          ====================================
          */

          const productList =
            Array.isArray(
              data.products
            )
              ? data.products.map(
                  (
                    product: any
                  ) => ({
                    productId:
                      String(
                        product.productId ??
                          ""
                      ),

                    productName:
                      String(
                        product.productName ??
                          ""
                      ),

                    price:
                      Number(
                        product.price ??
                          0
                      ),

                    regularPrice:
                      Number(
                        product.regularPrice ??
                          0
                      ),

                    realStock:
                      Number(
                        product.realStock ??
                          0
                      ),

                    displayStock:
                      Number(
                        product.displayStock ??
                          0
                      ),

                    status:
                      product.status,

                    slug:
                      product.slug,

                    image:
                      product.image ||
                      "",

                    galleryImage1:
                      product.galleryImage1 ||
                      "",

                    galleryImage2:
                      product.galleryImage2 ||
                      "",

                    galleryImage3:
                      product.galleryImage3 ||
                      "",

                    galleryImage4:
                      product.galleryImage4 ||
                      "",

                    featured:
                      Boolean(
                        product.featured
                      ),

                    bestSeller:
                      Boolean(
                        product.bestSeller
                      ),

                    newArrival:
                      Boolean(
                        product.newArrival
                      ),

                    hasVariants:
                      Boolean(
                        product.hasVariants
                      ),

                    variants:
                      Array.isArray(
                        product.variants
                      )
                        ? product.variants.map(
                            (variant: any) => ({
                              id: Number(
                                variant.id ??
                                  variant.variantId ??
                                  0
                              ),
                              productId:
                                String(
                                  variant.productId ??
                                    product.productId ??
                                    ""
                                ),
                              variantName:
                                String(
                                  variant.variantName ??
                                    ""
                                ),
                              sku:
                                variant.sku ??
                                null,
                              price:
                                variant.price != null
                                  ? Number(variant.price)
                                  : null,
                              realStock:
                                variant.realStock != null
                                  ? Number(variant.realStock)
                                  : 0,
                              displayStock:
                                variant.displayStock != null
                                  ? Number(variant.displayStock)
                                  : 0,
                              image:
                                variant.image ||
                                null,
                              status:
                                variant.status ??
                                null,
                              sortOrder:
                                variant.sortOrder != null
                                  ? Number(variant.sortOrder)
                                  : 0,
                            })
                          )
                        : [],
                  })
                )
              : [];

          setProducts(
            productList
          );
        } catch (error) {
          console.error(
            "Load products error:",
            error
          );

          if (active) {
            setLoadingError(
              error instanceof Error
                ? error.message
                : "Failed to load products."
            );
          }
        } finally {
          if (active) {
            setProductsLoading(
              false
            );
          }
        }
      };

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  /*
  ========================================
  CALCULATIONS
  ========================================
  */

  const subtotal =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.unitPrice || 0
        ) *
          Number(
            item.quantity || 0
          ),
      0
    );

  const delivery =
    Math.max(
      0,
      Number(
        deliveryCharge || 0
      )
    );

  const discount =
    Math.max(
      0,
      Number(
        manualDiscount || 0
      )
    );

  const estimatedTotal =
    Math.max(
      0,
      subtotal +
        delivery -
        discount
    );

  /*
  ========================================
  VARIANT HELPERS
  ========================================
  */

  const getActiveVariants = (
    product: Product
  ) =>
    (product.variants || []).filter(
      (variant) =>
        String(
          variant.status || "Active"
        ).toLowerCase() === "active" &&
        Number(
          variant.realStock ?? 0
        ) > 0
    );

  const isSameItem = (
    item: EditOrderItem,
    productId: string,
    variantId?: number | null
  ) =>
    String(item.productId) === productId &&
    (item.variantId ?? null) ===
      (variantId ?? null);

  const getCurrentRealStock = (
    item: EditOrderItem
  ) => {
    const product = products.find(
      (candidate) =>
        String(candidate.productId) ===
        String(item.productId)
    );

    if (!product) return 0;

    if (item.variantId != null) {
      const variant = (
        product.variants || []
      ).find(
        (candidate) =>
          Number(candidate.id) ===
          Number(item.variantId)
      );

      return Math.max(
        0,
        Number(variant?.realStock ?? 0)
      );
    }

    return Math.max(
      0,
      Number(product.realStock ?? 0)
    );
  };

  const getMaxEditableQuantity = (
    item: EditOrderItem
  ) =>
    Math.max(
      1,
      Number(item.originalQuantity ?? 0) +
        getCurrentRealStock(item)
    );

  const isVariantAlreadyAdded = (
    productId: string,
    variantId: number
  ) =>
    items.some(
      (item) =>
        isSameItem(
          item,
          productId,
          variantId
        )
    );

  /*
  ========================================
  ADD PRODUCT
  ========================================
  */

  const handleAddProduct = (
    product: Product,
    variant?: ProductVariant
  ) => {
    const productId =
      String(
        product.productId || ""
      ).trim();

    if (!productId) {
      setMessage(
        "❌ Product ID is missing."
      );

      return;
    }

    const variantId =
      variant?.id != null
        ? Number(variant.id)
        : null;

    /*
    ====================================
    PREVENT DUPLICATE PRODUCT / VARIANT
    ====================================
    */

    const alreadyAdded =
      items.some(
        (item) =>
          isSameItem(
            item,
            productId,
            variantId
          )
      );

    if (alreadyAdded) {
      return;
    }

    /*
    ====================================
    STOCK CHECK
    ====================================
    */

    const availableStock =
      variant
        ? Number(
            variant.realStock ?? 0
          )
        : Number(
            product.realStock ?? 0
          );

    if (
      availableStock <= 0
    ) {
      setMessage(
        variant
          ? "❌ This variant is currently out of stock."
          : "❌ This product is currently out of stock."
      );

      return;
    }

    const price =
      variant?.price != null
        ? Number(variant.price)
        : Number(
            product.price || 0
          );

    const newItem: EditOrderItem =
      {
        productId,

        productName:
          product.productName ||
          "Unnamed Product",

        quantity: 1,

        unitPrice:
          price,

        lineTotal:
          price,

        variantId,

        variantName:
          variant?.variantName ||
          null,

        variantSku:
          variant?.sku ||
          null,

        originalQuantity: 0,
      };

    setItems(
      (current) => [
        ...current,
        newItem,
      ]
    );

    setProductSearch("");
    setShowProductSelector(false);
    setVariantModalOpen(false);
    setVariantProduct(null);
    setMessage("");
  };

  const handleProductClick = (
    product: Product
  ) => {
    const activeVariants =
      getActiveVariants(product);

    if (activeVariants.length > 0) {
      setVariantProduct(product);
      setVariantModalOpen(true);
      return;
    }

    handleAddProduct(product);
  };

  /*
  ========================================
  QUANTITY CHANGE
  ========================================
  */

  const handleQuantityChange =
    (
      productId: string,
      quantity: number,
      variantId?: number | null
    ) => {
      setItems((current) =>
        current.map((item) => {
          if (
            !isSameItem(
              item,
              productId,
              variantId
            )
          ) {
            return item;
          }

          const maxQuantity =
            getMaxEditableQuantity(item);

          const requested = Number(quantity);
          const safeRequested =
            Number.isFinite(requested)
              ? Math.floor(requested)
              : 1;

          const nextQuantity = Math.min(
            maxQuantity,
            Math.max(1, safeRequested)
          );

          return {
            ...item,
            quantity: nextQuantity,
            lineTotal:
              Number(item.unitPrice || 0) *
              nextQuantity,
          };
        })
      );
    };

  /*
  ========================================
  PRICE CHANGE
  ========================================
  */

  const handlePriceChange =
    (
      productId: string,
      price: number,
      variantId?: number | null
    ) => {
      const nextPrice =
        Math.max(
          0,
          Number(price) || 0
        );

      setItems(
        (current) =>
          current.map(
            (item) =>
              isSameItem(
                item,
                productId,
                variantId
              )
                ? {
                    ...item,

                    unitPrice:
                      nextPrice,

                    lineTotal:
                      nextPrice *
                      Number(
                        item.quantity ||
                          0
                      ),
                  }
                : item
          )
      );
    };

  /*
  ========================================
  REMOVE PRODUCT
  ========================================
  */

  const handleRemoveProduct =
    (
      productId: string,
      variantId?: number | null
    ) => {
      setItems(
        (current) =>
          current.filter(
            (item) =>
              !isSameItem(
                item,
                productId,
                variantId
              )
          )
      );
    };

  /*
  ========================================
  SAVE ORDER
  ========================================
  */

  const handleSave =
    async () => {
      /*
      ====================================
      VALIDATION
      ====================================
      */

      if (
        !customerName.trim()
      ) {
        setMessage(
          "❌ Customer name is required."
        );

        return;
      }

      if (
        !phone.trim()
      ) {
        setMessage(
          "❌ Phone number is required."
        );

        return;
      }

      if (
        items.length === 0
      ) {
        setMessage(
          "❌ At least one product is required."
        );

        return;
      }

      for (
        const item of items
      ) {
        if (
          !item.productId
        ) {
          setMessage(
            "❌ Invalid product in order."
          );

          return;
        }

        if (
          Number(
            item.quantity
          ) <= 0
        ) {
          setMessage(
            "❌ Product quantity must be at least 1."
          );

          return;
        }

        const maxQuantity =
          getMaxEditableQuantity(item);

        if (
          Number(item.quantity) >
          maxQuantity
        ) {
          setMessage(
            `❌ Maximum quantity for ${
              item.variantName ||
              item.productName ||
              "this product"
            } is ${maxQuantity}.`
          );

          return;
        }

        if (
          Number(
            item.unitPrice
          ) < 0
        ) {
          setMessage(
            "❌ Product price cannot be negative."
          );

          return;
        }
      }

      const parsedDelivery =
        Math.max(
          0,
          Number(
            deliveryCharge
          ) || 0
        );

      const parsedDiscount =
        Math.max(
          0,
          Number(
            manualDiscount
          ) || 0
        );

      const parsedPaid =
        Math.max(
          0,
          Number(
            paidAmount
          ) || 0
        );

      if (
        !Number.isFinite(
          parsedPaid
        )
      ) {
        setMessage(
          "❌ Invalid paid amount."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setMessage("");

        /*
        ==================================
        PATCH ORDER
        ==================================
        */

        const response =
          await fetch(
            `/api/admin/orders/${encodeURIComponent(
              order.orderId
            )}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  customerName:
                    customerName.trim(),

                  phone:
                    phone.trim(),

                  district:
                    district.trim(),

                  address:
                    address.trim(),

                  note:
                    note.trim(),

                  deliveryCharge:
                    parsedDelivery,

                  manualDiscount:
                    parsedDiscount,

                  couponCode:
                    couponCode.trim(),

                  paidAmount:
                    parsedPaid,

                  paymentMethod:
                    paymentMethod.trim(),

                  orderStatus:
                    orderStatus,

                  items:
                    items.map(
                      (
                        item
                      ) => ({
                        productId:
                          String(
                            item.productId
                          ),

                        quantity:
                          Number(
                            item.quantity
                          ),

                        unitPrice:
                          Number(
                            item.unitPrice
                          ),

                        variantId:
                          item.variantId ??
                          null,

                        variantName:
                          item.variantName ??
                          null,

                        variantSku:
                          item.variantSku ??
                          null,
                      })
                    ),
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          setMessage(
            `❌ ${
              data.error ||
              data.message ||
              "Order update failed."
            }`
          );

          return;
        }

        setMessage(
          "✅ Order updated successfully."
        );

        if (onSaved) {
          onSaved();
        }

        setTimeout(
          () => {
            onClose();
          },
          700
        );
      } catch (error) {
        console.error(
          "Save order error:",
          error
        );

        setMessage(
          "❌ Failed to update order."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /*
  ========================================
  PRODUCT SEARCH
  ========================================
  */

  const filteredProducts =
    products.filter(
      (product) => {
        const search =
          productSearch
            .trim()
            .toLowerCase();

        if (!search) {
          return true;
        }

        return (
          product.productName
            ?.toLowerCase()
            .includes(search) ||
          String(
            product.productId
          )
            .toLowerCase()
            .includes(search)
        );
      }
    );

  /*
  ========================================
  RENDER
  ========================================
  */

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* =================================
            HEADER
        ================================= */}

        <div className="flex items-center justify-between border-b px-6 py-4">

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Edit Order
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {order.orderId}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="rounded-lg bg-gray-100 px-3 py-2 text-lg hover:bg-gray-200 disabled:opacity-50"
          >
            ✕
          </button>

        </div>

        {/* =================================
            BODY
        ================================= */}

        <div className="overflow-y-auto p-6">

          <div className="space-y-6">

            {/* =================================
                MESSAGE
            ================================= */}

            {message && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  message.startsWith(
                    "✅"
                  )
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {loadingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {loadingError}
              </div>
            )}

            {/* =================================
                CUSTOMER INFORMATION
            ================================= */}

            <section>

              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Customer Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>

                  <input
                    value={
                      customerName
                    }
                    onChange={(
                      e
                    ) =>
                      setCustomerName(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone
                  </label>

                  <input
                    value={
                      phone
                    }
                    onChange={(
                      e
                    ) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    District
                  </label>

                  <input
                    value={
                      district
                    }
                    onChange={(
                      e
                    ) =>
                      setDistrict(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Address
                  </label>

                  <input
                    value={
                      address
                    }
                    onChange={(
                      e
                    ) =>
                      setAddress(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Note
                  </label>

                  <textarea
                    value={
                      note
                    }
                    onChange={(
                      e
                    ) =>
                      setNote(
                        e.target.value
                      )
                    }
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

              </div>

            </section>

            {/* =================================
                PRODUCTS
            ================================= */}

            <section>

              <div className="mb-4 flex items-center justify-between">

                <h3 className="text-lg font-bold text-gray-900">
                  Products
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setShowProductSelector(
                      true
                    )
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  + Add Product
                </button>

              </div>

              <div className="overflow-hidden rounded-xl border">

                <div className="grid grid-cols-[1fr_90px_120px_120px_80px] gap-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">

                  <div>
                    Product
                  </div>

                  <div className="text-center">
                    Qty
                  </div>

                  <div className="text-right">
                    Unit Price
                  </div>

                  <div className="text-right">
                    Total
                  </div>

                  <div />

                </div>

                {items.map(
                  (
                    item
                  ) => (
                    <div
                      key={getOrderItemKey(
                        item.productId,
                        item.variantId
                      )}
                      className="grid grid-cols-[1fr_90px_120px_120px_80px] items-center gap-3 border-t px-4 py-4"
                    >

                      <div>
                        <div className="font-medium text-gray-900">
                          {
                            item.productName ||
                              "Unnamed Product"
                          }
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          ID:{" "}
                          {
                            item.productId ||
                              "N/A"
                          }
                        </div>

                        {item.variantId != null && (
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            {item.variantName && (
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                                {item.variantName}
                              </span>
                            )}

                            {item.variantSku && (
                              <span className="text-gray-500">
                                SKU: {item.variantSku}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
                          max={
                            getMaxEditableQuantity(
                              item
                            )
                          }
                          value={
                            item.quantity
                          }
                          onChange={(
                            e
                          ) =>
                            handleQuantityChange(
                              item.productId,
                              Number(
                                e.target.value
                              ),
                              item.variantId
                            )
                          }
                          className="w-full rounded-lg border px-2 py-2 text-center outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            item.unitPrice
                          }
                          onChange={(
                            e
                          ) =>
                            handlePriceChange(
                              item.productId,
                              Number(
                                e.target.value
                              ),
                              item.variantId
                            )
                          }
                          className="w-full rounded-lg border px-2 py-2 text-right outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="text-right font-semibold">
                        ৳{" "}
                        {(
                          Number(
                            item.unitPrice ||
                              0
                          ) *
                          Number(
                            item.quantity ||
                              0
                          )
                        ).toLocaleString()}
                      </div>

                      <div className="text-right">

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveProduct(
                              item.productId,
                              item.variantId
                            )
                          }
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                        >
                          Remove
                        </button>

                      </div>

                    </div>
                  )
                )}

                {items.length ===
                  0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No products added yet.
                  </div>
                )}

                <div className="flex justify-between border-t bg-gray-50 px-4 py-3 font-bold">

                  <span>
                    Subtotal
                  </span>

                  <span>
                    ৳{" "}
                    {subtotal.toLocaleString()}
                  </span>

                </div>

              </div>

            </section>

            {/* =================================
                FINANCIAL INFORMATION
            ================================= */}

            <section>

              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Order & Payment
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Delivery Charge
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      deliveryCharge
                    }
                    onChange={(
                      e
                    ) =>
                      setDeliveryCharge(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Manual Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      manualDiscount
                    }
                    onChange={(
                      e
                    ) =>
                      setManualDiscount(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Coupon Code
                  </label>

                  <input
                    value={
                      couponCode
                    }
                    onChange={(
                      e
                    ) =>
                      setCouponCode(
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    className="w-full rounded-lg border px-3 py-2 uppercase outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      paidAmount
                    }
                    onChange={(
                      e
                    ) =>
                      setPaidAmount(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(
                      e
                    ) =>
                      setPaymentMethod(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border bg-white px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Select Method
                    </option>

                    <option value="COD">
                      COD
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="bKash">
                      bKash
                    </option>

                    <option value="Nagad">
                      Nagad
                    </option>

                    <option value="Bank">
                      Bank
                    </option>

                    <option value="Card">
                      Card
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Order Status
                  </label>

                  <select
                    value={
                      orderStatus
                    }
                    onChange={(
                      e
                    ) =>
                      setOrderStatus(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border bg-white px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Processing">
                      Processing
                    </option>

                    <option value="Delivered">
                      Delivered
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>

              </div>

            </section>

            {/* =================================
                SUMMARY
            ================================= */}

            <section>

              <div className="rounded-xl border bg-gray-50 p-5">

                <div className="space-y-3">

                  <div className="flex justify-between">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      ৳{" "}
                      {subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>
                      Delivery
                    </span>

                    <span>
                      ৳{" "}
                      {delivery.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-green-700">
                    <span>
                      Manual Discount
                    </span>

                    <span>
                      - ৳{" "}
                      {discount.toLocaleString()}
                    </span>
                  </div>

                  <hr />

                  <div className="flex justify-between text-xl font-bold">
                    <span>
                      Estimated Total
                    </span>

                    <span>
                      ৳{" "}
                      {estimatedTotal.toLocaleString()}
                    </span>
                  </div>

                </div>

              </div>

            </section>

          </div>

        </div>

        {/* =================================
            FOOTER
        ================================= */}

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="rounded-lg border bg-white px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={
              saving
            }
            className="rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </div>

      {/* =================================
          PRODUCT SELECTOR
      ================================= */}

      {showProductSelector && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">

          <div className="flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b px-5 py-4">

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Add Product
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Select an available product to add to this order.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowProductSelector(
                    false
                  )
                }
                className="rounded-lg bg-gray-100 px-3 py-2 text-lg hover:bg-gray-200"
              >
                Close
              </button>

            </div>

            {/* SEARCH */}

            <div className="border-b p-5">

              <input
                value={
                  productSearch
                }
                onChange={(
                  e
                ) =>
                  setProductSearch(
                    e.target.value
                  )
                }
                placeholder="Search product by name or ID..."
                autoFocus
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* PRODUCT LIST */}

            <div className="overflow-y-auto p-5">

              {productsLoading ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading products...
                </div>
              ) : filteredProducts.length ===
                0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No products found.
                </div>
              ) : (
                <div className="space-y-3">

                  {filteredProducts.map(
                    (
                      product
                    ) => {
                      const productId =
                        String(
                          product.productId ||
                            ""
                        );

                      const activeVariants =
                        getActiveVariants(
                          product
                        );

                      const hasAvailableVariants =
                        activeVariants.length >
                        0;

                      const isVariantProduct =
                        hasAvailableVariants ||
                        Boolean(
                          product.hasVariants
                        );

                      const alreadyAdded =
                        !isVariantProduct &&
                        items.some(
                          (item) =>
                            isSameItem(
                              item,
                              productId,
                              null
                            )
                        );

                      const realStock =
                        Number(
                          product.realStock ??
                            0
                        );

                      const variantRealStock =
                        activeVariants.reduce(
                          (total, variant) =>
                            total +
                            Number(
                              variant.realStock ??
                                0
                            ),
                          0
                        );

                      const isAvailable =
                        isVariantProduct
                          ? hasAvailableVariants
                          : !alreadyAdded &&
                            realStock > 0;

                      const image =
                        product.image ||
                        product.galleryImage1 ||
                        "";

                      return (
                        <div
                          key={
                            productId
                          }
                          className={`flex items-center gap-4 rounded-xl border p-3 transition ${
                            alreadyAdded
                              ? "border-gray-200 bg-gray-50 opacity-70"
                              : !isAvailable
                                ? "border-red-100 bg-red-50/30 opacity-60"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                          }`}
                        >

                          {/* PRODUCT IMAGE */}

                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-gray-100">

                            {image ? (
                              <img
                                src={
                                  image
                                }
                                alt={
                                  product.productName ||
                                  "Product"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                No Image
                              </div>
                            )}

                          </div>

                          {/* PRODUCT INFO */}

                          <div className="min-w-0 flex-1">

                            <div className="truncate text-base font-semibold text-gray-900">
                              {
                                product.productName ||
                                  "Unnamed Product"
                              }
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">

                              <span className="font-semibold text-gray-900">
                                ৳{" "}
                                {Number(
                                  product.price ||
                                    0
                                ).toLocaleString()}
                              </span>

                              <span className="text-gray-400">
                                •
                              </span>

                              <span className="text-gray-500">
                                ID:{" "}
                                {
                                  productId ||
                                    "N/A"
                                }
                              </span>

                              {isVariantProduct && (
                                <>
                                  <span className="text-gray-400">
                                    •
                                  </span>

                                  <span className="font-medium text-blue-600">
                                    {activeVariants.length} variant{
                                      activeVariants.length === 1
                                        ? ""
                                        : "s"
                                    }
                                  </span>
                                </>
                              )}

                            </div>

                            <div className="mt-1 text-xs">

                              {isVariantProduct ? (
                                hasAvailableVariants ? (
                                  <span className="font-medium text-green-600">
                                    {activeVariants.length} variant{
                                      activeVariants.length === 1
                                        ? ""
                                        : "s"
                                    } available • {variantRealStock} real stock
                                  </span>
                                ) : (
                                  <span className="font-medium text-red-600">
                                    All variants are out of stock
                                  </span>
                                )
                              ) : alreadyAdded ? (
                                <span className="font-medium text-gray-500">
                                  ✓ Already Added
                                </span>
                              ) : realStock >
                                0 ? (
                                <span className="font-medium text-green-600">
                                  Available •{" "}
                                  {realStock}{" "}
                                  real stock
                                </span>
                              ) : (
                                <span className="font-medium text-red-600">
                                  Out of Stock
                                </span>
                              )}

                            </div>

                          </div>

                          {/* ACTION */}

                          <div className="shrink-0">

                            {isVariantProduct ? (
                              <button
                                type="button"
                                disabled={
                                  !isAvailable
                                }
                                onClick={() =>
                                  handleProductClick(
                                    product
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                {isAvailable
                                  ? "Choose Variant"
                                  : "Unavailable"}
                              </button>
                            ) : alreadyAdded ? (
                              <div className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500">
                                ✓ Already Added
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={
                                  !isAvailable
                                }
                                onClick={() =>
                                  handleProductClick(
                                    product
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                {realStock >
                                0
                                  ? "+ Add"
                                  : "Unavailable"}
                              </button>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

          </div>

        </div>
      )}



      {/* =================================
          VARIANT SELECTOR
      ================================= */}

      {variantModalOpen && variantProduct && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">

          <div className="flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b px-5 py-4">

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Choose Variant
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  {variantProduct.productName ||
                    "Product"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setVariantModalOpen(false);
                  setVariantProduct(null);
                }}
                className="rounded-lg bg-gray-100 px-3 py-2 text-lg hover:bg-gray-200"
              >
                Close
              </button>

            </div>

            <div className="overflow-y-auto p-5">

              <div className="space-y-3">

                {getActiveVariants(variantProduct).map(
                  (variant) => {
                    const alreadyAdded =
                      isVariantAlreadyAdded(
                        variantProduct.productId,
                        variant.id
                      );

                    const image =
                      variant.image ||
                      variantProduct.image ||
                      variantProduct.galleryImage1 ||
                      "";

                    return (
                      <div
                        key={variant.id}
                        className={`flex items-center gap-4 rounded-xl border p-3 ${
                          alreadyAdded
                            ? "border-gray-200 bg-gray-50 opacity-70"
                            : "border-gray-200 bg-white"
                        }`}
                      >

                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-gray-100">
                          {image ? (
                            <img
                              src={image}
                              alt={
                                variant.variantName ||
                                "Variant"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900">
                            {variant.variantName ||
                              "Unnamed Variant"}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span>
                              SKU: {variant.sku || "N/A"}
                            </span>

                            <span>
                              Real Stock: {
                                Number(
                                  variant.realStock ??
                                    0
                                )
                              }
                            </span>

                            <span className="font-semibold text-gray-900">
                              Tk {
                                Number(
                                  variant.price ??
                                    variantProduct.price ??
                                    0
                                ).toLocaleString()
                              }
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() =>
                            handleAddProduct(
                              variantProduct,
                              variant
                            )
                          }
                          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {alreadyAdded
                            ? "Added"
                            : "+ Add"}
                        </button>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}