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
            "You do not have permission to dispatch fulfillment orders.",
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

    console.log(
      "Dispatch API ID:",
      id
    );

    /*
    ========================================
    DISPATCH FULFILLMENT ITEM
    ========================================
    */

    // Capture the current queue item before the mutation so the audit
    // record contains the previous fulfillment state.
    const { data: previousItem, error: previousItemError } =
      await supabaseAdmin
        .from("fulfillment_queue")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (previousItemError) {
      throw previousItemError;
    }

    const dispatchAt = new Date().toISOString();

    const { data, error } =
      await supabaseAdmin
        .from("fulfillment_queue")
        .update({
          fulfillment_status:
            "dispatched",

          dispatch_at:
            dispatchAt,
        })
        .eq("id", id)
        .select();

    console.log(
      "UPDATED:",
      data
    );

    console.log(
      "ERROR:",
      error
    );

    if (error) {
      throw error;
    }

    /*
    ========================================
    SUCCESS
    ========================================
    */

    let auditLogged = false;

    if (data?.length) {
      auditLogged = await writeAuditLog({
        request: req,
        action: "dispatch",
        module: "fulfillment",
        targetType: "fulfillment_queue",
        targetId: String(id),
        description: `Dispatched fulfillment queue item ${id}.`,
        metadata: {
          queue_id: id,
          previous_item: previousItem,
          new_item: data[0],
          previous_status:
            previousItem?.fulfillment_status ?? null,
          new_status:
            data[0]?.fulfillment_status ?? "dispatched",
          previous_dispatch_at:
            previousItem?.dispatch_at ?? null,
          new_dispatch_at:
            data[0]?.dispatch_at ?? dispatchAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      auditLogged,
    });
  } catch (error) {
    console.error(
      "FULFILLMENT DISPATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Dispatch Failed",
      },
      {
        status: 500,
      }
    );
  }
}