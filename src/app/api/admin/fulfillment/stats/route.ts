import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==========================================
FULFILLMENT STATS
==========================================

Rules:

1. Only today's orders are counted.
2. Cancelled orders are excluded.
3. COD means actual amount still due.
4. Paid orders therefore contribute COD ৳0.
5. Fulfillment queue stats are calculated
   separately from order sales stats.
==========================================
*/

export async function GET() {
  try {
    /*
    ========================================
    BANGLADESH TODAY RANGE
    ========================================

    Business timezone:
    Asia/Dhaka = UTC+6

    We calculate today's start/end in
    Bangladesh time, then convert them
    to UTC ISO timestamps for Supabase.
    ========================================
    */

    const now = new Date();

    const dhakaOffsetMs =
      6 * 60 * 60 * 1000;

    const dhakaNow = new Date(
      now.getTime() + dhakaOffsetMs
    );

    const year =
      dhakaNow.getUTCFullYear();

    const month =
      dhakaNow.getUTCMonth();

    const day =
      dhakaNow.getUTCDate();

    /*
    Bangladesh midnight converted to UTC.

    Example:

    31 Jul 00:00 Bangladesh
    =
    30 Jul 18:00 UTC
    */

    const startOfTodayUtc =
      new Date(
        Date.UTC(
          year,
          month,
          day,
          -6,
          0,
          0,
          0
        )
      );

    const startOfTomorrowUtc =
      new Date(
        Date.UTC(
          year,
          month,
          day + 1,
          -6,
          0,
          0,
          0
        )
      );

    /*
    ========================================
    GET TODAY'S ORDERS
    ========================================
    */

    const {
      data: orders,
      error: ordersError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        `
        order_id,
        order_date,
        quantity,
        total,
        paid_amount,
        due_amount,
        payment_status,
        status
        `
      )
      .gte(
        "order_date",
        startOfTodayUtc.toISOString()
      )
      .lt(
        "order_date",
        startOfTomorrowUtc.toISOString()
      );

    if (ordersError) {
      throw ordersError;
    }

    /*
    ========================================
    REMOVE CANCELLED ORDERS
    ========================================
    */

    const activeOrders =
      (orders || []).filter(
        (order) =>
          String(
            order.status || ""
          ).toLowerCase() !==
          "cancelled"
      );

    /*
    ========================================
    TODAY ORDER COUNT
    ========================================
    */

    const todayOrders =
      activeOrders.length;

    /*
    ========================================
    TOTAL QUANTITY
    ========================================
    */

    const totalQty =
      activeOrders.reduce(
        (sum, order) =>
          sum +
          Number(
            order.quantity || 0
          ),
        0
      );

    /*
    ========================================
    TODAY'S ACTUAL COD
    ========================================

    COD = amount courier/customer still
    needs to pay.

    Paid order:
    due_amount = 0

    Unpaid order:
    due_amount = total

    Partial payment:
    due_amount = remaining amount
    ========================================
    */

    const todayCod =
      activeOrders.reduce(
        (sum, order) => {
          const total =
            Number(
              order.total || 0
            );

          const paidAmount =
            Number(
              order.paid_amount || 0
            );

          /*
          IMPORTANT:

          due_amount = 0 is valid.

          Never use:

          order.due_amount || total

          because 0 would incorrectly
          become the full total.
          */

          const dueAmount =
            order.due_amount !== null &&
            order.due_amount !== undefined
              ? Math.max(
                  0,
                  Number(
                    order.due_amount
                  )
                )
              : Math.max(
                  0,
                  total - paidAmount
                );

          return (
            sum + dueAmount
          );
        },
        0
      );

    /*
    ========================================
    GET FULFILLMENT QUEUE
    ========================================
    */

    const {
      data: fulfillmentRows,
      error: fulfillmentError,
    } = await supabaseAdmin
      .from("fulfillment_queue")
      .select("*");

    if (fulfillmentError) {
      throw fulfillmentError;
    }

    const queueRows =
      fulfillmentRows || [];

    /*
    ========================================
    FULFILLMENT STATUS COUNTS
    ========================================
    */

    const pendingPacking =
      queueRows.filter(
        (row) =>
          row.fulfillment_status ===
          "received"
      ).length;

    const packed =
      queueRows.filter(
        (row) =>
          row.fulfillment_status ===
          "packed"
      ).length;

    const dispatched =
      queueRows.filter(
        (row) =>
          row.fulfillment_status ===
          "dispatched"
      ).length;

    const delivered =
      queueRows.filter(
        (row) =>
          row.fulfillment_status ===
          "delivered"
      ).length;

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      todayOrders,

      pendingPacking,

      packed,

      dispatched,

      delivered,

      totalQty,

      todayCod,
    });
  } catch (error) {
    console.error(
      "FULFILLMENT STATS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load fulfillment stats",
      },
      {
        status: 500,
      }
    );
  }
}