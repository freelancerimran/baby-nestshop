import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

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

        IMPORTANT:

        delivered_approval_pending is NOT
        final financial delivery.

        cancelled_approval_pending is NOT
        final confirmed cancellation.

        We wait for final courier status.
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
        ACTIVE / PROCESSING COURIER STATES
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
        CONFIRMED DELIVERY → PAYMENT PAID
        ====================================

        For current Baby Nest COD flow:

        Steadfast confirmed delivered means
        customer received the parcel and
        COD was collected.

        Therefore:

        payment_status = Paid
        paid_amount    = total
        due_amount     = 0

        IMPORTANT:

        This represents CUSTOMER payment.

        It does NOT necessarily mean
        Steadfast has already settled the
        money to the business bank/account.
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

        courier_status is saved BEFORE
        Finance / Inventory processing.

        This is required because both
        processors validate the current
        database state.
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

        /*
        ====================================
        CONFIRMED DELIVERED
        → FINANCE AUTOMATION
        ====================================

        Only exact:

        courier_status = delivered

        triggers Finance.

        Finance PostgreSQL RPC handles:

        - delivered validation
        - duplicate protection
        - FIFO investment allocation
        - sold_quantity update
        - Finance ledger creation
        - product COGS
        - allocated extra cost
        - landed cost
        - product revenue
        - gross profit
        - finance_processed
        - finance_processed_at
        - transaction safety
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
              "COURIER DELIVERED FINANCE RESULT:",
              {
                orderId:
                  order.order_id,

                result:
                  financeResult,
              }
            );

            /*
            --------------------------------
            ALREADY PROCESSED
            --------------------------------
            */

            if (
              financeResult.success &&
              financeResult.skipped
            ) {
              financeSkippedCount++;
            }

            /*
            --------------------------------
            NEWLY PROCESSED
            --------------------------------
            */

            else if (
              financeResult.success
            ) {
              financeProcessedCount++;
            }

            /*
            --------------------------------
            FINANCE FAILURE
            --------------------------------
            */

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

        Only exact:

        courier_status = cancelled

        restores website product stock.

        PostgreSQL RPC handles:

        - confirmed cancelled validation
        - duplicate protection
        - order locking
        - product locking
        - real_stock restoration
        - display_stock restoration
        - product status restoration
        - stock_restored flag
        - stock_restored_at
        - transaction safety
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
              "COURIER CANCELLED STOCK RESULT:",
              {
                orderId:
                  order.order_id,

                result:
                  stockResult,
              }
            );

            /*
            --------------------------------
            ALREADY RESTORED
            --------------------------------
            */

            if (
              stockResult.success &&
              stockResult.skipped
            ) {
              stockRestoreSkippedCount++;
            }

            /*
            --------------------------------
            NEWLY RESTORED
            --------------------------------
            */

            else if (
              stockResult.success
            ) {
              stockRestoredCount++;
            }

            /*
            --------------------------------
            STOCK RESTORE FAILURE
            --------------------------------
            */

            else {
              stockRestoreFailedCount++;

              console.error(
                "COURIER STOCK RESTORE FAILED:",
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

      /*
      ======================================
      GENERAL
      ======================================
      */

      totalOrders:
        orders?.length || 0,

      updatedCount,

      failedCount,

      /*
      ======================================
      DELIVERED / FINANCE
      ======================================
      */

      deliveredCount,

      financeProcessedCount,

      financeSkippedCount,

      financeFailedCount,

      /*
      ======================================
      CANCELLED / INVENTORY
      ======================================
      */

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