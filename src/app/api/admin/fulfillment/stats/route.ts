import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*");

    if (error) throw error;

    const rows = orders || [];

    // Unique Order Count
    const uniqueOrders = new Set(
      rows.map((item) => item.order_id)
    );

    const todayOrders = uniqueOrders.size;

    const pendingPacking = rows.filter(
      (o) =>
        o.fulfillment_status === "received" ||
        o.fulfillment_status === "picking" ||
        o.fulfillment_status === "packing" ||
        !o.fulfillment_status
    ).length;

    const packed = rows.filter(
      (o) => o.fulfillment_status === "packed"
    ).length;

    const dispatched = rows.filter(
      (o) => o.fulfillment_status === "dispatched"
    ).length;

    const delivered = rows.filter(
      (o) => o.courier_status === "delivered"
    ).length;

    const totalQty = rows.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    const todayCod = rows.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    return NextResponse.json({
      success: true,

      totalRows: rows.length,
      uniqueOrders: uniqueOrders.size,

      todayOrders,
      pendingPacking,
      packed,
      dispatched,
      delivered,
      totalQty,
      todayCod,
    });
  } catch (error) {
    console.error("Fulfillment Stats Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load fulfillment stats",
      },
      {
        status: 500,
      }
    );
  }
}