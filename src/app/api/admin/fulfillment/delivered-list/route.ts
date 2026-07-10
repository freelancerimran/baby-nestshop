import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } =
      await supabaseAdmin
        .from("fulfillment_queue")
        .select("*")
        .eq(
          "fulfillment_status",
          "delivered"
        )
        .order("delivered_at", {
          ascending: false,
        });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load delivered orders",
      },
      {
        status: 500,
      }
    );
  }
}