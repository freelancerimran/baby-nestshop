import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

import {
  processCancelledOrder,
} from "@/lib/inventory/process-cancelled-order";

/*
==========================================
CANCELLATION STOCK TEST API
==========================================

DEVELOPMENT ONLY

PURPOSE:

Test the REAL cancelled-order stock
restoration system without cancelling
anything in Steadfast.

FLOW:

1. Get existing order
2. Save original local order status
3. Save original local courier status
4. Check duplicate protection
5. Temporarily set local:
   status = Cancelled
   courier_status = cancelled
6. Run REAL cancellation stock processor
7. Restore original local statuses

IMPORTANT:

This endpoint DOES NOT:

- Call Steadfast
- Cancel Steadfast consignment
- Change tracking code
- Change consignment ID

Stock restoration IS REAL:

- products.real_stock can increase
- products.display_stock can increase
- orders.stock_restored becomes true
- orders.stock_restored_at is saved

Use only for development testing.
==========================================
*/

export async function POST(
  req: NextRequest
) {
  /*
  ========================================
  VARIABLES FOR EMERGENCY RESTORE
  ========================================
  */

  let orderId = "";

  let originalOrderStatus:
    string | null = null;

  let originalCourierStatus:
    string | null = null;

  let statusTemporarilyChanged =
    false;

  try {
    /*
    ========================================
    DEVELOPMENT SAFETY
    ========================================
    */

    if (
      process.env.NODE_ENV ===
      "production"
    ) {
      return NextResponse.json(
        {
          success: false,

          testMode: true,

          message:
            "Cancellation test endpoint is disabled in production.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    GET ORDER ID
    ========================================
    */

    const body =
      await req.json();

    orderId = String(
      body.orderId || ""
    ).trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,

          testMode: true,

          message:
            "Order ID required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    GET CURRENT ORDER
    ========================================
    */

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        `
        order_id,
        product_id,
        quantity,
        status,
        courier_status,
        stock_restored,
        stock_restored_at
        `
      )
      .eq(
        "order_id",
        orderId
      )
      .single();

    if (
      orderError ||
      !order
    ) {
      console.error(
        "CANCELLATION TEST ORDER FETCH ERROR:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,

          testMode: true,

          message:
            "Order not found.",

          orderId,
        },
        {
          status: 404,
        }
      );
    }

    /*
    ========================================
    DUPLICATE SAFETY
    ========================================

    If this order already restored its
    product stock, never run it again.
    ========================================
    */

    if (
      order.stock_restored ===
      true
    ) {
      return NextResponse.json({
        success: true,

        testMode: true,

        skipped: true,

        message:
          "Order stock has already been restored.",

        orderId,

        productId:
          order.product_id,

        quantity:
          Number(
            order.quantity || 0
          ),

        stockRestored:
          true,

        stockRestoredAt:
          order.stock_restored_at,
      });
    }

    /*
    ========================================
    SAVE ORIGINAL LOCAL STATE
    ========================================
    */

    originalOrderStatus =
      order.status ?? null;

    originalCourierStatus =
      order.courier_status ?? null;

    console.log(
      "CANCELLATION TEST ORIGINAL STATE:",
      {
        orderId,

        productId:
          order.product_id,

        quantity:
          order.quantity,

        orderStatus:
          originalOrderStatus,

        courierStatus:
          originalCourierStatus,

        stockRestored:
          order.stock_restored,
      }
    );

    /*
    ========================================
    TEMPORARILY SET LOCAL CANCELLED STATUS
    ========================================

    This changes ONLY our local Supabase
    order record.

    Nothing is sent to Steadfast.
    ========================================
    */

    const {
      error:
        temporaryStatusError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        status:
          "Cancelled",

        courier_status:
          "cancelled",
      })
      .eq(
        "order_id",
        orderId
      );

    if (
      temporaryStatusError
    ) {
      console.error(
        "CANCELLATION TEST TEMP STATUS ERROR:",
        temporaryStatusError
      );

      return NextResponse.json(
        {
          success: false,

          testMode: true,

          message:
            temporaryStatusError.message,

          orderId,
        },
        {
          status: 500,
        }
      );
    }

    statusTemporarilyChanged =
      true;

    /*
    ========================================
    RUN REAL STOCK RESTORATION PROCESSOR
    ========================================
    */

    console.log(
      "CANCELLATION TEST PROCESS START:",
      orderId
    );

    const stockResult =
      await processCancelledOrder(
        orderId
      );

    console.log(
      "CANCELLATION TEST PROCESS RESULT:",
      stockResult
    );

    /*
    ========================================
    RESTORE ORIGINAL LOCAL ORDER STATE
    ========================================
    */

    const {
      error: restoreError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        status:
          originalOrderStatus ||
          "Processing",

        courier_status:
          originalCourierStatus,
      })
      .eq(
        "order_id",
        orderId
      );

    if (restoreError) {
      console.error(
        "CANCELLATION TEST STATUS RESTORE ERROR:",
        restoreError
      );

      return NextResponse.json(
        {
          success: false,

          testMode: true,

          message:
            "Cancellation test ran, but original local order status could not be restored.",

          orderId,

          stockRestore:
            stockResult,

          restoreError:
            restoreError.message,
        },
        {
          status: 500,
        }
      );
    }

    statusTemporarilyChanged =
      false;

    /*
    ========================================
    SUCCESS RESPONSE
    ========================================
    */

    return NextResponse.json({
      success:
        stockResult.success,

      testMode: true,

      orderId,

      productId:
        order.product_id,

      quantity:
        Number(
          order.quantity || 0
        ),

      originalOrderStatus,

      originalCourierStatus,

      localStatusRestored:
        true,

      stockRestore:
        stockResult,
    });
  } catch (error) {
    console.error(
      "CANCELLATION TEST API ERROR:",
      error
    );

    /*
    ========================================
    EMERGENCY LOCAL STATUS RESTORE
    ========================================
    */

    if (
      statusTemporarilyChanged &&
      orderId
    ) {
      try {
        const {
          error: restoreError,
        } = await supabaseAdmin
          .from("orders")
          .update({
            status:
              originalOrderStatus ||
              "Processing",

            courier_status:
              originalCourierStatus,
          })
          .eq(
            "order_id",
            orderId
          );

        if (restoreError) {
          console.error(
            "CANCELLATION TEST EMERGENCY RESTORE FAILED:",
            restoreError
          );
        }
      } catch (
        restoreException
      ) {
        console.error(
          "CANCELLATION TEST EMERGENCY RESTORE ERROR:",
          restoreException
        );
      }
    }

    return NextResponse.json(
      {
        success: false,

        testMode: true,

        orderId,

        message:
          error instanceof Error
            ? error.message
            : "Cancellation test failed.",
      },
      {
        status: 500,
      }
    );
  }
}