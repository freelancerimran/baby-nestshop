import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==========================================
TYPES
==========================================
*/

export type ProcessFinanceResult = {
  success: boolean;
  skipped?: boolean;
  message: string;

  orderId?: string;
  productId?: string | number;

  requestedQuantity?: number;
  allocatedQuantity?: number;

  investmentItemId?:
    | number
    | string
    | null;

  [key: string]: unknown;
};

/*
==========================================
PROCESS DELIVERED ORDER
==========================================

Finance processing is handled inside
PostgreSQL using:

process_delivered_order_finance()

The database function handles:

1. Delivered status validation
2. Duplicate protection
3. Investment stock validation
4. FIFO allocation
5. sold_quantity update
6. finance_processed update
7. Transaction safety

This TypeScript helper only calls the
database RPC.
==========================================
*/

export async function processDeliveredOrder(
  orderId: string
): Promise<ProcessFinanceResult> {
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
      "process_delivered_order_finance",
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
        "FINANCE RPC ERROR:",
        error
      );

      return {
        success: false,

        message:
          error.message ||
          "Finance processing failed.",

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
        "INVALID FINANCE RPC RESPONSE:",
        data
      );

      return {
        success: false,

        message:
          "Finance processor returned an invalid response.",

        orderId:
          cleanOrderId,
      };
    }

    const result =
      data as ProcessFinanceResult;

    /*
    ========================================
    DATABASE REPORTED FAILURE
    ========================================
    */

    if (!result.success) {
      console.error(
        "FINANCE PROCESSING FAILED:",
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

    - Order not Delivered
    - Already finance_processed
    ========================================
    */

    if (result.skipped) {
      console.log(
        "FINANCE PROCESSING SKIPPED:",
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
      "FINANCE PROCESSING SUCCESS:",
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
      "PROCESS DELIVERED ORDER ERROR:",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Unknown Finance processing error.",

      orderId: String(
        orderId || ""
      ),
    };
  }
}