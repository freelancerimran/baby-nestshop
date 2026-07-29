import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==========================================
TYPES
==========================================
*/

export type CancelledOrderResult = {
  success: boolean;
  skipped?: boolean;
  message: string;

  orderId?: string;
  productId?: string | number;

  restoredQuantity?: number;

  previousRealStock?: number;
  newRealStock?: number;

  previousDisplayStock?: number;
  newDisplayStock?: number;

  [key: string]: unknown;
};

/*
==========================================
PROCESS CANCELLED ORDER
==========================================

Stock restoration is handled inside
PostgreSQL using:

process_cancelled_order_stock()

The database function handles:

1. Confirmed cancelled validation
2. Duplicate protection
3. Order row locking
4. Product row locking
5. Real stock restoration
6. Display stock restoration
7. Product status restoration
8. stock_restored update
9. Transaction safety

This TypeScript helper only calls the
database RPC.
==========================================
*/

export async function processCancelledOrder(
  orderId: string
): Promise<CancelledOrderResult> {
  try {
    /*
    ========================================
    VALIDATE ORDER ID
    ========================================
    */

    const cleanOrderId = String(
      orderId || ""
    ).trim();

    if (!cleanOrderId) {
      return {
        success: false,
        message:
          "Order ID is required.",
      };
    }

    /*
    ========================================
    CALL TRANSACTION-SAFE DATABASE FUNCTION
    ========================================
    */

    const {
      data,
      error,
    } = await supabaseAdmin.rpc(
      "process_cancelled_order_stock",
      {
        p_order_id:
          cleanOrderId,
      }
    );

    /*
    ========================================
    RPC ERROR
    ========================================
    */

    if (error) {
      console.error(
        "CANCELLED ORDER RPC ERROR:",
        error
      );

      return {
        success: false,

        message:
          error.message ||
          "Cancelled order stock restoration failed.",

        orderId:
          cleanOrderId,
      };
    }

    /*
    ========================================
    VALIDATE DATABASE RESPONSE
    ========================================
    */

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      console.error(
        "INVALID CANCELLED ORDER RPC RESPONSE:",
        data
      );

      return {
        success: false,

        message:
          "Cancelled order processor returned an invalid response.",

        orderId:
          cleanOrderId,
      };
    }

    const result =
      data as CancelledOrderResult;

    /*
    ========================================
    DATABASE REPORTED FAILURE
    ========================================
    */

    if (!result.success) {
      console.error(
        "CANCELLED ORDER PROCESSING FAILED:",
        result
      );

      return {
        ...result,

        success: false,

        orderId:
          result.orderId ||
          cleanOrderId,
      };
    }

    /*
    ========================================
    SKIPPED

    Examples:

    - Order is not confirmed cancelled
    - Stock already restored
    ========================================
    */

    if (result.skipped) {
      console.log(
        "CANCELLED ORDER PROCESSING SKIPPED:",
        result
      );

      return {
        ...result,

        success: true,

        skipped: true,

        orderId:
          result.orderId ||
          cleanOrderId,
      };
    }

    /*
    ========================================
    SUCCESS
    ========================================
    */

    console.log(
      "CANCELLED ORDER STOCK RESTORE SUCCESS:",
      result
    );

    return {
      ...result,

      success: true,

      skipped: false,

      orderId:
        result.orderId ||
        cleanOrderId,
    };
  } catch (error) {
    /*
    ========================================
    UNEXPECTED ERROR
    ========================================
    */

    console.error(
      "PROCESS CANCELLED ORDER ERROR:",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Unknown cancelled order processing error.",

      orderId: String(
        orderId || ""
      ),
    };
  }
}