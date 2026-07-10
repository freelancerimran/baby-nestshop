import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    const { error } = await supabaseAdmin
      .from("fulfillment_queue")
      .update({
        fulfillment_status: "received",
        dispatch_at: null,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Undo Dispatch Failed",
      },
      { status: 500 }
    );
  }
}