import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import OrdersTable from "@/components/admin/OrdersTable";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getOrders() {
  try {
    const {
      data: ordersData,
      error: ordersError,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error(
        "ORDERS PAGE SUPABASE ERROR:",
        ordersError
      );

      return [];
    }

    const {
      data: orderItemsData,
      error: orderItemsError,
    } = await supabaseAdmin
      .from("order_items")
      .select(`
        id,
        order_id,
        product_id,
        product_name,
        variant_id,
        variant_name,
        variant_sku,
        quantity,
        unit_price,
        line_total
      `);

    if (orderItemsError) {
      console.error(
        "ORDERS PAGE ORDER ITEMS ERROR:",
        orderItemsError
      );
    }

    const {
      data: productsData,
      error: productsError,
    } = await supabaseAdmin
      .from("products")
      .select("product_id, image");

    if (productsError) {
      console.error(
        "ORDERS PAGE PRODUCTS ERROR:",
        productsError
      );
    }

    const productImages = new Map<
      string,
      string
    >();

    (productsData || []).forEach(
      (product) => {
        const productId = String(
          product.product_id || ""
        ).trim();

        if (productId) {
          productImages.set(
            productId,
            product.image || ""
          );
        }
      }
    );

    const itemsByOrderId =
      new Map<string, any[]>();

    (orderItemsData || []).forEach(
      (item) => {
        const orderId = String(
          item.order_id || ""
        ).trim();

        if (!orderId) {
          return;
        }

        const productId = String(
          item.product_id || ""
        ).trim();

        const existingItems =
          itemsByOrderId.get(
            orderId
          ) || [];

        existingItems.push({
          id: item.id,

          productId,

          productName:
            item.product_name ||
            "Product",

          /*
          ========================================
          VARIANT SNAPSHOT
          ========================================
          */

          variantId:
            item.variant_id != null
              ? Number(
                  item.variant_id
                )
              : null,

          variantName:
            item.variant_name ||
            null,

          variantSku:
            item.variant_sku ||
            null,

          quantity:
            Number(
              item.quantity || 0
            ),

          unitPrice:
            Number(
              item.unit_price || 0
            ),

          lineTotal:
            Number(
              item.line_total || 0
            ),

          image:
            productImages.get(
              productId
            ) || "",
        });

        itemsByOrderId.set(
          orderId,
          existingItems
        );
      }
    );

    /*
    ========================================
    NORMALIZE LEGACY SINGLE-PRODUCT ORDERS
    ========================================

    Older orders may not have a row in
    `order_items`. Those orders still keep
    their product data in `orders`.

    We convert that legacy row into the same
    `items[]` shape used by new orders so:

    - Orders table shows the product correctly
    - Quantity is correct
    - Edit Order receives the product
    - Old orders and new orders behave the same
    ========================================
    */

    const deriveLegacyQuantity = (
      order: any
    ) => {
      const storedQuantity =
        Number(
          order.quantity ?? 0
        );

      if (storedQuantity > 0) {
        return Math.max(
          1,
          Math.round(
            storedQuantity
          )
        );
      }

      const productPrice =
        Number(
          order.product_price ??
            0
        );

      const total =
        Number(
          order.total ??
            order.grand_total ??
            0
        );

      const deliveryCharge =
        Number(
          order.delivery_charge ??
            0
        );

      const discount =
        Number(
          order.discount ?? 0
        );

      /*
      For legacy orders:

        total = product price × quantity
              + delivery
              - discount

      This recovers the real quantity
      when orders.quantity is 0.
      */

      if (productPrice > 0) {
        const derived =
          (
            total -
            deliveryCharge +
            discount
          ) /
          productPrice;

        if (
          Number.isFinite(
            derived
          ) &&
          derived > 0 &&
          Math.abs(
            derived -
              Math.round(
                derived
              )
          ) < 0.01
        ) {
          return Math.max(
            1,
            Math.round(
              derived
            )
          );
        }
      }

      return 1;
    };

    return (
      ordersData || []
    ).map(
      (order) => {
        const orderId =
          String(
            order.order_id ||
              ""
          ).trim();

        const legacyProductId =
          String(
            order.product_id ||
              ""
          ).trim();

        const storedItems =
          itemsByOrderId.get(
            orderId
          ) || [];

        const normalizedItems =
          storedItems.length > 0
            ? storedItems.map(
                (item) => ({
                  ...item,

                  quantity:
                    Math.max(
                      1,
                      Number(
                        item.quantity ||
                          0
                      )
                    ),

                  unitPrice:
                    Number(
                      item.unitPrice ||
                        0
                    ),

                  lineTotal:
                    Number(
                      item.lineTotal ||
                        0
                    ) ||
                    Math.max(
                      1,
                      Number(
                        item.quantity ||
                          0
                      )
                    ) *
                      Number(
                        item.unitPrice ||
                          0
                      ),
                })
              )
            : legacyProductId
              ? [
                  {
                    id: undefined,

                    productId:
                      legacyProductId,

                    productName:
                      order.product_name ||
                      "Product",

                    /*
                    ====================================
                    LEGACY VARIANT SNAPSHOT
                    ====================================
                    */

                    variantId:
                      order.variant_id !=
                      null
                        ? Number(
                            order.variant_id
                          )
                        : null,

                    variantName:
                      order.variant_name ||
                      null,

                    variantSku:
                      order.variant_sku ||
                      null,

                    quantity:
                      deriveLegacyQuantity(
                        order
                      ),

                    unitPrice:
                      Number(
                        order.product_price ||
                          0
                      ),

                    lineTotal:
                      Number(
                        order.product_price ||
                          0
                      ) *
                      deriveLegacyQuantity(
                        order
                      ),

                    image:
                      productImages.get(
                        legacyProductId
                      ) || "",
                  },
                ]
              : [];

        const totalItems =
          normalizedItems.reduce(
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

        const fallbackQuantity =
          normalizedItems.length >
          0
            ? totalItems
            : deriveLegacyQuantity(
                order
              );

        const total =
          Number(
            order.total || 0
          );

        const paidAmount =
          Number(
            order.paid_amount ||
              0
          );

        const dueAmount =
          order.due_amount !==
            null &&
          order.due_amount !==
            undefined
            ? Number(
                order.due_amount
              )
            : Math.max(
                0,
                total -
                  paidAmount
              );

        let paymentStatus =
          order.payment_status;

        if (!paymentStatus) {
          if (
            total > 0 &&
            paidAmount >=
              total
          ) {
            paymentStatus =
              "Paid";
          } else if (
            paidAmount > 0 &&
            paidAmount <
              total
          ) {
            paymentStatus =
              "Partially Paid";
          } else {
            paymentStatus =
              "Unpaid";
          }
        }

        return {
          orderId,

          date:
            order.order_date,

          productId:
            legacyProductId,

          productName:
            order.product_name ||
            "Product",

          productSlug:
            order.product_slug ||
            "",

          productImage:
            productImages.get(
              legacyProductId
            ) || "",

          quantity:
            Number(
              order.quantity ||
                fallbackQuantity
            ),

          productPrice:
            Number(
              order.product_price ||
                0
            ),

          items:
            normalizedItems,

          totalItems,

          orderType:
            order.order_type ||
            "",

          orderSource:
            order.order_source ===
            "admin"
              ? "admin"
              : order.order_source ===
                  "website"
                ? "website"
                : undefined,

          customerName:
            order.customer_name,

          phone:
            order.phone,

          district:
            order.district,

          deliveryArea:
            order.delivery_area,

          address:
            order.address,

          deliveryCharge:
            Number(
              order.delivery_charge ||
                0
            ),

          discount:
            Number(
              order.discount || 0
            ),

          couponCode:
            order.coupon_code ||
            "",

          subtotal:
            Number(
              order.subtotal ??
                total
            ),

          grandTotal:
            Number(
              order.grand_total ??
                total
            ),

          total,

          paidAmount,

          dueAmount,

          paymentStatus,

          status:
            order.status ||
            "Pending",

          trackingCode:
            order.tracking_code ||
            "",

          consignmentId:
            order.consignment_id ||
            "",

          courierStatus:
            order.courier_status ||
            "",

          lastStatusSync:
            order.last_status_sync ||
            null,
        };
      }
    );
  } catch (error) {
    console.error(
      "ORDERS PAGE ERROR:",
      error
    );

    return [];
  }
}

export default async function OrdersPage() {
  const orders =
    await getOrders();

  return (
    <div className="space-y-6 px-3 pb-8 pt-5 sm:px-5 lg:px-6 xl:px-7">
      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage orders, payments, products and courier operations.
          </p>
        </div>

        <Link
          href="/admin/orders/create"
          aria-label="Create Order"
          className="group inline-flex h-12 items-center gap-2.5 self-start rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 px-2.5 pr-5 text-sm font-bold text-white shadow-md shadow-emerald-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200/70 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-white/30 transition-transform duration-200 group-hover:scale-105">
            <ShoppingCart
              className="h-4 w-4"
              strokeWidth={2.2}
            />
          </span>

          <span className="whitespace-nowrap">
            Create Order
          </span>
        </Link>
      </div>

      <OrdersTable
        orders={orders}
      />
    </div>
  );
}