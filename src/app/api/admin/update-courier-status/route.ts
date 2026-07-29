import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

import {
  processDeliveredOrder,
} from "@/lib/finance/process-delivered-order";

import {
  processCancelledOrder,
} from "@/lib/inventory/process-cancelled-order";

/*
==========================================
UPDATE SINGLE COURIER STATUS
==========================================
*/

export async function POST(
  req: NextRequest
) {
  try {
    /*
    ========================================
    GET ORDER ID
    ========================================
    */

    const { orderId } =
      await req.json();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order ID required",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    GET ORDER
    ========================================
    */

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
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
        "ORDER FETCH ERROR:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
    ========================================
    CONSIGNMENT CHECK
    ========================================
    */

    if (
      !order.consignment_id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Consignment ID not found",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    GET STATUS FROM STEADFAST
    ========================================
    */

    const response =
      await fetch(
        `https://portal.packzy.com/api/v1/status_by_cid/${order.consignment_id}`,
        {
          method: "GET",

          headers: {
            "Api-Key":
              process.env
                .STEADFAST_API_KEY!,

            "Secret-Key":
              process.env
                .STEADFAST_SECRET_KEY!,

            "Content-Type":
              "application/json",
          },

          cache: "no-store",
        }
      );

    const result =
      await response.json();

    console.log(
      "COURIER STATUS RESPONSE:",
      result
    );

    /*
    ========================================
    STEADFAST RESPONSE CHECK
    ========================================
    */

    if (
      !response.ok ||
      result.status !== 200
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Unable to fetch courier status",

          result,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    COURIER STATUS
    ========================================
    */

    const courierStatus =
      String(
        result.delivery_status ||
          "unknown"
      )
        .trim()
        .toLowerCase();

    /*
    ========================================
    ORDER STATUS MAPPING
    ========================================
    */

    let orderStatus =
      order.status ||
      "Processing";

    // -----------------------------
    // Delivered
    // -----------------------------

    if (
      courierStatus ===
        "delivered" ||
      courierStatus ===
        "delivered_approval_pending"
    ) {
      orderStatus =
        "Delivered";
    }

    // -----------------------------
    // Partial Delivered
    // -----------------------------

    if (
      courierStatus ===
        "partial_delivered" ||
      courierStatus ===
        "partial_delivered_approval_pending"
    ) {
      orderStatus =
        "Partial Delivered";
    }

    // -----------------------------
    // Cancelled
    // -----------------------------

    if (
      courierStatus ===
        "cancelled" ||
      courierStatus ===
        "cancelled_approval_pending"
    ) {
      orderStatus =
        "Cancelled";
    }

    // -----------------------------
    // Processing
    // -----------------------------

    if (
      courierStatus ===
        "pending" ||
      courierStatus ===
        "in_review" ||
      courierStatus ===
        "hold"
    ) {
      orderStatus =
        "Processing";
    }

    /*
    ========================================
    UPDATE ORDER
    ========================================

    IMPORTANT:

    Save courier_status BEFORE running
    Finance / Inventory processors.

    Both processors validate the current
    database state.
    ========================================
    */

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        courier_status:
          courierStatus,

        status:
          orderStatus,

        last_status_sync:
          new Date().toISOString(),
      })
      .eq(
        "order_id",
        orderId
      );

    if (updateError) {
      console.error(
        "ORDER STATUS UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,

          message:
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    RESULT HOLDERS
    ========================================
    */

    let financeResult:
      Awaited<
        ReturnType<
          typeof processDeliveredOrder
        >
      > | null = null;

    let stockRestoreResult:
      Awaited<
        ReturnType<
          typeof processCancelledOrder
        >
      > | null = null;

    /*
    ========================================
    DELIVERED → FINANCE AUTOMATION
    ========================================

    Only CONFIRMED:

    courier_status = delivered

    is financially realised.

    delivered_approval_pending does NOT
    process Finance yet.

    Duplicate protection is handled by
    the PostgreSQL Finance RPC.
    ========================================
    */

    if (
      courierStatus ===
      "delivered"
    ) {
      try {
        financeResult =
          await processDeliveredOrder(
            String(orderId)
          );

        console.log(
          "FINANCE PROCESS RESULT:",
          financeResult
        );
      } catch (
        financeError
      ) {
        console.error(
          "FINANCE PROCESS ERROR:",
          financeError
        );

        financeResult = {
          success: false,

          message:
            financeError instanceof Error
              ? financeError.message
              : "Finance processing failed.",
        };
      }
    }

    /*
    ========================================
    CANCELLED → STOCK RESTORE
    ========================================

    Only CONFIRMED:

    courier_status = cancelled

    restores product stock.

    cancelled_approval_pending does NOT
    restore stock yet.

    PostgreSQL RPC handles:

    - duplicate protection
    - row locking
    - real_stock restoration
    - display_stock restoration
    - product status restoration
    - stock_restored flag
    - transaction safety
    ========================================
    */

    if (
      courierStatus ===
      "cancelled"
    ) {
      try {
        stockRestoreResult =
          await processCancelledOrder(
            String(orderId)
          );

        console.log(
          "CANCELLED STOCK RESTORE RESULT:",
          stockRestoreResult
        );
      } catch (
        stockRestoreError
      ) {
        /*
        ====================================
        IMPORTANT

        Courier status has already been
        updated successfully.

        Inventory processing failure must
        not destroy that courier update.
        ====================================
        */

        console.error(
          "CANCELLED STOCK RESTORE ERROR:",
          stockRestoreError
        );

        stockRestoreResult = {
          success: false,

          message:
            stockRestoreError instanceof Error
              ? stockRestoreError.message
              : "Stock restoration failed.",
        };
      }
    }

    /*
    ========================================
    SUCCESS RESPONSE
    ========================================
    */

    return NextResponse.json({
      success: true,

      orderId:
        String(orderId),

      courierStatus,

      orderStatus,

      finance:
        financeResult,

      stockRestore:
        stockRestoreResult,
    });
  } catch (error) {
    console.error(
      "UPDATE STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}