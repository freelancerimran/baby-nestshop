import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

import {
  hasPermission,
} from "@/lib/permissions";

import { writeAuditLog } from "@/lib/audit";

import {
  processDeliveredOrder,
} from "@/lib/finance/process-delivered-order";

import {
  processCancelledOrder,
} from "@/lib/inventory/process-cancelled-order";

/*
==========================================
SYNC ALL COURIER STATUS
==========================================

FINAL PRODUCTION FLOW

STEADFAST = source of truth for courier
delivery / cancellation status.

IMPORTANT:

Fulfillment / Warehouse workflow is
completely separate from this route.

Fulfillment:
- received
- picking
- packing
- packed
- dispatched / handover

does NOT mean customer delivery.

Only Steadfast confirmed "delivered"
means:

1. Order = Delivered
2. Payment = Paid
3. paid_amount = total
4. due_amount = 0
5. Finance processing starts

Only Steadfast confirmed "cancelled"
means:

1. Order = Cancelled
2. Website product stock is restored

Product website stock was already
deducted during order creation through
create_order_with_stock().

Finance investment sold_quantity is
different from website product stock.
It increases only after confirmed
courier delivery.
==========================================
*/

export async function POST() {
  try {
    /*
    ========================================
    1. PERMISSION CHECK
    ========================================

    Bulk courier synchronization requires:

    orders.sync_courier
    ========================================
    */

    const allowed = await hasPermission(
      "orders",
      "sync_courier"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to sync courier statuses.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    2. GET ALL ORDERS SENT TO COURIER
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
        "SYNC ORDERS FETCH ERROR:",
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
    let auditLoggedCount = 0;

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
            "STEADFAST STATUS ERROR:",
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
        MAP COURIER STATUS → ORDER STATUS
        ====================================
        */

        let orderStatus =
          order.status ||
          "Processing";

        if (
          courierStatus ===
          "delivered"
        ) {
          orderStatus =
            "Delivered";
        }

        else if (
          courierStatus ===
          "delivered_approval_pending"
        ) {
          orderStatus =
            "Processing";
        }

        else if (
          courierStatus ===
            "partial_delivered" ||
          courierStatus ===
            "partial_delivered_approval_pending"
        ) {
          orderStatus =
            "Partial Delivered";
        }

        else if (
          courierStatus ===
          "cancelled"
        ) {
          orderStatus =
            "Cancelled";
        }

        else if (
          courierStatus ===
          "cancelled_approval_pending"
        ) {
          orderStatus =
            "Processing";
        }

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
        CONFIRMED DELIVERY → PAYMENT PAID
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
        UPDATE ORDER DATABASE
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
            "SYNC ORDER UPDATE ERROR:",
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

        let financeResult:
          Awaited<ReturnType<typeof processDeliveredOrder>> | null =
          null;

        let stockRestoreResult:
          Awaited<ReturnType<typeof processCancelledOrder>> | null =
          null;

        /*
        ====================================
        CONFIRMED DELIVERED
        → FINANCE AUTOMATION
        ====================================
        */

        if (
          courierStatus ===
          "delivered"
        ) {
          deliveredCount++;

          try {
            financeResult =
              await processDeliveredOrder(
                String(
                  order.order_id
                )
              );

            console.log(
              "COURIER DELIVERED FINANCE RESULT:",
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
                "COURIER FINANCE FAILED:",
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
              "COURIER FINANCE ERROR:",
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
        CONFIRMED CANCELLED
        → WEBSITE STOCK RESTORATION
        ====================================
        */

        if (
          courierStatus ===
          "cancelled"
        ) {
          cancelledCount++;

          try {
            stockRestoreResult =
              await processCancelledOrder(
                String(
                  order.order_id
                )
              );

            console.log(
              "COURIER CANCELLED STOCK RESULT:",
              {
                orderId:
                  order.order_id,

                result:
                  stockRestoreResult,
              }
            );

            if (
              stockRestoreResult.success &&
              stockRestoreResult.skipped
            ) {
              stockRestoreSkippedCount++;
            }

            else if (
              stockRestoreResult.success
            ) {
              stockRestoredCount++;
            }

            else {
              stockRestoreFailedCount++;

              console.error(
                "COURIER STOCK RESTORE FAILED:",
                {
                  orderId:
                    order.order_id,

                  result:
                    stockRestoreResult,
                }
              );
            }
          } catch (
            stockError
          ) {
            stockRestoreFailedCount++;

            console.error(
              "COURIER STOCK RESTORE ERROR:",
              {
                orderId:
                  order.order_id,

                error:
                  stockError,
              }
            );
          }
        }

        /*
        ====================================
        AUDIT COURIER STATUS MUTATION
        ====================================
        */

        const statusChanged =
          String(order.courier_status || "")
            .trim()
            .toLowerCase() !== courierStatus ||
          String(order.status || "")
            .trim() !== orderStatus;

        const paymentChanged =
          String(order.payment_status || "")
            .trim() !==
            String(
              orderUpdate.payment_status ??
                order.payment_status ??
                ""
            ).trim() ||
          Number(order.paid_amount ?? 0) !==
            Number(
              orderUpdate.paid_amount ??
                order.paid_amount ??
                0
            ) ||
          Number(order.due_amount ?? 0) !==
            Number(
              orderUpdate.due_amount ??
                order.due_amount ??
                0
            );

        const mutationChanged =
          statusChanged || paymentChanged;

        if (mutationChanged) {
          const auditLogged = await writeAuditLog({
            action: "sync_courier_status",
            module: "orders",
            targetType: "order",
            targetId: String(order.order_id),
            description:
              `Courier status synced for order ${order.order_id}.`,
            metadata: {
              order_id: order.order_id,
              consignment_id:
                order.consignment_id ?? null,
              tracking_code:
                order.tracking_code ?? null,
              previous_courier_status:
                order.courier_status ?? null,
              new_courier_status:
                courierStatus,
              previous_order_status:
                order.status ?? null,
              new_order_status:
                orderStatus,
              previous_payment_status:
                order.payment_status ?? null,
              new_payment_status:
                orderUpdate.payment_status ??
                order.payment_status ??
                null,
              previous_paid_amount:
                Number(order.paid_amount ?? 0),
              new_paid_amount:
                Number(
                  orderUpdate.paid_amount ??
                  order.paid_amount ??
                  0
                ),
              previous_due_amount:
                Number(order.due_amount ?? 0),
              new_due_amount:
                Number(
                  orderUpdate.due_amount ??
                  order.due_amount ??
                  0
                ),
              finance_result:
                financeResult,
              stock_restore_result:
                stockRestoreResult,
            },
          });

          if (auditLogged) {
            auditLoggedCount++;
          } else {
            console.warn(
              "COURIER STATUS AUDIT LOG FAILED:",
              order.order_id
            );
          }
        }
      } catch (err) {
        failedCount++;

        console.error(
          "SYNC SINGLE ORDER ERROR:",
          {
            orderId:
              order.order_id,

            error:
              err,
          }
        );
      }
    }

    /*
    ========================================
    FINAL SUCCESS RESPONSE
    ========================================
    */

    return NextResponse.json({
      success: true,

      message:
        "Courier statuses synced successfully.",

      totalOrders:
        orders?.length || 0,

      updatedCount,

      failedCount,

      auditLoggedCount,

      deliveredCount,

      financeProcessedCount,

      financeSkippedCount,

      financeFailedCount,

      cancelledCount,

      stockRestoredCount,

      stockRestoreSkippedCount,

      stockRestoreFailedCount,
    });
  } catch (error) {
    console.error(
      "SYNC ALL COURIER STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unknown courier sync error.",
      },
      {
        status: 500,
      }
    );
  }
}