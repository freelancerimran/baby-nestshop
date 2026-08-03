import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==========================================
COMPLETE FULFILLMENT / WAREHOUSE ORDER
==========================================

PURPOSE:

This route is ONLY for the internal
Baby Nest warehouse / fulfillment flow.

It means:

- Packing / verification is complete
- Parcel has been handed over / dispatched
- Warehouse work is complete

IMPORTANT:

Warehouse completion DOES NOT mean that
the customer has received the parcel.

Therefore this route MUST NOT change:

- orders.status
- orders.courier_status
- orders.payment_status
- orders.paid_amount
- orders.due_amount
- orders.finance_processed
- website product stock
- investment sold quantity
- Finance ledger

STEADFAST is the source of truth for
actual customer delivery.

FINAL ARCHITECTURE:

FULFILLMENT:

received
   ↓
picking
   ↓
packing
   ↓
packed
   ↓
dispatched / handover
   ↓
warehouse complete

STEADFAST:

in_review / pending / etc.
   ↓
delivered
   ↓
Orders = Delivered
Payment = Paid
   ↓
Finance processing

==========================================
*/

export async function POST(
  req: NextRequest
) {
  try {
    /*
    ========================================
    GET QUEUE ID
    ========================================
    */

    const body =
      await req.json();

    const id =
      body?.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Queue ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    GET FULFILLMENT QUEUE ITEM
    ========================================
    */

    const {
      data: queueItem,
      error: queueError,
    } = await supabaseAdmin
      .from("fulfillment_queue")
      .select("*")
      .eq("id", id)
      .single();

    if (
      queueError ||
      !queueItem
    ) {
      console.error(
        "FULFILLMENT QUEUE FETCH ERROR:",
        queueError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Fulfillment queue item not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    ========================================
    VALIDATE ORDER ID
    ========================================
    */

    const orderId =
      String(
        queueItem.order_id || ""
      ).trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Queue item does not have an Order ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    VERIFY MAIN ORDER EXISTS
    ========================================

    We only verify that the order exists.

    We DO NOT use this route to change:

    - order status
    - courier status
    - payment
    - finance
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
        fulfillment_status
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
        "FULFILLMENT ORDER FETCH ERROR:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Main order not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    ========================================
    COMPLETION TIME
    ========================================
    */

    const completedAt =
      new Date().toISOString();

    /*
    ========================================
    UPDATE FULFILLMENT QUEUE
    ========================================

    fulfillment_queue uses "delivered"
    as its internal final/completed state.

    In this table, "delivered" means:

    WAREHOUSE FULFILLMENT COMPLETED.

    It does NOT mean:

    CUSTOMER DELIVERY CONFIRMED.
    ========================================
    */

    let updatedQueue =
      queueItem;

    if (
      queueItem.fulfillment_status !==
      "delivered"
    ) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("fulfillment_queue")
        .update({
          fulfillment_status:
            "delivered",

          delivered_at:
            completedAt,
        })
        .eq(
          "id",
          id
        )
        .select()
        .single();

      if (error) {
        console.error(
          "FULFILLMENT QUEUE UPDATE ERROR:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to complete fulfillment queue item.",
          },
          {
            status: 500,
          }
        );
      }

      if (data) {
        updatedQueue =
          data;
      }
    }

    /*
    ========================================
    UPDATE ONLY WAREHOUSE STATUS
    ========================================

    orders.fulfillment_status supports:

    received
    picking
    packing
    packed
    dispatched

    Warehouse completion therefore remains:

    fulfillment_status = dispatched

    IMPORTANT:

    We intentionally DO NOT update:

    status
    courier_status
    payment_status
    paid_amount
    due_amount
    finance_processed

    Those belong to the Courier / Finance
    workflow, not Fulfillment.
    ========================================
    */

    const {
      error: fulfillmentSyncError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        fulfillment_status:
          "dispatched",

        fulfillment_updated_at:
          completedAt,

        dispatched_at:
          completedAt,
      })
      .eq(
        "order_id",
        orderId
      );

    if (fulfillmentSyncError) {
      console.error(
        "WAREHOUSE STATUS SYNC ERROR:",
        {
          orderId,
          error:
            fulfillmentSyncError,
        }
      );

      return NextResponse.json(
        {
          success: false,

          warehouseCompleted:
            true,

          message:
            "Fulfillment queue was completed, but warehouse status sync failed.",

          data:
            updatedQueue,

          error:
            fulfillmentSyncError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    SUCCESS
    ========================================

    Notice:

    NO Finance processing here.

    NO Courier status update here.

    NO Payment update here.

    NO Inventory deduction here.

    The Steadfast status sync route handles
    actual customer delivery separately.
    ========================================
    */

    console.log(
      "FULFILLMENT WAREHOUSE COMPLETED:",
      {
        orderId,
        queueId:
          id,
        completedAt,
      }
    );

    return NextResponse.json({
      success: true,

      skipped:
        queueItem.fulfillment_status ===
        "delivered",

      warehouseCompleted:
        true,

      message:
        queueItem.fulfillment_status ===
        "delivered"
          ? "Fulfillment was already completed."
          : "Fulfillment completed and parcel handed over successfully.",

      data:
        updatedQueue,
    });
  } catch (error) {
    /*
    ========================================
    UNEXPECTED ERROR
    ========================================
    */

    console.error(
      "FULFILLMENT COMPLETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        warehouseCompleted:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Fulfillment completion failed.",
      },
      {
        status: 500,
      }
    );
  }
}