import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

export async function DELETE(
  req: NextRequest
) {
  try {
    /*
    ========================================
    PERMISSION CHECK
    ========================================
    */

    const allowed = await hasPermission(
      "fulfillment",
      "delete"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to delete fulfillment queue items.",
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

    /*
    ========================================
    GET QUEUE ITEM FOR AUDIT
    ========================================

    Capture existence before deletion so the audit
    is written only after a real queue item is removed.
    ========================================
    */

    const {
      data: existingQueueItem,
      error: fetchError,
    } = await supabaseAdmin
      .from("fulfillment_queue")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!existingQueueItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Fulfillment queue item not found",
        },
        { status: 404 }
      );
    }

    /*
    ========================================
    DELETE QUEUE ITEM
    ========================================
    */

    const { error } = await supabaseAdmin
      .from("fulfillment_queue")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    /*
    ========================================
    AUDIT LOG
    ========================================
    */

    const auditLogged = await writeAuditLog({
      request: req,
      action: "delete",
      module: "fulfillment",
      targetType: "fulfillment_queue",
      targetId: String(id),
      description: `Deleted fulfillment queue item ${id}.`,
      metadata: {
        queue_id: id,
      },
    });

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,
      message: "Removed Successfully",
      auditLogged,
    });
  } catch (error) {
    console.error(
      "FULFILLMENT DELETE ERROR:",
      error
    );

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