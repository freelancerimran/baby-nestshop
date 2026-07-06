import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  console.log("SEND TO COURIER API HIT");

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
      console.error(
        "ORDER FETCH ERROR:",
        error
      );

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

    console.log(
      "ORDER FOUND:",
      order.order_id
    );

    // ==========================
    // DUPLICATE PROTECTION
    // ==========================

    if (order.consignment_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order already sent to courier",
          consignmentId:
            order.consignment_id,
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // BASIC VALIDATION
    // ==========================

    if (!order.customer_name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer name missing",
        },
        {
          status: 400,
        }
      );
    }

    if (!order.phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number missing",
        },
        {
          status: 400,
        }
      );
    }

    if (!order.address) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Address missing",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // SEND TO STEADFAST
    // ==========================

    const steadfastResponse = await fetch(
      "https://portal.packzy.com/api/v1/create_order",
      {
        method: "POST",

        headers: {
          "Api-Key":
            process.env.STEADFAST_API_KEY!,

          "Secret-Key":
            process.env.STEADFAST_SECRET_KEY!,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          invoice: order.order_id,

          recipient_name:
            order.customer_name,

          recipient_phone:
            order.phone,

          recipient_address:
            order.address,

          cod_amount:
            Number(order.total),

          item_description:
            "Baby Nest Product",

          note:
            "Baby Nest Order",
        }),
      }
    );

    const result =
      await steadfastResponse.json();

    console.log(
      "STEADFAST RESPONSE:",
      JSON.stringify(
        result,
        null,
        2
      )
    );

    if (!result.consignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Steadfast create failed",
          result,
        },
        {
          status: 500,
        }
      );
    }

    // ==========================
    // SAVE RESULT
    // ==========================

    const { error: updateError } =
      await supabaseAdmin
        .from("orders")
        .update({
          consignment_id:
            String(
              result.consignment
                .consignment_id
            ),

          tracking_code:
            result.consignment
              .tracking_code,

          courier_status:
            result.consignment
              .status,

          status:
            "Processing",
        })
        .eq(
          "order_id",
          orderId
        );

    if (updateError) {
      console.error(
        "SUPABASE UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Supabase update failed",
          error:
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,

      consignmentId:
        result.consignment
          .consignment_id,

      trackingCode:
        result.consignment
          .tracking_code,

      courierStatus:
        result.consignment
          .status,
    });

  } catch (error) {
    console.error(
      "SEND TO COURIER ERROR:",
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