import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

export async function POST(
  req: NextRequest
) {
  console.log(
    "SEND TO COURIER API HIT"
  );

  try {
    /*
    ========================================
    GET ORDER ID
    ========================================
    */

    const {
      orderId,
    } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order ID required",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    GET ORDER
    ========================================
    */

    const {
      data: order,
      error,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq(
        "order_id",
        orderId
      )
      .single();

    if (
      error ||
      !order
    ) {
      console.error(
        "ORDER FETCH ERROR:",
        error
      );

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

    console.log(
      "ORDER FOUND:",
      order.order_id
    );

    /*
    ========================================
    DUPLICATE PROTECTION
    ========================================
    */

    if (
      order.consignment_id
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Order already sent to courier",

          consignmentId:
            order.consignment_id,
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    BASIC VALIDATION
    ========================================
    */

    if (
      !order.customer_name
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer name missing",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !order.phone
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number missing",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !order.address
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Address missing",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    CALCULATE COURIER COD AMOUNT
    ========================================

    Payment rules:

    Unpaid:
    total = 929
    paid = 0
    due = 929
    COD = 929

    Partially Paid:
    total = 929
    paid = 500
    due = 429
    COD = 429

    Fully Paid:
    total = 929
    paid = 929
    due = 0
    COD = 0

    Backward compatibility:

    If an old order does not have a
    due_amount value, order.total will
    automatically be used instead.
    ========================================
    */

    const codAmount =
      Math.max(
        0,
        Number(
          order.due_amount ??
            order.total ??
            0
        )
      );

    console.log(
      "COURIER PAYMENT:",
      {
        orderId:
          order.order_id,

        total:
          Number(
            order.total || 0
          ),

        paidAmount:
          Number(
            order.paid_amount ||
              0
          ),

        dueAmount:
          order.due_amount,

        codAmount,
      }
    );

    /*
    ========================================
    SEND TO STEADFAST
    ========================================
    */

    const steadfastResponse =
      await fetch(
        "https://portal.packzy.com/api/v1/create_order",
        {
          method: "POST",

          headers: {
            "Api-Key":
              process.env
                .STEADFAST_API_KEY!,

            "Secret-Key":
              process.env
                .STEADFAST_SECRET_KEY!,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            invoice:
              order.order_id,

            recipient_name:
              order.customer_name,

            recipient_phone:
              order.phone,

            recipient_address:
              order.address,

            /*
            ================================
            IMPORTANT:
            Courier receives only the
            customer's remaining due.
            ================================
            */

            cod_amount:
              codAmount,

            item_description:
              "Baby Nest Product",

            note:
              "Baby Nest Order",
          }),
        }
      );

    /*
    ========================================
    READ STEADFAST RESPONSE
    ========================================
    */

    const result =
      await steadfastResponse.json();

    console.log(
      "STEADFAST RESPONSE:",
      JSON.stringify(
        result,
        null,
        2
      )
    );

    /*
    ========================================
    STEADFAST ERROR CHECK
    ========================================
    */

    if (
      !steadfastResponse.ok ||
      !result.consignment
    ) {
      console.error(
        "STEADFAST CREATE ERROR:",
        {
          status:
            steadfastResponse.status,

          orderId:
            order.order_id,

          result,
        }
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Steadfast create failed",

          result,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    SAVE COURIER RESULT
    ========================================
    */

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        consignment_id:
          String(
            result.consignment
              .consignment_id
          ),

        tracking_code:
          result.consignment
            .tracking_code,

        courier_status:
          result.consignment
            .status,

        status:
          "Processing",
      })
      .eq(
        "order_id",
        orderId
      );

    if (
      updateError
    ) {
      console.error(
        "SUPABASE UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Supabase update failed",

          error:
            updateError.message,
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

      consignmentId:
        result.consignment
          .consignment_id,

      trackingCode:
        result.consignment
          .tracking_code,

      courierStatus:
        result.consignment
          .status,

      codAmount,
    });
  } catch (
    error
  ) {
    console.error(
      "SEND TO COURIER ERROR:",
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