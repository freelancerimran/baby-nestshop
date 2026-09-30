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
============================================================
CANCEL ORDER API
============================================================

Actual cancellation + stock restoration is performed
atomically inside PostgreSQL:

cancel_order_with_stock_restore()

Supports:

- Legacy single-product orders
- New multi-product orders
- order_items based stock restoration
- Double restoration protection
- Courier safety
- Finance safety
- Real Stock / Display Stock restoration
============================================================
*/

export async function POST(
  req: NextRequest
) {
  try {
    /*
    ========================================================
    1. PERMISSION CHECK
    ========================================================

    Cancelling an order requires:

    orders.cancel

    Super Admin is automatically allowed
    by the permission engine.
    ========================================================
    */

    const allowed = await hasPermission(
      "orders",
      "cancel"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to cancel orders.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================================
    2. READ REQUEST
    ========================================================
    */

    const body =
      await req.json();

    const orderId =
      String(
        body?.orderId || ""
      ).trim();

    /*
    ========================================================
    3. VALIDATION
    ========================================================
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
    ========================================================
    4. LOAD ORDER SNAPSHOT FOR AUDIT
    ========================================================

    This snapshot is only used for audit metadata.
    The actual cancellation + stock restoration remains
    fully atomic inside PostgreSQL.
    ========================================================
    */

    const { data: orderSnapshot } =
      await supabaseAdmin
        .from("orders")
        .select(
          "order_id, customer_name, phone, status, courier_status, consignment_id, tracking_code, finance_processed, stock_restored, total"
        )
        .eq("order_id", orderId)
        .maybeSingle();

    /*
    ========================================================
    5. ATOMIC CANCEL + STOCK RESTORE
    ========================================================

    PostgreSQL handles:

    - Order locking
    - Product locking
    - Single-product restoration
    - Multi-product restoration
    - Double-restore protection
    - Courier protection
    - Finance protection
    - Order status update
    ========================================================
    */

    const {
      data,
      error,
    } =
      await supabaseAdmin.rpc(
        "cancel_order_with_stock_restore",
        {
          p_order_id:
            orderId,
        }
      );

    /*
    ========================================================
    6. DATABASE / RPC ERROR
    ========================================================
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
      ======================================================
      ORDER NOT FOUND
      ======================================================
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
      ======================================================
      COURIER SAFETY
      ======================================================
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
      ======================================================
      FINANCE SAFETY
      ======================================================
      */

      if (
        message.includes(
          "already processed in Finance"
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "This order has already been processed in Finance and cannot be cancelled normally.",
          },
          {
            status: 400,
          }
        );
      }

      /*
      ======================================================
      PRODUCT NOT FOUND
      ======================================================
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
              "A product linked to this order could not be found. Stock was not changed.",
          },
          {
            status: 404,
          }
        );
      }

      /*
      ======================================================
      INVALID QUANTITY
      ======================================================
      */

      if (
        message.includes(
          "Invalid order quantity"
        ) ||
        message.includes(
          "Invalid order item quantity"
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "The order contains an invalid quantity. Cancellation was stopped for safety.",
          },
          {
            status: 400,
          }
        );
      }

      /*
      ======================================================
      PRODUCT ID MISSING
      ======================================================
      */

      if (
        message.includes(
          "Order product ID is missing"
        ) ||
        message.includes(
          "Order item product ID is missing"
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "A product linked to this order is missing. Cancellation was stopped for safety.",
          },
          {
            status: 400
          }
        );
      }

      /*
      ======================================================
      UNKNOWN DATABASE ERROR
      ======================================================
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
    ========================================================
    7. RESULT SAFETY
    ========================================================
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
            data?.message ||
            "Order cancellation failed.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================================
    8. AUDIT LOG + SUCCESS RESPONSE
    ========================================================

    Works for both:

    Single Product:
        restoredItemCount = 1

    Multi Product:
        restoredItemCount = number of order_items

    The complete restored item list is returned so the
    frontend can display exactly what was restored.
    ========================================================
    */

    /*
    ========================================================
    AUDIT LOG
    ========================================================

    Log only an actual cancellation mutation.
    A repeated cancel request that was already cancelled
    does not create a duplicate mutation audit.
    ========================================================
    */

    let auditLogged = false;

    if (!Boolean(data.alreadyCancelled)) {
      auditLogged = await writeAuditLog({
        request: req,
        action: "cancel",
        module: "orders",
        targetType: "order",
        targetId: orderId,
        description:
          `Order ${orderId} was cancelled and stock restoration was processed.`,
        metadata: {
          order_id: orderId,
          customer_name:
            orderSnapshot?.customer_name || null,
          phone:
            orderSnapshot?.phone || null,
          previous_status:
            orderSnapshot?.status || null,
          previous_courier_status:
            orderSnapshot?.courier_status || null,
          consignment_id:
            orderSnapshot?.consignment_id || null,
          tracking_code:
            orderSnapshot?.tracking_code || null,
          finance_processed:
            Boolean(orderSnapshot?.finance_processed),
          stock_restored_before_cancel:
            Boolean(orderSnapshot?.stock_restored),
          total:
            orderSnapshot?.total ?? null,
          new_status:
            data.status || "Cancelled",
          stock_restored:
            Boolean(data.stockRestored),
          already_cancelled:
            Boolean(data.alreadyCancelled),
          already_restored:
            Boolean(data.alreadyRestored),
          restored_item_count:
            Number(data.restoredItemCount || 0),
          restored_quantity:
            Number(data.restoredQuantity || 0),
          restored_items:
            Array.isArray(data.items)
              ? data.items
              : [],
          rpc_result:
            data,
        },
      });
    }

    /*
    ========================================================
    SUCCESS RESPONSE
    ========================================================
    */

    return NextResponse.json(
      {
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

        restoredItemCount:
          Number(
            data.restoredItemCount ||
              0
          ),

        restoredQuantity:
          Number(
            data.restoredQuantity ||
              0
          ),

        items:
          Array.isArray(
            data.items
          )
            ? data.items
            : [],

        auditLogged,

        message:
          data.message ||
          "Order cancelled and stock restored successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /*
    ========================================================
    UNEXPECTED SERVER ERROR
    ========================================================
    */

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
            : "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}