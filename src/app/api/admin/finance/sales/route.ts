import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==========================================
GET FINANCE SALES HISTORY
==========================================

This API reads the immutable Finance ledger.

Source:
finance_sales

Each row represents an allocation created
when a confirmed delivered order is
processed through Finance.

Important:

One order may have multiple rows if FIFO
allocation uses stock from multiple
investment batches/items.
==========================================
*/

export async function GET() {
  try {
    /*
    ========================================
    GET FINANCE SALES
    ========================================
    */

    const {
      data: sales,
      error: salesError,
    } = await supabaseAdmin
      .from("finance_sales")
      .select(`
        id,
        order_id,
        investment_item_id,
        investment_id,
        product_id,
        product_name,
        quantity,
        unit_cost,
        selling_price,
        product_revenue,
        cost_of_goods,
        allocated_extra_cost,
        landed_cost,
        gross_profit,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (salesError) {
      console.error(
        "FINANCE SALES FETCH ERROR:",
        salesError
      );

      return NextResponse.json(
        {
          success: false,
          sales: [],
          message:
            salesError.message ||
            "Failed to load Finance sales.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    GET INVESTMENT BATCHES
    ========================================

    We fetch batches separately instead of
    depending on an embedded Supabase
    relationship.

    This keeps the API working even if the
    database foreign-key relationship is
    changed later.
    ========================================
    */

    const investmentIds = Array.from(
      new Set(
        (sales || [])
          .map((sale: any) =>
            sale.investment_id != null
              ? String(
                  sale.investment_id
                )
              : null
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
      )
    );

    let investmentMap =
      new Map<
        string,
        {
          id: number | string;
          investmentCode: string;
          investmentName: string;
          investmentDate:
            | string
            | null;
        }
      >();

    if (
      investmentIds.length > 0
    ) {
      const {
        data: batches,
        error: batchesError,
      } = await supabaseAdmin
        .from(
          "investment_batches"
        )
        .select(`
          id,
          investment_code,
          investment_name,
          investment_date
        `)
        .in(
          "id",
          investmentIds
        );

      if (batchesError) {
        console.error(
          "FINANCE SALES BATCH FETCH ERROR:",
          batchesError
        );

        return NextResponse.json(
          {
            success: false,
            sales: [],
            message:
              batchesError.message ||
              "Failed to load investment information.",
          },
          {
            status: 500,
          }
        );
      }

      investmentMap =
        new Map(
          (batches || []).map(
            (batch: any) => [
              String(
                batch.id
              ),
              {
                id:
                  batch.id,

                investmentCode:
                  batch.investment_code ||
                  "",

                investmentName:
                  batch.investment_name ||
                  "",

                investmentDate:
                  batch.investment_date ||
                  null,
              },
            ]
          )
        );
    }

    /*
    ========================================
    FORMAT SALES
    ========================================
    */

    const formattedSales =
      (sales || []).map(
        (sale: any) => {
          const investment =
            sale.investment_id !=
            null
              ? investmentMap.get(
                  String(
                    sale.investment_id
                  )
                )
              : undefined;

          return {
            id:
              sale.id,

            orderId:
              sale.order_id,

            investmentItemId:
              sale.investment_item_id,

            investmentId:
              sale.investment_id,

            investmentCode:
              investment
                ?.investmentCode ||
              "",

            investmentName:
              investment
                ?.investmentName ||
              "",

            investmentDate:
              investment
                ?.investmentDate ||
              null,

            productId:
              sale.product_id,

            productName:
              sale.product_name,

            quantity:
              Number(
                sale.quantity ||
                  0
              ),

            unitCost:
              Number(
                sale.unit_cost ||
                  0
              ),

            sellingPrice:
              Number(
                sale.selling_price ||
                  0
              ),

            productRevenue:
              Number(
                sale.product_revenue ||
                  0
              ),

            costOfGoods:
              Number(
                sale.cost_of_goods ||
                  0
              ),

            allocatedExtraCost:
              Number(
                sale.allocated_extra_cost ||
                  0
              ),

            landedCost:
              Number(
                sale.landed_cost ||
                  0
              ),

            grossProfit:
              Number(
                sale.gross_profit ||
                  0
              ),

            createdAt:
              sale.created_at,
          };
        }
      );

    /*
    ========================================
    SALES SUMMARY
    ========================================
    */

    const summary =
      formattedSales.reduce(
        (
          totals,
          sale
        ) => {
          totals.totalAllocations +=
            1;

          totals.totalQuantity +=
            sale.quantity;

          totals.totalRevenue +=
            sale.productRevenue;

          totals.totalProductCost +=
            sale.costOfGoods;

          totals.totalAllocatedExtraCost +=
            sale.allocatedExtraCost;

          totals.totalLandedCost +=
            sale.landedCost;

          totals.totalProfit +=
            sale.grossProfit;

          return totals;
        },
        {
          totalAllocations: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          totalProductCost: 0,
          totalAllocatedExtraCost:
            0,
          totalLandedCost: 0,
          totalProfit: 0,
        }
      );

    /*
    ========================================
    UNIQUE DELIVERED ORDERS
    ========================================

    Multiple FIFO allocations can belong to
    the same delivered order.
    ========================================
    */

    const uniqueOrderIds =
      new Set(
        formattedSales
          .map(
            (sale) =>
              sale.orderId
          )
          .filter(Boolean)
      );

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      summary: {
        ...summary,

        totalOrders:
          uniqueOrderIds.size,
      },

      sales:
        formattedSales,
    });
  } catch (error) {
    /*
    ========================================
    UNEXPECTED ERROR
    ========================================
    */

    console.error(
      "FINANCE SALES API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        sales: [],

        message:
          error instanceof Error
            ? error.message
            : "Failed to load Finance sales.",
      },
      {
        status: 500,
      }
    );
  }
}