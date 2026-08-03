import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

import {
  processDeliveredOrder,
} from "@/lib/finance/process-delivered-order";

/*
==========================================
FINANCE DELIVERY TEST API
==========================================

DEVELOPMENT ONLY

This route tests the REAL Finance
automation without changing Steadfast.

FLOW:

1. Get order
2. Save original local order status
3. Temporarily set local status = Delivered
4. Run real Finance processor
5. Restore original local order status

IMPORTANT:

This route DOES NOT change:

- courier_status
- consignment_id
- tracking_code
- Steadfast status

Finance changes ARE real:

- sold_quantity can increase
- finance_processed can become true
- finance_processed_at can be saved
- finance_investment_item_id can be saved

Use only during development testing.
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

  let originalStatus:
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
            "Finance test endpoint is disabled in production.",
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
        status,
        courier_status,
        finance_processed,
        finance_processed_at,
        finance_investment_item_id
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
        "FINANCE TEST ORDER FETCH ERROR:",
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

    If Finance already processed this
    order, DO NOT process it again.
    ========================================
    */

    if (
      order.finance_processed ===
      true
    ) {
      return NextResponse.json({
        success: true,

        testMode: true,

        skipped: true,

        message:
          "Order has already been processed by Finance.",

        orderId,

        financeProcessed:
          true,

        financeProcessedAt:
          order.finance_processed_at,

        investmentItemId:
          order.finance_investment_item_id,
      });
    }

    /*
    ========================================
    SAVE ORIGINAL STATUS
    ========================================
    */

    originalStatus =
      order.status ?? null;

    console.log(
      "FINANCE TEST ORIGINAL STATE:",
      {
        orderId,

        orderStatus:
          originalStatus,

        courierStatus:
          order.courier_status,

        financeProcessed:
          order.finance_processed,
      }
    );

    /*
    ========================================
    TEMPORARILY MARK LOCAL ORDER DELIVERED
    ========================================

    IMPORTANT:

    Only orders.status changes.

    courier_status remains untouched.

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
          "Delivered",
      })
      .eq(
        "order_id",
        orderId
      );

    if (
      temporaryStatusError
    ) {
      console.error(
        "FINANCE TEST TEMP STATUS ERROR:",
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
    RUN REAL FINANCE PROCESSOR
    ========================================
    */

    console.log(
      "FINANCE TEST PROCESS START:",
      orderId
    );

    const financeResult =
      await processDeliveredOrder(
        orderId
      );

    console.log(
      "FINANCE TEST PROCESS RESULT:",
      financeResult
    );

    /*
    ========================================
    RESTORE ORIGINAL LOCAL ORDER STATUS
    ========================================
    */

    const {
      error: restoreError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        status:
          originalStatus ||
          "Processing",
      })
      .eq(
        "order_id",
        orderId
      );

    if (restoreError) {
      console.error(
        "FINANCE TEST STATUS RESTORE ERROR:",
        restoreError
      );

      return NextResponse.json(
        {
          success: false,

          testMode: true,

          message:
            "Finance test ran, but original order status could not be restored.",

          orderId,

          finance:
            financeResult,

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
        financeResult.success,

      testMode: true,

      orderId,

      originalOrderStatus:
        originalStatus,

      courierStatus:
        order.courier_status,

      localStatusRestored:
        true,

      finance:
        financeResult,
    });
  } catch (error) {
    console.error(
      "FINANCE TEST API ERROR:",
      error
    );

    /*
    ========================================
    EMERGENCY STATUS RESTORE
    ========================================

    If something unexpected crashes after
    changing the local order status,
    try to restore it.
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
              originalStatus ||
              "Processing",
          })
          .eq(
            "order_id",
            orderId
          );

        if (restoreError) {
          console.error(
            "FINANCE TEST EMERGENCY RESTORE FAILED:",
            restoreError
          );
        }
      } catch (
        restoreException
      ) {
        console.error(
          "FINANCE TEST EMERGENCY RESTORE ERROR:",
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
            : "Finance test failed.",
      },
      {
        status: 500,
      }
    );
  }
}