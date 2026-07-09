import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Scan API Ready",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const consignmentId = body.consignmentId?.trim();

    if (!consignmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Consignment ID required",
        },
        { status: 400 }
      );
    }

    // Find Order
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("consignment_id", consignmentId)
        .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Duplicate Check
    const { data: existing } =
      await supabaseAdmin
        .from("fulfillment_queue")
        .select("id")
        .eq("order_id", order.order_id)
        .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Already Scanned",
        },
        { status: 409 }
      );
    }

    // Insert Queue
    const { data: insertedData, error: insertError } =
      await supabaseAdmin
        .from("fulfillment_queue")
        .insert({
          order_id: order.order_id,
          consignment_id: order.consignment_id,
          customer_name: order.customer_name,
          phone: order.phone,
          quantity: order.quantity,
          fulfillment_status:
            order.fulfillment_status || "received",
        })
        .select()
        .single();

    if (insertError) {
      throw insertError;
    }

    // Update Order Status
    await supabaseAdmin
      .from("orders")
      .update({
        fulfillment_status: "received",
        fulfillment_updated_at: new Date().toISOString(),
      })
      .eq("order_id", order.order_id);

    return NextResponse.json({
      success: true,
      message: "Added To Queue",
      queue: insertedData,
    });
  } catch (error) {
    console.error("SCAN API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Scan Failed",
      },
      {
        status: 500,
      }
    );
  }
}