import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

/*
==========================================
UPDATE ORDER PAYMENT
==========================================
*/

export async function POST(
  req: NextRequest
) {
  try {
    /*
    ========================================
    READ REQUEST
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
    BASIC VALIDATION
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
    GET CURRENT ORDER
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
    COURIER SAFETY
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
    TOTAL
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
    PAID AMOUNT SAFETY
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
    CALCULATE PAYMENT
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
    UPDATE ORDER
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
    SUCCESS
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
    });
  } catch (error) {
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