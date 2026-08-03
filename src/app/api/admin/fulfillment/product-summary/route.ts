import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    /*
    ========================================
    BANGLADESH TODAY RANGE
    ========================================

    Database timestamps are compared using
    UTC, but "Today" for Baby Nest should
    follow Bangladesh time (UTC+6).
    ========================================
    */

    const now = new Date();

    const bangladeshNow = new Date(
      now.getTime() +
        6 * 60 * 60 * 1000
    );

    const year =
      bangladeshNow.getUTCFullYear();

    const month =
      bangladeshNow.getUTCMonth();

    const day =
      bangladeshNow.getUTCDate();

    /*
    Bangladesh 00:00 = previous day 18:00 UTC
    Bangladesh next 00:00 = current day 18:00 UTC
    */

    const startOfTodayUtc = new Date(
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

    const startOfTomorrowUtc = new Date(
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
    GET TODAY'S VALID ORDERS
    ========================================

    Cancelled orders are excluded.

    Therefore Product Summary represents
    actual active orders for today.
    ========================================
    */

    const { data, error } =
      await supabaseAdmin
        .from("orders")
        .select(
          `
          product_name,
          quantity,
          status,
          order_date
          `
        )
        .gte(
          "order_date",
          startOfTodayUtc.toISOString()
        )
        .lt(
          "order_date",
          startOfTomorrowUtc.toISOString()
        )
        .neq(
          "status",
          "Cancelled"
        );

    if (error) {
      throw error;
    }

    /*
    ========================================
    BUILD PRODUCT SUMMARY
    ========================================
    */

    const summary: Record<
      string,
      number
    > = {};

    (data || []).forEach((item) => {
      const product =
        item.product_name?.trim() ||
        "Unknown Product";

      const quantity =
        Number(item.quantity || 0);

      summary[product] =
        (summary[product] || 0) +
        quantity;
    });

    /*
    ========================================
    FORMAT + SORT
    ========================================
    */

    const products =
      Object.entries(summary)
        .map(([name, qty]) => ({
          name,
          qty,
        }))
        .filter(
          (item) =>
            item.qty > 0
        )
        .sort(
          (a, b) =>
            b.qty - a.qty
        );

    /*
    ========================================
    RESPONSE
    ========================================
    */

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(
      "Product Summary Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
      },
      {
        status: 500,
      }
    );
  }
}