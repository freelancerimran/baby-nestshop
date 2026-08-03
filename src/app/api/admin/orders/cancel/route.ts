import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

/*
==========================================
CANCEL ORDER
==========================================

The actual cancellation + stock restore
is performed atomically inside PostgreSQL:

cancel_order_with_stock_restore()

This protects against:

- Double stock restoration
- Simultaneous cancel requests
- Order cancelled but stock not restored
- Stock restored but order not cancelled
- Cancelling an order already sent to courier
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

    /*
    ========================================
    VALIDATION
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

    /*
    ========================================
    ATOMIC CANCEL + STOCK RESTORE
    ========================================
    */

    const {
      data,
      error,
    } = await supabaseAdmin.rpc(
      "cancel_order_with_stock_restore",
      {
        p_order_id:
          orderId,
      }
    );

    /*
    ========================================
    RPC ERROR
    ========================================
    */

    if (error) {
      console.error(
        "CANCEL ORDER RPC ERROR:",
        error
      );

      const message =
        String(
          error.message || ""
        );

      /*
      ======================================
      ORDER NOT FOUND
      ======================================
      */

      if (
        message.includes(
          "Order not found"
        )
      ) {
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
      ======================================
      COURIER SAFETY
      ======================================
      */

      if (
        message.includes(
          "already sent to courier"
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "This order has already been sent to the courier. It cannot be cancelled from here.",
          },
          {
            status: 400,
          }
        );
      }

      /*
      ======================================
      PRODUCT NOT FOUND
      ======================================
      */

      if (
        message.includes(
          "Product not found"
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "The product linked to this order could not be found. Stock was not changed.",
          },
          {
            status: 404,
          }
        );
      }

      /*
      ======================================
      INVALID QUANTITY
      ======================================
      */

      if (
        message.includes(
          "Invalid order quantity"
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "The order has an invalid quantity. Cancellation was stopped for safety.",
          },
          {
            status: 400,
          }
        );
      }

      /*
      ======================================
      UNKNOWN DATABASE ERROR
      ======================================
      */

      return NextResponse.json(
        {
          success: false,

          message:
            "Unable to cancel order safely.",

          error:
            message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    RESULT SAFETY
    ========================================
    */

    if (
      !data ||
      data.success !== true
    ) {
      console.error(
        "INVALID CANCEL RESULT:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Order cancellation failed.",
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
        data.orderId ||
        orderId,

      status:
        data.status ||
        "Cancelled",

      stockRestored:
        Boolean(
          data.stockRestored
        ),

      alreadyCancelled:
        Boolean(
          data.alreadyCancelled
        ),

      alreadyRestored:
        Boolean(
          data.alreadyRestored
        ),

      quantityRestored:
        Number(
          data.quantityRestored ||
            0
        ),

      previousRealStock:
        data.previousRealStock,

      newRealStock:
        data.newRealStock,

      previousDisplayStock:
        data.previousDisplayStock,

      newDisplayStock:
        data.newDisplayStock,

      productStatus:
        data.productStatus,

      message:
        data.message ||
        "Order cancelled successfully.",
    });
  } catch (error) {
    console.error(
      "CANCEL ORDER API ERROR:",
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