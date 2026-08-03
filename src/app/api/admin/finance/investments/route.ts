import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==========================================
GET ALL INVESTMENTS + FINANCE SUMMARY
==========================================
*/

export async function GET() {
  try {
    /*
    ========================================
    1. LOAD INVESTMENTS
    ========================================
    */

    const {
      data: batches,
      error: batchesError,
    } = await supabaseAdmin
      .from("investment_batches")
      .select(`
        *,
        investment_items (*)
      `)
      .order("investment_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (batchesError) {
      console.error(
        "FINANCE INVESTMENTS GET ERROR:",
        batchesError
      );

      return NextResponse.json(
        {
          success: false,
          investments: [],
          error:
            batchesError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    2. LOAD FINANCE SALES LEDGER
    ========================================

    finance_sales is the source of truth
    for confirmed delivered revenue,
    realized costs and realized profit.
    ========================================
    */

    const {
      data: financeSales,
      error: financeSalesError,
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

    if (financeSalesError) {
      console.error(
        "FINANCE SALES GET ERROR:",
        financeSalesError
      );

      return NextResponse.json(
        {
          success: false,
          investments: [],
          error:
            financeSalesError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    3. BUILD LEDGER MAP BY INVESTMENT
    ========================================
    */

    const salesByInvestment =
      new Map<
        string,
        {
          actualRevenue: number;
          actualProductCost: number;
          allocatedExtraCost: number;
          realizedCost: number;
          realizedProfit: number;
          salesCount: number;
          soldUnits: number;
        }
      >();

    for (
      const sale of
        financeSales || []
    ) {
      const investmentId =
        String(
          sale.investment_id ??
            ""
        );

      if (!investmentId) {
        continue;
      }

      const current =
        salesByInvestment.get(
          investmentId
        ) || {
          actualRevenue: 0,
          actualProductCost: 0,
          allocatedExtraCost: 0,
          realizedCost: 0,
          realizedProfit: 0,
          salesCount: 0,
          soldUnits: 0,
        };

      current.actualRevenue +=
        Number(
          sale.product_revenue ||
            0
        );

      current.actualProductCost +=
        Number(
          sale.cost_of_goods ||
            0
        );

      current.allocatedExtraCost +=
        Number(
          sale.allocated_extra_cost ||
            0
        );

      current.realizedCost +=
        Number(
          sale.landed_cost ||
            0
        );

      current.realizedProfit +=
        Number(
          sale.gross_profit ||
            0
        );

      current.salesCount += 1;

      current.soldUnits +=
        Number(
          sale.quantity ||
            0
        );

      salesByInvestment.set(
        investmentId,
        current
      );
    }

    /*
    ========================================
    4. FORMAT INVESTMENTS
    ========================================
    */

    const investments =
      (batches || []).map(
        (batch: any) => {
          const items =
            Array.isArray(
              batch.investment_items
            )
              ? batch.investment_items
              : [];

          /*
          ================================
          PRODUCT COST
          ================================
          */

          const productCost =
            items.reduce(
              (
                total: number,
                item: any
              ) =>
                total +
                Number(
                  item.quantity ||
                    0
                ) *
                  Number(
                    item.unit_cost ||
                      0
                  ),
              0
            );

          /*
          ================================
          EXTRA COST
          ================================
          */

          const shippingCost =
            Number(
              batch.shipping_cost ||
                0
            );

          const customsCost =
            Number(
              batch.customs_cost ||
                0
            );

          const packagingCost =
            Number(
              batch.packaging_cost ||
                0
            );

          const otherCost =
            Number(
              batch.other_cost ||
                0
            );

          const extraCost =
            shippingCost +
            customsCost +
            packagingCost +
            otherCost;

          /*
          ================================
          TOTAL INVESTMENT
          ================================
          */

          const totalInvestment =
            productCost +
            extraCost;

          /*
          ================================
          POTENTIAL REVENUE
          ================================
          */

          const potentialRevenue =
            items.reduce(
              (
                total: number,
                item: any
              ) =>
                total +
                Number(
                  item.quantity ||
                    0
                ) *
                  Number(
                    item.selling_price ||
                      0
                  ),
              0
            );

          /*
          ================================
          POTENTIAL PROFIT
          ================================
          */

          const potentialProfit =
            potentialRevenue -
            totalInvestment;

          /*
          ================================
          PURCHASED UNITS
          ================================
          */

          const totalUnits =
            items.reduce(
              (
                total: number,
                item: any
              ) =>
                total +
                Number(
                  item.quantity ||
                    0
                ),
              0
            );

          /*
          ================================
          SOLD UNITS

          Source:
          investment_items.sold_quantity

          This is updated by the
          transaction-safe Finance RPC.
          ================================
          */

          const soldUnits =
            items.reduce(
              (
                total: number,
                item: any
              ) =>
                total +
                Number(
                  item.sold_quantity ||
                    0
                ),
              0
            );

          const remainingUnits =
            Math.max(
              totalUnits -
                soldUnits,
              0
            );

          /*
          ================================
          ACTUAL FINANCE

          Source:
          finance_sales ledger
          ================================
          */

          const ledger =
            salesByInvestment.get(
              String(
                batch.id
              )
            ) || {
              actualRevenue: 0,
              actualProductCost: 0,
              allocatedExtraCost: 0,
              realizedCost: 0,
              realizedProfit: 0,
              salesCount: 0,
              soldUnits: 0,
            };

          const actualRevenue =
            ledger.actualRevenue;

          const actualProductCost =
            ledger.actualProductCost;

          const allocatedExtraCost =
            ledger.allocatedExtraCost;

          const realizedCost =
            ledger.realizedCost;

          const realizedProfit =
            ledger.realizedProfit;

          const salesCount =
            ledger.salesCount;

          /*
          ================================
          INVESTMENT RECOVERY
          ================================
          */

          const recoveryPercentage =
            totalInvestment > 0
              ? Math.min(
                  (
                    actualRevenue /
                    totalInvestment
                  ) * 100,
                  100
                )
              : 0;

          /*
          ================================
          BATCH ROI
          ================================
          */

          const roi =
            totalInvestment > 0
              ? (
                  realizedProfit /
                  totalInvestment
                ) * 100
              : 0;

          /*
          ================================
          RETURN INVESTMENT
          ================================
          */

          return {
            id:
              batch.id,

            investmentCode:
              batch.investment_code,

            investmentName:
              batch.investment_name,

            investmentDate:
              batch.investment_date,

            supplier:
              batch.supplier,

            status:
              batch.status,

            notes:
              batch.notes,

            shippingCost,
            customsCost,
            packagingCost,
            otherCost,

            productCost,
            extraCost,

            totalInvestment,

            potentialRevenue,
            potentialProfit,

            actualRevenue,
            actualProductCost,
            allocatedExtraCost,
            realizedCost,
            realizedProfit,

            recoveryPercentage,
            roi,

            salesCount,

            totalUnits,
            soldUnits,
            remainingUnits,

            items:
              items.map(
                (item: any) => ({
                  id:
                    item.id,

                  productId:
                    item.product_id,

                  productName:
                    item.product_name,

                  quantity:
                    Number(
                      item.quantity ||
                        0
                    ),

                  unitCost:
                    Number(
                      item.unit_cost ||
                        0
                    ),

                  sellingPrice:
                    Number(
                      item.selling_price ||
                        0
                    ),

                  soldQuantity:
                    Number(
                      item.sold_quantity ||
                        0
                    ),

                  remainingQuantity:
                    Math.max(
                      Number(
                        item.quantity ||
                          0
                      ) -
                        Number(
                          item.sold_quantity ||
                            0
                        ),
                      0
                    ),
                })
              ),

            createdAt:
              batch.created_at,

            updatedAt:
              batch.updated_at,
          };
        }
      );

    /*
    ========================================
    5. LIFETIME INVESTMENT SUMMARY
    ========================================
    */

    const investmentSummary =
      investments.reduce(
        (
          totals,
          investment
        ) => {
          totals.totalInvestment +=
            investment.totalInvestment;

          totals.potentialRevenue +=
            investment.potentialRevenue;

          totals.potentialProfit +=
            investment.potentialProfit;

          totals.totalUnits +=
            investment.totalUnits;

          totals.soldUnits +=
            investment.soldUnits;

          totals.remainingUnits +=
            investment.remainingUnits;

          return totals;
        },
        {
          totalInvestment: 0,
          potentialRevenue: 0,
          potentialProfit: 0,

          totalUnits: 0,
          soldUnits: 0,
          remainingUnits: 0,
        }
      );

    /*
    ========================================
    6. LIFETIME ACTUAL FINANCE SUMMARY
    ========================================

    We calculate actual financial values
    directly from the immutable ledger.

    This avoids estimated realized profit.
    ========================================
    */

    const actualSummary =
      (financeSales || []).reduce(
        (
          totals,
          sale: any
        ) => {
          totals.actualRevenue +=
            Number(
              sale.product_revenue ||
                0
            );

          totals.actualProductCost +=
            Number(
              sale.cost_of_goods ||
                0
            );

          totals.allocatedExtraCost +=
            Number(
              sale.allocated_extra_cost ||
                0
            );

          totals.realizedCost +=
            Number(
              sale.landed_cost ||
                0
            );

          totals.realizedProfit +=
            Number(
              sale.gross_profit ||
                0
            );

          totals.salesCount += 1;

          return totals;
        },
        {
          actualRevenue: 0,
          actualProductCost: 0,
          allocatedExtraCost: 0,
          realizedCost: 0,
          realizedProfit: 0,
          salesCount: 0,
        }
      );

    /*
    ========================================
    7. ROI
    ========================================

    Realized Profit / Total Investment
    ========================================
    */

    const roi =
      investmentSummary
        .totalInvestment > 0
        ? (
            actualSummary
              .realizedProfit /
            investmentSummary
              .totalInvestment
          ) * 100
        : 0;

    /*
    ========================================
    8. INVESTMENT RECOVERY
    ========================================

    Actual delivered product revenue
    compared with total invested capital.

    UI caps display at 100%.
    ========================================
    */

    const recoveryPercentage =
      investmentSummary
        .totalInvestment > 0
        ? Math.min(
            (
              actualSummary
                .actualRevenue /
              investmentSummary
                .totalInvestment
            ) * 100,
            100
          )
        : 0;

    /*
    ========================================
    9. SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      summary: {
        /*
        ================================
        INVESTMENT
        ================================
        */

        totalInvestment:
          investmentSummary
            .totalInvestment,

        totalBatches:
          investments.length,

        /*
        ================================
        POTENTIAL
        ================================
        */

        potentialRevenue:
          investmentSummary
            .potentialRevenue,

        potentialProfit:
          investmentSummary
            .potentialProfit,

        /*
        ================================
        ACTUAL FINANCE
        ================================
        */

        actualRevenue:
          actualSummary
            .actualRevenue,

        actualProductCost:
          actualSummary
            .actualProductCost,

        /*
        Compatibility alias for UI.
        */

        costOfGoods:
          actualSummary
            .actualProductCost,

        allocatedExtraCost:
          actualSummary
            .allocatedExtraCost,

        realizedCost:
          actualSummary
            .realizedCost,

        realizedProfit:
          actualSummary
            .realizedProfit,

        /*
        ================================
        INVENTORY
        ================================
        */

        totalUnits:
          investmentSummary
            .totalUnits,

        soldUnits:
          investmentSummary
            .soldUnits,

        remainingUnits:
          investmentSummary
            .remainingUnits,

        /*
        ================================
        PERFORMANCE
        ================================
        */

        roi,

        recoveryPercentage,

        salesCount:
          actualSummary
            .salesCount,
      },

      investments,
    });
  } catch (error) {
    console.error(
      "FINANCE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        investments: [],

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

/*
==========================================
CREATE NEW INVESTMENT
==========================================
*/

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const {
      investmentName,
      investmentDate,
      supplier,

      shippingCost = 0,
      customsCost = 0,
      packagingCost = 0,
      otherCost = 0,

      notes,

      items = [],
    } = body;

    /*
    ========================================
    1. VALIDATE INVESTMENT NAME
    ========================================
    */

    if (
      !investmentName ||
      !String(
        investmentName
      ).trim()
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Investment name is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    2. VALIDATE ITEMS
    ========================================
    */

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Add at least one product.",
        },
        {
          status: 400,
        }
      );
    }

    for (
      const item of items
    ) {
      if (
        !item.productName ||
        !String(
          item.productName
        ).trim()
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Product name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        Number(
          item.quantity
        ) <= 0
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Product quantity must be greater than 0.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        Number(
          item.unitCost
        ) < 0 ||
        Number(
          item.sellingPrice
        ) < 0
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Product cost and selling price cannot be negative.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    ========================================
    3. GENERATE INVESTMENT CODE
    ========================================
    */

    const now =
      new Date();

    const year =
      now.getFullYear();

    const timestamp =
      Date.now()
        .toString()
        .slice(-6);

    const investmentCode =
      `INV-${year}-${timestamp}`;

    /*
    ========================================
    4. CREATE INVESTMENT BATCH
    ========================================
    */

    const {
      data: batch,
      error: batchError,
    } = await supabaseAdmin
      .from(
        "investment_batches"
      )
      .insert({
        investment_code:
          investmentCode,

        investment_name:
          String(
            investmentName
          ).trim(),

        investment_date:
          investmentDate ||
          now
            .toISOString()
            .split("T")[0],

        supplier:
          supplier
            ? String(
                supplier
              ).trim()
            : null,

        shipping_cost:
          Number(
            shippingCost ||
              0
          ),

        customs_cost:
          Number(
            customsCost ||
              0
          ),

        packaging_cost:
          Number(
            packagingCost ||
              0
          ),

        other_cost:
          Number(
            otherCost ||
              0
          ),

        notes:
          notes
            ? String(
                notes
              ).trim()
            : null,

        status:
          "active",

        updated_at:
          now.toISOString(),
      })
      .select()
      .single();

    if (
      batchError ||
      !batch
    ) {
      console.error(
        "CREATE INVESTMENT BATCH ERROR:",
        batchError
      );

      throw new Error(
        batchError?.message ||
          "Investment batch creation failed."
      );
    }

    /*
    ========================================
    5. CREATE INVESTMENT ITEMS
    ========================================
    */

    const investmentItems =
      items.map(
        (item: any) => ({
          investment_id:
            batch.id,

          product_id:
            item.productId !=
            null
              ? String(
                  item.productId
                )
              : null,

          product_name:
            String(
              item.productName
            ).trim(),

          quantity:
            Number(
              item.quantity
            ),

          unit_cost:
            Number(
              item.unitCost ||
                0
            ),

          selling_price:
            Number(
              item.sellingPrice ||
                0
            ),

          sold_quantity:
            0,

          updated_at:
            now.toISOString(),
        })
      );

    const {
      data: createdItems,
      error: itemsError,
    } = await supabaseAdmin
      .from(
        "investment_items"
      )
      .insert(
        investmentItems
      )
      .select();

    if (itemsError) {
      console.error(
        "CREATE INVESTMENT ITEMS ERROR:",
        itemsError
      );

      /*
      Remove batch if item creation
      fails.

      This prevents an empty investment
      batch remaining in Finance.
      */

      await supabaseAdmin
        .from(
          "investment_batches"
        )
        .delete()
        .eq(
          "id",
          batch.id
        );

      throw new Error(
        itemsError.message
      );
    }

    /*
    ========================================
    6. SUCCESS
    ========================================
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Investment created successfully.",

        investment: {
          ...batch,

          items:
            createdItems ||
            [],
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "FINANCE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Investment creation failed.",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}