import OrdersTable from "@/components/admin/OrdersTable";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
========================================
GET ORDERS DIRECTLY FROM DATABASE
========================================
*/

async function getOrders() {
  try {
    /*
    ========================================
    GET ORDERS
    ========================================
    */

    const {
      data: ordersData,
      error: ordersError,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (ordersError) {
      console.error(
        "ORDERS PAGE SUPABASE ERROR:",
        ordersError
      );

      return [];
    }

    /*
    ========================================
    GET ORDER ITEMS
    ========================================

    Multi-product orders store their actual
    products inside order_items.
    ========================================
    */

    const {
      data: orderItemsData,
      error: orderItemsError,
    } = await supabaseAdmin
      .from("order_items")
      .select(
        `
          id,
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          line_total
        `
      );

    if (orderItemsError) {
      console.error(
        "ORDERS PAGE ORDER ITEMS ERROR:",
        orderItemsError
      );
    }

    /*
    ========================================
    GROUP ORDER ITEMS BY ORDER ID
    ========================================
    */

    const itemsByOrderId =
      new Map<string, any[]>();

    (orderItemsData || []).forEach(
      (item) => {
        const orderId =
          String(
            item.order_id || ""
          ).trim();

        if (!orderId) {
          return;
        }

        const existingItems =
          itemsByOrderId.get(
            orderId
          ) || [];

        existingItems.push({
          id: item.id,

          productId:
            String(
              item.product_id || ""
            ),

          productName:
            item.product_name ||
            "Product",

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
        });

        itemsByOrderId.set(
          orderId,
          existingItems
        );
      }
    );

    /*
    ========================================
    MAP ORDERS FOR ADMIN UI
    ========================================
    */

    return (ordersData || []).map(
      (order) => {
        /*
        ====================================
        ORDER ITEMS
        ====================================
        */

        const items =
          itemsByOrderId.get(
            order.order_id
          ) || [];

        /*
        ====================================
        TOTAL ITEMS
        ====================================
        */

        const totalItems =
          items.reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.quantity || 0
              ),
            0
          );

        /*
        ====================================
        PAYMENT VALUES
        ====================================
        */

        const total =
          Number(
            order.total || 0
          );

        const paidAmount =
          Number(
            order.paid_amount || 0
          );

        /*
        IMPORTANT:
        due_amount = 0 is valid.

        Therefore we do NOT use:
        order.due_amount || total
        */

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

        /*
        ====================================
        PAYMENT STATUS
        ====================================
        */

        let paymentStatus =
          order.payment_status;

        if (!paymentStatus) {
          if (
            total > 0 &&
            paidAmount >= total
          ) {
            paymentStatus =
              "Paid";
          } else if (
            paidAmount > 0 &&
            paidAmount < total
          ) {
            paymentStatus =
              "Partially Paid";
          } else {
            paymentStatus =
              "Unpaid";
          }
        }

        /*
        ====================================
        RETURN ORDER
        ====================================
        */

        return {
          /*
          ----------------------------------
          ORDER INFORMATION
          ----------------------------------
          */

          orderId:
            order.order_id,

          date:
            order.order_date,

          /*
          ----------------------------------
          LEGACY / SINGLE PRODUCT
          ----------------------------------
          */

          productId:
            order.product_id,

          productName:
            order.product_name,

          productSlug:
            order.product_slug,

          quantity:
            Number(
              order.quantity || 0
            ),

          productPrice:
            Number(
              order.product_price ||
                0
            ),

          /*
          ----------------------------------
          MULTI PRODUCT
          ----------------------------------
          */

          items,

          totalItems,

          orderType:
            order.order_type ||
            "",

          /*
          ----------------------------------
          CUSTOMER
          ----------------------------------
          */

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

          /*
          ----------------------------------
          PRICE
          ----------------------------------
          */

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
            order.coupon_code || "",

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

          /*
          ----------------------------------
          PAYMENT
          ----------------------------------
          */

          paidAmount,

          dueAmount,

          paymentStatus,

          /*
          ----------------------------------
          ORDER STATUS
          ----------------------------------
          */

          status:
            order.status ||
            "Pending",

          /*
          ----------------------------------
          COURIER
          ----------------------------------
          */

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

/*
========================================
ORDERS PAGE
========================================
*/

export default async function OrdersPage() {
  const orders =
    await getOrders();

  return (
    <div className="space-y-6 px-3 pb-8 pt-5 sm:px-5 lg:px-6 xl:px-7">
      {/* PAGE HEADER */}

      <div className="pt-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Orders
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage orders, payments, products
          and courier operations.
        </p>
      </div>

      {/* ORDERS */}

      <OrdersTable
        orders={orders}
      />
    </div>
  );
}