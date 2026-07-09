import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  req: NextRequest
) {
  try {
    const body = await req.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Queue ID required",
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabaseAdmin
      .from("fulfillment_queue")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Removed Successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Delete Failed",
      },
      {
        status: 500,
      }
    );
  }
}