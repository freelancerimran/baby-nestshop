import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    /*
    ========================================
    GET ALL ORDERS
    ========================================
    */

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    /*
    ========================================
    DATABASE ERROR
    ========================================
    */

    if (error) {
      console.error(
        "SUPABASE ORDERS ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          orders: [],
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const ordersData = data || [];

    /*
    ========================================
    GET ORDER ITEMS
    ========================================

    Multi-product orders store their
    individual products inside order_items.

    Admin API uses supabaseAdmin so
    RLS/permission restrictions do not
    incorrectly make Analytics empty.
    ========================================
    */

    const orderIds = ordersData
      .map((order) => order.order_id)
      .filter(Boolean);

    let orderItems: any[] = [];

    if (orderIds.length > 0) {
      const {
        data: itemsData,
        error: itemsError,
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
        )
        .in("order_id", orderIds);

      if (itemsError) {
        console.error(
          "SUPABASE ORDER ITEMS ERROR:",
          itemsError
        );

        return NextResponse.json(
          {
            success: false,
            orders: [],
            error: itemsError.message,
          },
          {
            status: 500,
          }
        );
      }

      orderItems = itemsData || [];
    }

    /*
    ========================================
    GROUP ORDER ITEMS
    ========================================
    */

    const itemsByOrderId =
      new Map<string, any[]>();

    for (const item of orderItems) {
      const existing =
        itemsByOrderId.get(
          item.order_id
        ) || [];

      existing.push({
        id: item.id,

        productId:
          item.product_id,

        productName:
          item.product_name,

        quantity: Number(
          item.quantity ?? 0
        ),

        unitPrice: Number(
          item.unit_price ?? 0
        ),

        lineTotal: Number(
          item.line_total ?? 0
        ),
      });

      itemsByOrderId.set(
        item.order_id,
        existing
      );
    }

    /*
    ========================================
    MAP DATABASE DATA TO ADMIN UI
    ========================================
    */

    const orders = ordersData.map(
      (order) => {
        /*
        ====================================
        BASIC MONEY VALUES
        ====================================
        */

        const total = Number(
          order.total ?? 0
        );

        const paidAmount = Number(
          order.paid_amount ?? 0
        );

        /*
        ====================================
        DUE AMOUNT
        ====================================
        */

        const hasStoredDueAmount =
          order.due_amount !== null &&
          order.due_amount !== undefined;

        const dueAmount =
          hasStoredDueAmount
            ? Number(order.due_amount)
            : Math.max(
                0,
                total - paidAmount
              );

        /*
        ====================================
        PAYMENT STATUS FALLBACK
        ====================================
        */

        let paymentStatus =
          order.payment_status;

        if (!paymentStatus) {
          if (
            total > 0 &&
            paidAmount >= total
          ) {
            paymentStatus = "Paid";
          } else if (
            paidAmount > 0 &&
            paidAmount < total
          ) {
            paymentStatus =
              "Partially Paid";
          } else {
            paymentStatus = "Unpaid";
          }
        }

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
          PRODUCT INFORMATION
          ----------------------------------
          */

          productId:
            order.product_id,

          productName:
            order.product_name,

          productSlug:
            order.product_slug,

          quantity: Number(
            order.quantity ?? 0
          ),

          productPrice: Number(
            order.product_price ?? 0
          ),

          /*
          ----------------------------------
          MULTI-PRODUCT ITEMS
          ----------------------------------
          */

          items,

          /*
          ----------------------------------
          CUSTOMER INFORMATION
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
          PRICE INFORMATION
          ----------------------------------
          */

          deliveryCharge: Number(
            order.delivery_charge ?? 0
          ),

          discount: Number(
            order.discount ?? 0
          ),

          couponCode:
            order.coupon_code,

          total,

          /*
          ----------------------------------
          PAYMENT INFORMATION
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
            order.status,

          /*
          ----------------------------------
          COURIER INFORMATION
          ----------------------------------
          */

          trackingCode:
            order.tracking_code,

          consignmentId:
            order.consignment_id,

          courierStatus:
            order.courier_status,

          lastStatusSync:
            order.last_status_sync,

          /*
          ----------------------------------
          FULFILLMENT INFORMATION
          ----------------------------------
          */

          fulfillmentStatus:
            order.fulfillment_status,

          pickedAt:
            order.picked_at,

          packingAt:
            order.packing_at,

          packedAt:
            order.packed_at,

          dispatchedAt:
            order.dispatched_at,

          fulfillmentUpdatedAt:
            order.fulfillment_updated_at,

          fulfillmentNote:
            order.fulfillment_note,

          /*
          ----------------------------------
          FINANCE / STOCK INFORMATION
          ----------------------------------
          */

          financeProcessed:
            Boolean(
              order.finance_processed
            ),

          financeProcessedAt:
            order.finance_processed_at,

          stockRestored:
            Boolean(
              order.stock_restored
            ),

          stockRestoredAt:
            order.stock_restored_at,

          /*
          ----------------------------------
          ORDER TOTAL INFORMATION
          ----------------------------------
          */

          orderType:
            order.order_type,

          subtotal: Number(
            order.subtotal ?? 0
          ),

          grandTotal: Number(
            order.grand_total ?? total
          ),

          totalItems: Number(
            order.total_items ??
              items.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  Number(
                    item.quantity ?? 0
                  ),
                0
              )
          ),

          /*
          ----------------------------------
          TIMESTAMPS
          ----------------------------------
          */

          createdAt:
            order.created_at,

          updatedAt:
            order.updated_at,
        };
      }
    );

    /*
    ========================================
    SUCCESS RESPONSE
    ========================================
    */

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    /*
    ========================================
    UNEXPECTED ERROR
    ========================================
    */

    console.error(
      "ORDERS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        orders: [],

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}