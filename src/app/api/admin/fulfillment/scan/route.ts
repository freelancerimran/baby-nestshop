import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

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
    SCAN API STATUS
    ========================================
    */

    return NextResponse.json({
      success: true,
      message: "Scan API Ready",
    });
  } catch (error) {
    console.error(
      "SCAN GET API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Scan API Error",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
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
      "create"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to create fulfillment queue items.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    GET REQUEST BODY
    ========================================
    */

    const body =
      await req.json();

    const consignmentId =
      body.consignmentId?.trim();

    if (!consignmentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Consignment ID required",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    FIND ORDER
    ========================================
    */

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq(
        "consignment_id",
        consignmentId
      )
      .single();

    if (
      orderError ||
      !order
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
    ========================================
    DUPLICATE CHECK
    ========================================
    */

    const {
      data: existing,
    } = await supabaseAdmin
      .from("fulfillment_queue")
      .select("id")
      .eq(
        "order_id",
        order.order_id
      )
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Already Scanned",
        },
        {
          status: 409,
        }
      );
    }

    /*
    ========================================
    INSERT INTO FULFILLMENT QUEUE
    ========================================
    */

    const {
      data: insertedData,
      error: insertError,
    } = await supabaseAdmin
      .from("fulfillment_queue")
      .insert({
        order_id:
          order.order_id,

        consignment_id:
          order.consignment_id,

        customer_name:
          order.customer_name,

        phone:
          order.phone,

        address:
          order.address,

        product_name:
          order.product_name,

        quantity:
          order.quantity,

        fulfillment_status:
          order.fulfillment_status ||
          "received",
      })
      .select()
      .single();

    if (insertError) {
      /*
      ========================================
      DUPLICATE DATABASE CONSTRAINT
      ========================================
      */

      if (
        insertError.message?.includes(
          "duplicate"
        ) ||
        insertError.code === "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Already Scanned",
          },
          {
            status: 409,
          }
        );
      }

      throw insertError;
    }

    /*
    ========================================
    UPDATE ORDER FULFILLMENT STATUS
    ========================================
    */

    const fulfillmentUpdatedAt = new Date().toISOString();

    await supabaseAdmin
      .from("orders")
      .update({
        fulfillment_status:
          "received",

        fulfillment_updated_at:
          fulfillmentUpdatedAt,
      })
      .eq(
        "order_id",
        order.order_id
      );

    const auditLogged = await writeAuditLog({
      request: req,
      action: "create",
      module: "fulfillment",
      targetType: "fulfillment_queue",
      targetId: String(insertedData.id),
      description: `Scanned order ${order.order_id} into fulfillment queue.`,
      metadata: {
        order_id: order.order_id,
        consignment_id: order.consignment_id,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        product_name: order.product_name,
        quantity: order.quantity,
        previous_order_fulfillment_status: order.fulfillment_status ?? null,
        new_order_fulfillment_status: "received",
        fulfillment_updated_at: fulfillmentUpdatedAt,
        queue_item: insertedData,
      },
    });

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      message:
        "Added To Queue",

      queue:
        insertedData,
      auditLogged,
    });
  } catch (error) {
    console.error(
      "SCAN API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Scan Failed",
      },
      {
        status: 500,
      }
    );
  }
}