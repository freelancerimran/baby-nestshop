import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

import {
  processDeliveredOrder,
} from "@/lib/finance/process-delivered-order";

import {
  processCancelledOrder,
} from "@/lib/inventory/process-cancelled-order";

/*
==========================================
AUTO COURIER STATUS SYNC
==========================================

Steadfast is the source of truth for courier
status.

This route is designed for the Vercel Cron
running once every 24 hours.

IMPORTANT:
- Existing order status rules are preserved.
- Existing finance processor is preserved.
- Existing cancellation/stock processor is preserved.
- One failed courier request must NOT stop the rest.
- Large order volumes are handled with pagination.
- Temporary courier/API failures are retried.
- Slow courier requests have a timeout.
==========================================
*/

const STEADFAST_BASE_URL =
  "https://portal.packzy.com/api/v1/status_by_cid";

const PAGE_SIZE = 200;
const MAX_CONCURRENCY = 5;
const MAX_API_RETRIES = 3;
const API_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 1_000;

const sleep = (ms: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function fetchCourierStatus(
  consignmentId: string,
  apiKey: string,
  secretKey: string
): Promise<{
  ok: boolean;
  status?: number;
  result?: any;
  error?: string;
  attempts: number;
}> {
  let lastError = "Unknown courier API error.";

  for (
    let attempt = 1;
    attempt <= MAX_API_RETRIES;
    attempt++
  ) {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      API_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${STEADFAST_BASE_URL}/${encodeURIComponent(consignmentId)}`,
        {
          method: "GET",
          headers: {
            "Api-Key": apiKey,
            "Secret-Key": secretKey,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        }
      );

      const rawText = await response.text();

      let result: any = null;

      try {
        result = rawText
          ? JSON.parse(rawText)
          : null;
      } catch {
        lastError =
          `Invalid JSON response (HTTP ${response.status})`;

        if (attempt < MAX_API_RETRIES) {
          await sleep(
            RETRY_DELAY_MS * attempt
          );
          continue;
        }

        return {
          ok: false,
          status: response.status,
          error: lastError,
          attempts: attempt,
        };
      }

      const apiSuccess =
        response.ok &&
        Number(result?.status) === 200 &&
        Boolean(result?.delivery_status);

      if (apiSuccess) {
        return {
          ok: true,
          status: response.status,
          result,
          attempts: attempt,
        };
      }

      lastError =
        String(
          result?.message ||
            result?.error ||
            `Steadfast returned HTTP ${response.status}`
        );

      /*
      Retry only errors that may reasonably be
      temporary. Authentication/configuration
      errors should fail immediately.
      */
      const retryableHttp =
        response.status === 408 ||
        response.status === 425 ||
        response.status === 429 ||
        response.status >= 500;

      const retryableApiStatus =
        Number(result?.status) >= 500;

      if (
        attempt < MAX_API_RETRIES &&
        (retryableHttp || retryableApiStatus)
      ) {
        await sleep(
          RETRY_DELAY_MS * attempt
        );
        continue;
      }

      return {
        ok: false,
        status: response.status,
        result,
        error: lastError,
        attempts: attempt,
      };
    } catch (error) {
      lastError = getErrorMessage(error);

      if (attempt < MAX_API_RETRIES) {
        await sleep(
          RETRY_DELAY_MS * attempt
        );
        continue;
      }

      return {
        ok: false,
        error: lastError,
        attempts: attempt,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    ok: false,
    error: lastError,
    attempts: MAX_API_RETRIES,
  };
}

async function loadCourierOrders() {
  const allOrders: any[] = [];

  let from = 0;

  while (true) {
    const to =
      from + PAGE_SIZE - 1;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .not(
        "consignment_id",
        "is",
        null
      )
      .order("order_date", {
        ascending: true,
      })
      .range(from, to);

    if (error) {
      throw new Error(
        error.message ||
          "Unable to load courier orders."
      );
    }

    if (!data?.length) {
      break;
    }

    allOrders.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return allOrders;
}

async function processOneOrder(
  order: any,
  apiKey: string,
  secretKey: string
) {
  const consignmentId = String(
    order.consignment_id || ""
  ).trim();

  if (!consignmentId) {
    return {
      success: false,
      skipped: true,
      reason: "missing_consignment_id",
    };
  }

  const courierResponse =
    await fetchCourierStatus(
      consignmentId,
      apiKey,
      secretKey
    );

  if (!courierResponse.ok) {
    console.error(
      "CRON STEADFAST STATUS ERROR:",
      {
        orderId: order.order_id,
        consignmentId,
        attempts:
          courierResponse.attempts,
        status:
          courierResponse.status ?? null,
        error:
          courierResponse.error,
        result:
          courierResponse.result ?? null,
      }
    );

    return {
      success: false,
      reason: "courier_api_failed",
      error:
        courierResponse.error,
      attempts:
        courierResponse.attempts,
    };
  }

  const courierStatus = String(
    courierResponse.result
      ?.delivery_status || "unknown"
  )
    .trim()
    .toLowerCase();

  /*
  ========================================
  MAP COURIER → ORDER STATUS
  ========================================
  Existing Baby Nest mapping preserved.
  ========================================
  */

  let orderStatus =
    order.status || "Processing";

  if (
    courierStatus === "delivered"
  ) {
    orderStatus = "Delivered";
  } else if (
    courierStatus ===
    "delivered_approval_pending"
  ) {
    orderStatus = "Processing";
  } else if (
    courierStatus ===
      "partial_delivered" ||
    courierStatus ===
      "partial_delivered_approval_pending"
  ) {
    orderStatus =
      "Partial Delivered";
  } else if (
    courierStatus === "cancelled"
  ) {
    orderStatus = "Cancelled";
  } else if (
    courierStatus ===
    "cancelled_approval_pending"
  ) {
    orderStatus = "Processing";
  } else if (
    courierStatus === "pending" ||
    courierStatus === "in_review" ||
    courierStatus === "hold"
  ) {
    orderStatus = "Processing";
  }

  const orderUpdate: Record<
    string,
    unknown
  > = {
    courier_status:
      courierStatus,
    status: orderStatus,
    last_status_sync:
      new Date().toISOString(),
  };

  /*
  Confirmed COD delivery:
  customer paid the order.
  */
  if (
    courierStatus === "delivered"
  ) {
    const orderTotal = Number(
      order.total || 0
    );

    orderUpdate.payment_status =
      "Paid";
    orderUpdate.paid_amount =
      orderTotal;
    orderUpdate.due_amount = 0;
  }

  const {
    error: updateError,
  } = await supabaseAdmin
    .from("orders")
    .update(orderUpdate)
    .eq(
      "order_id",
      order.order_id
    );

  if (updateError) {
    console.error(
      "CRON ORDER UPDATE ERROR:",
      {
        orderId: order.order_id,
        courierStatus,
        error: updateError,
      }
    );

    return {
      success: false,
      reason: "order_update_failed",
      error: updateError.message,
    };
  }

  let financeResult: any = null;
  let stockRestoreResult: any = null;

  /*
  ========================================
  DELIVERED → FINANCE
  ========================================
  Existing processor preserved.
  ========================================
  */

  if (
    courierStatus === "delivered"
  ) {
    try {
      financeResult =
        await processDeliveredOrder(
          String(order.order_id)
        );
    } catch (error) {
      financeResult = {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  /*
  ========================================
  CANCELLED → STOCK RESTORE
  ========================================
  Existing processor preserved.
  ========================================
  */

  if (
    courierStatus === "cancelled"
  ) {
    try {
      stockRestoreResult =
        await processCancelledOrder(
          String(order.order_id)
        );
    } catch (error) {
      stockRestoreResult = {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  return {
    success: true,
    courierStatus,
    orderStatus,
    financeResult,
    stockRestoreResult,
    attempts:
      courierResponse.attempts,
  };
}

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number
) {
  let nextIndex = 0;

  async function runner() {
    while (true) {
      const index = nextIndex++;

      if (index >= items.length) {
        return;
      }

      await worker(items[index]);
    }
  }

  const workerCount = Math.min(
    concurrency,
    items.length
  );

  await Promise.all(
    Array.from(
      { length: workerCount },
      () => runner()
    )
  );
}

export async function GET(
  req: NextRequest
) {
  try {
    /*
    ========================================
    1. CRON AUTHORIZATION
    ========================================
    */

    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Cron secret is not configured.",
        },
        { status: 500 }
      );
    }

    const authorization =
      req.headers.get(
        "authorization"
      );

    if (
      authorization !==
      `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    /*
    ========================================
    2. ENVIRONMENT VALIDATION
    ========================================
    */

    const apiKey =
      process.env.STEADFAST_API_KEY;

    const secretKey =
      process.env.STEADFAST_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.error(
        "STEADFAST API credentials are not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Steadfast API credentials are not configured.",
        },
        { status: 500 }
      );
    }

    /*
    ========================================
    3. LOAD ALL COURIER ORDERS
    ========================================

    Pagination prevents large order volumes
    from being silently truncated.
    */

    const orders =
      await loadCourierOrders();

    /*
    ========================================
    COUNTERS
    ========================================
    */

    let updatedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    let financeProcessedCount = 0;
    let financeSkippedCount = 0;
    let financeFailedCount = 0;

    let stockRestoredCount = 0;
    let stockRestoreSkippedCount = 0;
    let stockRestoreFailedCount = 0;

    let failedCount = 0;
    let skippedCount = 0;

    const failures: Array<{
      orderId: string;
      consignmentId: string;
      reason: string;
      error?: string;
    }> = [];

    /*
    ========================================
    4. PROCESS ORDERS
    ========================================

    Limited concurrency means one slow/failing
    courier request cannot block every other
    order.
    */

    await runWithConcurrency(
      orders,
      async (order) => {
        try {
          const result =
            await processOneOrder(
              order,
              apiKey,
              secretKey
            );

          if (result.skipped) {
            skippedCount++;
            return;
          }

          if (!result.success) {
            failedCount++;

            failures.push({
              orderId: String(
                order.order_id
              ),
              consignmentId: String(
                order.consignment_id || ""
              ),
              reason: String(
                result.reason ||
                  "unknown"
              ),
              error:
                result.error
                  ? String(result.error)
                  : undefined,
            });

            return;
          }

          updatedCount++;

          if (
            result.courierStatus ===
            "delivered"
          ) {
            deliveredCount++;

            if (
              result.financeResult?.success &&
              result.financeResult?.skipped
            ) {
              financeSkippedCount++;
            } else if (
              result.financeResult?.success
            ) {
              financeProcessedCount++;
            } else {
              financeFailedCount++;

              failures.push({
                orderId: String(
                  order.order_id
                ),
                consignmentId: String(
                  order.consignment_id || ""
                ),
                reason:
                  "finance_processing_failed",
                error:
                  result.financeResult
                    ?.error
                    ? String(
                        result.financeResult
                          .error
                      )
                    : undefined,
              });
            }
          }

          if (
            result.courierStatus ===
            "cancelled"
          ) {
            cancelledCount++;

            if (
              result.stockRestoreResult?.success &&
              result.stockRestoreResult?.skipped
            ) {
              stockRestoreSkippedCount++;
            } else if (
              result.stockRestoreResult?.success
            ) {
              stockRestoredCount++;
            } else {
              stockRestoreFailedCount++;

              failures.push({
                orderId: String(
                  order.order_id
                ),
                consignmentId: String(
                  order.consignment_id || ""
                ),
                reason:
                  "stock_restore_failed",
                error:
                  result.stockRestoreResult
                    ?.error
                    ? String(
                        result.stockRestoreResult
                          .error
                      )
                    : undefined,
              });
            }
          }
        } catch (error) {
          failedCount++;

          const failure = {
            orderId: String(
              order.order_id
            ),
            consignmentId: String(
              order.consignment_id || ""
            ),
            reason: "order_processing_failed",
            error:
              getErrorMessage(error),
          };

          failures.push(failure);

          console.error(
            "CRON SINGLE ORDER ERROR:",
            failure
          );
        }
      },
      MAX_CONCURRENCY
    );

    /*
    ========================================
    5. FINAL RESPONSE
    ========================================
    */

    return NextResponse.json({
      success: true,
      source: "courier-cron",
      totalOrders: orders.length,
      updatedCount,
      failedCount,
      skippedCount,
      deliveredCount,
      cancelledCount,
      financeProcessedCount,
      financeSkippedCount,
      financeFailedCount,
      stockRestoredCount,
      stockRestoreSkippedCount,
      stockRestoreFailedCount,
      failures: failures.slice(0, 100),
      failureCount: failures.length,
      syncedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "AUTO COURIER SYNC ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Automatic courier sync failed.",
      },
      { status: 500 }
    );
  }
}
