import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID required",
        },
        {
          status: 400,
        }
      );
    }

    // Get Order

    const { data: order, error } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .single();

    if (error || !order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        {
          status: 404,
        }
      );
    }

    if (!order.consignment_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Consignment ID not found",
        },
        {
          status: 400,
        }
      );
    }

    // Get Status From Steadfast

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

    const result = await response.json();

    console.log(
      "COURIER STATUS RESPONSE:",
      result
    );

    if (result.status !== 200) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to fetch courier status",
          result,
        },
        {
          status: 500,
        }
      );
    }

    const courierStatus =
      result.delivery_status || "unknown";

    let orderStatus =
      order.status || "Processing";

    // Status Mapping

    if (
      courierStatus === "delivered" ||
      courierStatus ===
        "delivered_approval_pending"
    ) {
      orderStatus = "Delivered";
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
      courierStatus === "cancelled" ||
      courierStatus ===
        "cancelled_approval_pending"
    ) {
      orderStatus = "Cancelled";
    }

    if (
      courierStatus === "pending" ||
      courierStatus === "in_review" ||
      courierStatus === "hold"
    ) {
      orderStatus = "Processing";
    }

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        courier_status:
          courierStatus,

        status: orderStatus,

        last_status_sync:
          new Date().toISOString(),
      })
      .eq(
        "order_id",
        orderId
      );

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message:
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      courierStatus,
      orderStatus,
    });

  } catch (error) {
    console.error(
      "UPDATE STATUS ERROR:",
      error
    );

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