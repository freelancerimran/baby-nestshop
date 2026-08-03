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
AUTO COURIER STATUS SYNC
==========================================

SOURCE OF TRUTH:
Steadfast controls actual courier delivery
and cancellation status.

IMPORTANT:

Warehouse / Fulfillment completion is
completely separate from customer delivery.

FINAL RULES:

Steadfast delivered
→ Order Delivered
→ Payment Paid
→ Due 0
→ Finance processing

Steadfast cancelled
→ Order Cancelled
→ Website stock restoration

Approval pending states are NOT final.

delivered_approval_pending
→ Processing
→ NO Finance

cancelled_approval_pending
→ Processing
→ NO Stock Restore
==========================================
*/

export async function GET(
  req: NextRequest
) {
  try {
    /*
    ========================================
    CRON AUTHORIZATION
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
    GET ALL ORDERS SENT TO COURIER
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
            ordersError.message ||
            "Unable to load courier orders.",
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
    PROCESS EVERY COURIER ORDER
    ========================================
    */

    for (
      const order of orders || []
    ) {
      try {
        /*
        ====================================
        VALIDATE CONSIGNMENT ID
        ====================================
        */

        const consignmentId =
          String(
            order.consignment_id || ""
          ).trim();

        if (!consignmentId) {
          continue;
        }

        /*
        ====================================
        GET REAL STATUS FROM STEADFAST
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

              cache: "no-store",
            }
          );

        const result =
          await response.json();

        /*
        ====================================
        VALIDATE STEADFAST RESPONSE
        ====================================
        */

        if (
          !response.ok ||
          Number(result?.status) !== 200
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
        NORMALIZE COURIER STATUS
        ====================================
        */

        const courierStatus =
          String(
            result?.delivery_status ||
              "unknown"
          )
            .trim()
            .toLowerCase();

        /*
        ====================================
        MAP COURIER → ORDER STATUS
        ====================================
        */

        let orderStatus =
          order.status ||
          "Processing";

        /*
        ------------------------------------
        FINAL DELIVERED
        ------------------------------------
        */

        if (
          courierStatus ===
          "delivered"
        ) {
          orderStatus =
            "Delivered";
        }

        /*
        ------------------------------------
        DELIVERY APPROVAL PENDING
        ------------------------------------
        */

        else if (
          courierStatus ===
          "delivered_approval_pending"
        ) {
          orderStatus =
            "Processing";
        }

        /*
        ------------------------------------
        PARTIAL DELIVERY
        ------------------------------------
        */

        else if (
          courierStatus ===
            "partial_delivered" ||
          courierStatus ===
            "partial_delivered_approval_pending"
        ) {
          orderStatus =
            "Partial Delivered";
        }

        /*
        ------------------------------------
        FINAL CANCELLED
        ------------------------------------
        */

        else if (
          courierStatus ===
          "cancelled"
        ) {
          orderStatus =
            "Cancelled";
        }

        /*
        ------------------------------------
        CANCELLATION APPROVAL PENDING
        ------------------------------------
        */

        else if (
          courierStatus ===
          "cancelled_approval_pending"
        ) {
          orderStatus =
            "Processing";
        }

        /*
        ------------------------------------
        ACTIVE COURIER STATES
        ------------------------------------
        */

        else if (
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
        BUILD ORDER UPDATE
        ====================================
        */

        const orderUpdate:
          Record<
            string,
            unknown
          > = {
            courier_status:
              courierStatus,

            status:
              orderStatus,

            last_status_sync:
              new Date().toISOString(),
          };

        /*
        ====================================
        FINAL DELIVERY → CUSTOMER PAID
        ====================================

        Current Baby Nest flow is COD.

        Confirmed Steadfast delivery means
        customer received the parcel and
        customer payment has been collected.

        This does NOT mean courier settlement
        to the business has necessarily
        happened yet.
        ====================================
        */

        if (
          courierStatus ===
          "delivered"
        ) {
          const orderTotal =
            Number(
              order.total || 0
            );

          orderUpdate.payment_status =
            "Paid";

          orderUpdate.paid_amount =
            orderTotal;

          orderUpdate.due_amount =
            0;
        }

        /*
        ====================================
        UPDATE ORDER FIRST
        ====================================

        Finance / Inventory processors
        validate current database state.

        Therefore courier status must be
        saved before those processors run.
        ====================================
        */

        const {
          error: updateError,
        } = await supabaseAdmin
          .from("orders")
          .update(
            orderUpdate
          )
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

              courierStatus,

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
        FINAL DELIVERED → FINANCE
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
              "CRON DELIVERED FINANCE RESULT:",
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
            }

            else if (
              financeResult.success
            ) {
              financeProcessedCount++;
            }

            else {
              financeFailedCount++;

              console.error(
                "CRON FINANCE FAILED:",
                {
                  orderId:
                    order.order_id,

                  result:
                    financeResult,
                }
              );
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
        FINAL CANCELLED → STOCK RESTORE
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
              "CRON CANCELLED STOCK RESULT:",
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
            }

            else if (
              stockResult.success
            ) {
              stockRestoredCount++;
            }

            else {
              stockRestoreFailedCount++;

              console.error(
                "CRON STOCK RESTORE FAILED:",
                {
                  orderId:
                    order.order_id,

                  result:
                    stockResult,
                }
              );
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
          "CRON SINGLE ORDER ERROR:",
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
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      source:
        "courier-cron",

      totalOrders:
        orders?.length || 0,

      updatedCount,

      failedCount,

      deliveredCount,

      financeProcessedCount,
      financeSkippedCount,
      financeFailedCount,

      cancelledCount,

      stockRestoredCount,
      stockRestoreSkippedCount,
      stockRestoreFailedCount,

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