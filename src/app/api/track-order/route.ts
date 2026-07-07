import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { orderId, phone } = await req.json();

    if (!orderId || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID and Phone Number are required",
        },
        {
          status: 400,
        }
      );
    }

    const cleanOrderId = String(orderId).trim();

    const cleanPhone = String(phone)
      .replace(/\D/g, "")
      .trim();

    console.log("=================================");
    console.log("TRACK ORDER DEBUG");
    console.log("ORDER ID:", cleanOrderId);
    console.log("PHONE:", cleanPhone);

    const { data: sampleOrders } =
      await supabaseAdmin
        .from("orders")
        .select("order_id, phone")
        .limit(5);

    console.log("SAMPLE ORDERS:");
    console.log(sampleOrders);

    const { data: order, error } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("order_id", cleanOrderId)
        .eq("phone", cleanPhone)
        .single();

    console.log("QUERY RESULT:");
    console.log(order);

    if (error) {
      console.log("QUERY ERROR:");
      console.log(error);
    }

    if (error || !order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No order found with the provided information.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error(
      "TRACK ORDER ERROR:",
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