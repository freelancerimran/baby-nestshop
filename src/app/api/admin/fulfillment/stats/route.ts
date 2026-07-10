import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    // Orders Table
    const { data: orders, error: ordersError } =
      await supabaseAdmin
        .from("orders")
        .select("*");

    if (ordersError) throw ordersError;

    // Fulfillment Queue
    const {
      data: fulfillmentRows,
      error: fulfillmentError,
    } = await supabaseAdmin
      .from("fulfillment_queue")
      .select("*");

    if (fulfillmentError)
      throw fulfillmentError;

    const orderRows = orders || [];
    const queueRows =
      fulfillmentRows || [];

    // Orders Stats
    const todayOrders =
      orderRows.length;

    const totalQty =
      orderRows.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0),
        0
      );

    const todayCod =
      orderRows.reduce(
        (sum, item) =>
          sum +
          Number(item.total || 0),
        0
      );

    // Fulfillment Stats
    const pendingPacking =
      queueRows.filter(
        (o) =>
          o.fulfillment_status ===
          "received"
      ).length;

    const dispatched =
      queueRows.filter(
        (o) =>
          o.fulfillment_status ===
          "dispatched"
      ).length;

    const delivered =
      queueRows.filter(
        (o) =>
          o.fulfillment_status ===
          "delivered"
      ).length;

    return NextResponse.json({
      success: true,

      todayOrders,
      pendingPacking,
      packed: 0,
      dispatched,
      delivered,
      totalQty,
      todayCod,
    });
  } catch (error) {
    console.error(
      "Fulfillment Stats Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}