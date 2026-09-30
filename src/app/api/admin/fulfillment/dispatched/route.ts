import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    /*
    ========================================
    PERMISSION CHECK
    ========================================
    */

    const allowed = await hasPermission(
      "fulfillment",
      "view"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view fulfillment data.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    GET DISPATCHED FULFILLMENT ORDERS
    ========================================
    */

    const { data, error } =
      await supabaseAdmin
        .from("fulfillment_queue")
        .select("*")
        .eq(
          "fulfillment_status",
          "dispatched"
        )
        .order("scanned_at", {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "FULFILLMENT DISPATCHED LIST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load dispatch queue",
      },
      {
        status: 500,
      }
    );
  }
}