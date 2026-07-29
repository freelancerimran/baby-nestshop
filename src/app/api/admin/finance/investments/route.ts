import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";


// ==========================================
// GET ALL INVESTMENTS
// ==========================================

export async function GET() {
  try {
    const { data, error } =
      await supabaseAdmin
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

    if (error) {
      console.error(
        "FINANCE GET ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          investments: [],
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const investments = (data || []).map(
      (batch: any) => {
        const items =
          batch.investment_items || [];

        // ----------------------------------
        // PRODUCT COST
        // ----------------------------------

        const productCost =
          items.reduce(
            (
              total: number,
              item: any
            ) =>
              total +
              Number(
                item.quantity || 0
              ) *
                Number(
                  item.unit_cost || 0
                ),
            0
          );

        // ----------------------------------
        // EXTRA COSTS
        // ----------------------------------

        const shippingCost =
          Number(
            batch.shipping_cost || 0
          );

        const customsCost =
          Number(
            batch.customs_cost || 0
          );

        const packagingCost =
          Number(
            batch.packaging_cost || 0
          );

        const otherCost =
          Number(
            batch.other_cost || 0
          );

        const extraCost =
          shippingCost +
          customsCost +
          packagingCost +
          otherCost;

        // ----------------------------------
        // TOTAL INVESTMENT
        // ----------------------------------

        const totalInvestment =
          productCost + extraCost;

        // ----------------------------------
        // POTENTIAL REVENUE
        // ----------------------------------

        const potentialRevenue =
          items.reduce(
            (
              total: number,
              item: any
            ) =>
              total +
              Number(
                item.quantity || 0
              ) *
                Number(
                  item.selling_price || 0
                ),
            0
          );

        // ----------------------------------
        // POTENTIAL PROFIT
        // ----------------------------------

        const potentialProfit =
          potentialRevenue -
          totalInvestment;

        // ----------------------------------
        // QUANTITY
        // ----------------------------------

        const totalUnits =
          items.reduce(
            (
              total: number,
              item: any
            ) =>
              total +
              Number(
                item.quantity || 0
              ),
            0
          );

        const soldUnits =
          items.reduce(
            (
              total: number,
              item: any
            ) =>
              total +
              Number(
                item.sold_quantity || 0
              ),
            0
          );

        const remainingUnits =
          Math.max(
            totalUnits - soldUnits,
            0
          );

        // ----------------------------------
        // ACTUAL REVENUE
        // Phase 1:
        // sold quantity × batch selling price
        // ----------------------------------

        const actualRevenue =
          items.reduce(
            (
              total: number,
              item: any
            ) =>
              total +
              Number(
                item.sold_quantity || 0
              ) *
                Number(
                  item.selling_price || 0
                ),
            0
          );

        // ----------------------------------
        // COST OF SOLD PRODUCTS
        // ----------------------------------

        const soldProductCost =
          items.reduce(
            (
              total: number,
              item: any
            ) =>
              total +
              Number(
                item.sold_quantity || 0
              ) *
                Number(
                  item.unit_cost || 0
                ),
            0
          );

        // Allocate extra costs proportionally
        // based on sold units.

        const soldRatio =
          totalUnits > 0
            ? soldUnits /
              totalUnits
            : 0;

        const allocatedExtraCost =
          extraCost *
          soldRatio;

        const realizedCost =
          soldProductCost +
          allocatedExtraCost;

        // ----------------------------------
        // REALIZED PROFIT
        // ----------------------------------

        const realizedProfit =
          actualRevenue -
          realizedCost;

        // ----------------------------------
        // INVESTMENT RECOVERY
        // ----------------------------------

        const recoveryPercentage =
          totalInvestment > 0
            ? Math.min(
                (actualRevenue /
                  totalInvestment) *
                  100,
                100
              )
            : 0;

        return {
          id: batch.id,

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
          realizedCost,
          realizedProfit,

          totalUnits,
          soldUnits,
          remainingUnits,

          recoveryPercentage,

          items: items.map(
            (item: any) => ({
              id: item.id,

              productId:
                item.product_id,

              productName:
                item.product_name,

              quantity:
                Number(
                  item.quantity || 0
                ),

              unitCost:
                Number(
                  item.unit_cost || 0
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
                    item.quantity || 0
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

    // ======================================
    // LIFETIME SUMMARY
    // ======================================

    const summary =
      investments.reduce(
        (
          totals: any,
          investment: any
        ) => {
          totals.totalInvestment +=
            investment.totalInvestment;

          totals.potentialRevenue +=
            investment.potentialRevenue;

          totals.potentialProfit +=
            investment.potentialProfit;

          totals.actualRevenue +=
            investment.actualRevenue;

          totals.realizedProfit +=
            investment.realizedProfit;

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
          actualRevenue: 0,
          realizedProfit: 0,

          totalUnits: 0,
          soldUnits: 0,
          remainingUnits: 0,
        }
      );

    const roi =
      summary.totalInvestment > 0
        ? (summary.realizedProfit /
            summary.totalInvestment) *
          100
        : 0;

    return NextResponse.json({
      success: true,

      summary: {
        ...summary,
        roi,
        totalBatches:
          investments.length,
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


// ==========================================
// CREATE NEW INVESTMENT
// ==========================================

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

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

    // ======================================
    // VALIDATION
    // ======================================

    if (
      !investmentName ||
      !investmentName.trim()
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

    for (const item of items) {
      if (!item.productName) {
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
        Number(item.quantity) <= 0
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
        Number(item.unitCost) < 0 ||
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

    // ======================================
    // GENERATE INVESTMENT CODE
    // ======================================

    const now = new Date();

    const year =
      now.getFullYear();

    const timestamp =
      Date.now()
        .toString()
        .slice(-6);

    const investmentCode =
      `INV-${year}-${timestamp}`;

    // ======================================
    // CREATE INVESTMENT BATCH
    // ======================================

    const {
      data: batch,
      error: batchError,
    } = await supabaseAdmin
      .from("investment_batches")
      .insert({
        investment_code:
          investmentCode,

        investment_name:
          investmentName.trim(),

        investment_date:
          investmentDate ||
          now
            .toISOString()
            .split("T")[0],

        supplier:
          supplier?.trim() ||
          null,

        shipping_cost:
          Number(
            shippingCost || 0
          ),

        customs_cost:
          Number(
            customsCost || 0
          ),

        packaging_cost:
          Number(
            packagingCost || 0
          ),

        other_cost:
          Number(
            otherCost || 0
          ),

        notes:
          notes?.trim() ||
          null,

        status: "active",

        updated_at:
          now.toISOString(),
      })
      .select()
      .single();

    if (batchError || !batch) {
      console.error(
        "CREATE BATCH ERROR:",
        batchError
      );

      throw new Error(
        batchError?.message ||
          "Investment batch creation failed."
      );
    }

    // ======================================
    // CREATE INVESTMENT ITEMS
    // ======================================

    const investmentItems =
      items.map(
        (item: any) => ({
          investment_id:
            batch.id,

          product_id:
            item.productId ||
            null,

          product_name:
            item.productName,

          quantity:
            Number(
              item.quantity
            ),

          unit_cost:
            Number(
              item.unitCost || 0
            ),

          selling_price:
            Number(
              item.sellingPrice ||
                0
            ),

          sold_quantity: 0,

          updated_at:
            now.toISOString(),
        })
      );

    const {
      data: createdItems,
      error: itemsError,
    } = await supabaseAdmin
      .from("investment_items")
      .insert(
        investmentItems
      )
      .select();

    if (itemsError) {
      console.error(
        "CREATE ITEMS ERROR:",
        itemsError
      );

      // Remove batch if item creation fails.
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