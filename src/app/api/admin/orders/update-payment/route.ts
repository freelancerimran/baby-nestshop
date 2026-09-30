import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

import {
  hasPermission,
} from "@/lib/permissions";

import { writeAuditLog } from "@/lib/audit";

/*
==========================================
UPDATE ORDER PAYMENT
==========================================

Required permission:

orders.edit

Payment update is treated as an order edit
because there is currently no separate
orders.update_payment permission.
==========================================
*/

export async function POST(
  req: NextRequest
) {
  try {
    /*
    ========================================
    1. PERMISSION CHECK
    ========================================
    */

    const allowed = await hasPermission(
      "orders",
      "edit"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to update order payment.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    2. READ REQUEST
    ========================================
    */

    const body =
      await req.json();

    const orderId =
      String(
        body.orderId || ""
      ).trim();

    const paidAmount =
      Number(
        body.paidAmount
      );

    /*
    ========================================
    3. BASIC VALIDATION
    ========================================
    */

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order ID required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        paidAmount
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid paid amount required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      paidAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid amount cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    4. GET CURRENT ORDER
    ========================================
    */

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        `
          order_id,
          total,
          paid_amount,
          due_amount,
          payment_status,
          consignment_id
        `
      )
      .eq(
        "order_id",
        orderId
      )
      .single();

    if (
      orderError ||
      !order
    ) {
      console.error(
        "PAYMENT ORDER FETCH ERROR:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    ========================================
    5. COURIER SAFETY
    ========================================

    Once the consignment has been created,
    changing local payment information
    could cause a mismatch with the COD
    amount already sent to Steadfast.
    ========================================
    */

    if (
      order.consignment_id
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Payment cannot be changed after the order has been sent to courier.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    6. TOTAL
    ========================================
    */

    const total =
      Number(
        order.total || 0
      );

    if (
      !Number.isFinite(total) ||
      total < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order total.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    7. PAID AMOUNT SAFETY
    ========================================
    */

    if (
      paidAmount > total
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Paid amount cannot be greater than order total.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    8. CALCULATE PAYMENT
    ========================================
    */

    const dueAmount =
      Math.max(
        0,
        total -
          paidAmount
      );

    let paymentStatus =
      "Unpaid";

    if (
      paidAmount > 0 &&
      paidAmount < total
    ) {
      paymentStatus =
        "Partially Paid";
    }

    if (
      total > 0 &&
      paidAmount >= total
    ) {
      paymentStatus =
        "Paid";
    }

    /*
    ========================================
    9. UPDATE ORDER
    ========================================
    */

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        paid_amount:
          paidAmount,

        due_amount:
          dueAmount,

        payment_status:
          paymentStatus,
      })
      .eq(
        "order_id",
        orderId
      )
      .select(
        `
          order_id,
          total,
          paid_amount,
          due_amount,
          payment_status
        `
      )
      .single();

    if (
      updateError ||
      !updatedOrder
    ) {
      console.error(
        "PAYMENT UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,

          message:
            updateError?.message ||
            "Payment update failed.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    10. AUDIT LOG
    ========================================
    */

    const auditLogged = await writeAuditLog({
      request: req,
      action: "update_payment",
      module: "orders",
      targetType: "order",
      targetId: orderId,
      description:
        `Payment information updated for order ${orderId}.`,
      metadata: {
        order_id: orderId,

        previous_paid_amount:
          Number(order.paid_amount || 0),

        previous_due_amount:
          Number(order.due_amount || 0),

        previous_payment_status:
          order.payment_status || null,

        new_paid_amount:
          Number(updatedOrder.paid_amount || 0),

        new_due_amount:
          Number(updatedOrder.due_amount || 0),

        new_payment_status:
          updatedOrder.payment_status || null,

        order_total:
          Number(updatedOrder.total || 0),

        consignment_id:
          order.consignment_id || null,
      },
    });

    /*
    ========================================
    11. SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      orderId:
        updatedOrder.order_id,

      total:
        Number(
          updatedOrder.total ||
            0
        ),

      paidAmount:
        Number(
          updatedOrder
            .paid_amount || 0
        ),

      dueAmount:
        Number(
          updatedOrder
            .due_amount || 0
        ),

      paymentStatus:
        updatedOrder
          .payment_status,

      auditLogged,
    });
  } catch (error) {
    /*
    ========================================
    UNEXPECTED ERROR
    ========================================
    */

    console.error(
      "UPDATE PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}