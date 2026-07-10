import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    console.log("Dispatch API ID:", id);

const { data, error } = await supabaseAdmin
  .from("fulfillment_queue")
  .update({
  fulfillment_status: "dispatched",
  dispatch_at: new Date().toISOString(),
  })
  .eq("id", id)
  .select();

console.log("UPDATED:", data);
console.log("ERROR:", error);

if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Dispatch Failed",
      },
      { status: 500 }
    );
  }
}