import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    /*
    ========================================
    PERMISSION CHECK
    ========================================
    */

    const allowed = await hasPermission(
      "fulfillment",
      "dispatch"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to undo fulfillment dispatch.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    GET QUEUE ID
    ========================================
    */

    const { id } = await req.json();

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

    /*
    ========================================
    UNDO DISPATCH
    ========================================
    */

    // Capture the current queue item for an accurate audit trail.
    const { data: previousItem, error: fetchError } = await supabaseAdmin
      .from("fulfillment_queue")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!previousItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Fulfillment queue item not found",
        },
        {
          status: 404,
        }
      );
    }

    const newDispatchAt = null;

    const { data: updatedItem, error } = await supabaseAdmin
      .from("fulfillment_queue")
      .update({
        fulfillment_status: "received",
        dispatch_at: newDispatchAt,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!updatedItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Fulfillment queue item could not be updated",
        },
        {
          status: 404,
        }
      );
    }

    const auditLogged = await writeAuditLog({
      request: req,
      action: "undo_dispatch",
      module: "fulfillment",
      targetType: "fulfillment_queue",
      targetId: String(id),
      description: `Undid dispatch for fulfillment queue item ${id}.`,
      metadata: {
        queue_id: id,
        previous_status: previousItem.fulfillment_status,
        new_status: updatedItem.fulfillment_status,
        previous_dispatch_at: previousItem.dispatch_at,
        new_dispatch_at: updatedItem.dispatch_at,
        previous_item: previousItem,
        updated_item: updatedItem,
      },
    });

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,
      auditLogged,
    });
  } catch (error) {
    console.error(
      "FULFILLMENT UNDO DISPATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Undo Dispatch Failed",
      },
      {
        status: 500,
      }
    );
  }
}