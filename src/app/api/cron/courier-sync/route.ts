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
AUTO COURIER SYNC CRON
==========================================

PURPOSE:

This endpoint is designed for automatic
courier status synchronization.

It is separate from:

/api/admin/sync-all-courier-status

So the existing manual Admin Sync button
can continue working independently.

FLOW:

Vercel Cron
    ↓
Authorization Check
    ↓
Get Courier Orders
    ↓
Steadfast Status
    ↓
Update Order
    ↓
Delivered → Finance
Cancelled → Stock Restore
==========================================
*/

/*
==========================================
GET
==========================================

Vercel Cron will call this endpoint
using GET.
==========================================
*/

export async function GET(
  req: NextRequest
) {
  try {
    /*
    ========================================
    CRON SECRET CHECK
    ========================================
    */

    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Cron secret is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      req.headers.get(
        "authorization"
      );

    if (
      authorization !==
      `Bearer ${cronSecret}`
    ) {
      console.warn(
        "UNAUTHORIZED COURIER CRON REQUEST"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
    ========================================
    GET COURIER ORDERS
    ========================================

    Only orders that have a consignment ID
    need courier synchronization.
    ========================================
    */

    const {
      data: orders,
      error: ordersError,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .not(
        "consignment_id",
        "is",
        null
      );

    if (ordersError) {
      console.error(
        "CRON ORDERS FETCH ERROR:",
        ordersError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            ordersError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    COUNTERS
    ========================================
    */

    let updatedCount = 0;

    let deliveredCount = 0;

    let financeProcessedCount = 0;
    let financeSkippedCount = 0;
    let financeFailedCount = 0;

    let cancelledCount = 0;

    let stockRestoredCount = 0;
    let stockRestoreSkippedCount = 0;
    let stockRestoreFailedCount = 0;

    let failedCount = 0;

    /*
    ========================================
    PROCESS ORDERS
    ========================================
    */

    for (
      const order of orders || []
    ) {
      try {
        /*
        ====================================
        CONSIGNMENT SAFETY
        ====================================
        */

        const consignmentId =
          String(
            order.consignment_id ||
              ""
          ).trim();

        if (!consignmentId) {
          continue;
        }

        /*
        ====================================
        GET STEADFAST STATUS
        ====================================
        */

        const response =
          await fetch(
            `https://portal.packzy.com/api/v1/status_by_cid/${consignmentId}`,
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

              cache:
                "no-store",
            }
          );

        const result =
          await response.json();

        /*
        ====================================
        STEADFAST RESPONSE CHECK
        ====================================
        */

        if (
          !response.ok ||
          result.status !== 200
        ) {
          console.error(
            "CRON STEADFAST STATUS ERROR:",
            {
              orderId:
                order.order_id,

              consignmentId,

              result,
            }
          );

          failedCount++;

          continue;
        }

        /*
        ====================================
        COURIER STATUS
        ====================================
        */

        const courierStatus =
          String(
            result.delivery_status ||
              "unknown"
          )
            .trim()
            .toLowerCase();

        /*
        ====================================
        ORDER STATUS MAPPING
        ====================================
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
        ====================================
        UPDATE LOCAL ORDER
        ====================================
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
              new Date()
                .toISOString(),
          })
          .eq(
            "order_id",
            order.order_id
          );

        if (updateError) {
          console.error(
            "CRON ORDER UPDATE ERROR:",
            {
              orderId:
                order.order_id,

              error:
                updateError,
            }
          );

          failedCount++;

          continue;
        }

        updatedCount++;

        /*
        ====================================
        CONFIRMED DELIVERED → FINANCE
        ====================================
        */

        if (
          courierStatus ===
          "delivered"
        ) {
          deliveredCount++;

          try {
            const financeResult =
              await processDeliveredOrder(
                String(
                  order.order_id
                )
              );

            console.log(
              "CRON FINANCE RESULT:",
              {
                orderId:
                  order.order_id,

                result:
                  financeResult,
              }
            );

            if (
              financeResult.success &&
              financeResult.skipped
            ) {
              financeSkippedCount++;
            } else if (
              financeResult.success
            ) {
              financeProcessedCount++;
            } else {
              financeFailedCount++;
            }
          } catch (
            financeError
          ) {
            financeFailedCount++;

            console.error(
              "CRON FINANCE ERROR:",
              {
                orderId:
                  order.order_id,

                error:
                  financeError,
              }
            );
          }
        }

        /*
        ====================================
        CONFIRMED CANCELLED → STOCK RESTORE
        ====================================
        */

        if (
          courierStatus ===
          "cancelled"
        ) {
          cancelledCount++;

          try {
            const stockResult =
              await processCancelledOrder(
                String(
                  order.order_id
                )
              );

            console.log(
              "CRON STOCK RESTORE RESULT:",
              {
                orderId:
                  order.order_id,

                result:
                  stockResult,
              }
            );

            if (
              stockResult.success &&
              stockResult.skipped
            ) {
              stockRestoreSkippedCount++;
            } else if (
              stockResult.success
            ) {
              stockRestoredCount++;
            } else {
              stockRestoreFailedCount++;
            }
          } catch (
            stockError
          ) {
            stockRestoreFailedCount++;

            console.error(
              "CRON STOCK RESTORE ERROR:",
              {
                orderId:
                  order.order_id,

                error:
                  stockError,
              }
            );
          }
        }
      } catch (error) {
        failedCount++;

        console.error(
          "CRON ORDER PROCESS ERROR:",
          {
            orderId:
              order.order_id,

            error,
          }
        );
      }
    }

    /*
    ========================================
    SUCCESS RESPONSE
    ========================================
    */

    return NextResponse.json({
      success: true,

      source:
        "courier-cron",

      totalOrders:
        orders?.length || 0,

      updatedCount,

      deliveredCount,

      financeProcessedCount,
      financeSkippedCount,
      financeFailedCount,

      cancelledCount,

      stockRestoredCount,
      stockRestoreSkippedCount,
      stockRestoreFailedCount,

      failedCount,

      syncedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "AUTO COURIER SYNC ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Automatic courier sync failed.",
      },
      {
        status: 500,
      }
    );
  }
}