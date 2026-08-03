import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    /*
    ========================================
    GET ALL ORDERS
    ========================================
    */

    const { data, error } = await supabase
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

    /*
    ========================================
    MAP DATABASE DATA TO ADMIN UI
    ========================================
    */

    const orders = (data || []).map(
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

        IMPORTANT:

        If database due_amount = 0,
        it MUST remain 0.

        We therefore do NOT use:

        order.due_amount || total

        because JavaScript treats 0
        as a false value.

        Legacy orders where due_amount
        is NULL are calculated safely
        from total - paid amount.
        ====================================
        */

        const hasStoredDueAmount =
          order.due_amount !== null &&
          order.due_amount !== undefined;

        const dueAmount =
          hasStoredDueAmount
            ? Number(
                order.due_amount
              )
            : Math.max(
                0,
                total - paidAmount
              );

        /*
        ====================================
        PAYMENT STATUS FALLBACK

        Database value is preferred.

        If an old order does not yet have
        payment_status, calculate a safe
        fallback for the Admin UI.
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