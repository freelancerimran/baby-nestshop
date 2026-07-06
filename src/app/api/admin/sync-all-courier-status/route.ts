import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const { data: orders, error } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .not("consignment_id", "is", null);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    let updatedCount = 0;

    for (const order of orders || []) {
      try {
        const response = await fetch(
          `https://portal.packzy.com/api/v1/status_by_cid/${order.consignment_id}`,
          {
            method: "GET",
            headers: {
              "Api-Key":
                process.env.STEADFAST_API_KEY!,
              "Secret-Key":
                process.env.STEADFAST_SECRET_KEY!,
              "Content-Type":
                "application/json",
            },
          }
        );

        const result =
          await response.json();

        if (
          result.status !== 200
        ) {
          continue;
        }

        const courierStatus =
          result.delivery_status ||
          "unknown";

        let orderStatus =
          "Processing";

        if (
          courierStatus ===
            "delivered" ||
          courierStatus ===
            "delivered_approval_pending"
        ) {
          orderStatus =
            "Delivered";
        }

        if (
          courierStatus ===
            "partial_delivered" ||
          courierStatus ===
            "partial_delivered_approval_pending"
        ) {
          orderStatus =
            "Partial Delivered";
        }

        if (
          courierStatus ===
            "cancelled" ||
          courierStatus ===
            "cancelled_approval_pending"
        ) {
          orderStatus =
            "Cancelled";
        }

        await supabaseAdmin
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
            order.order_id
          );

        updatedCount++;
      } catch (err) {
        console.error(
          "SYNC ERROR:",
          err
        );
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
    });
  } catch (error) {
    console.error(error);

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