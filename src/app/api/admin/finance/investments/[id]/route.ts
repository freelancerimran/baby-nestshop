import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==================================================
HELPERS
==================================================
*/

function toNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function calculateInvestment(
  batch: any,
  items: any[]
) {
  // ==============================================
  // PRODUCT COST
  // ==============================================

  const productCost = items.reduce(
    (total, item) =>
      total +
      toNumber(item.quantity) *
        toNumber(item.unit_cost),
    0
  );

  // ==============================================
  // ADDITIONAL COSTS
  // ==============================================

  const shippingCost = toNumber(
    batch.shipping_cost
  );

  const customsCost = toNumber(
    batch.customs_cost
  );

  const packagingCost = toNumber(
    batch.packaging_cost
  );

  const otherCost = toNumber(
    batch.other_cost
  );

  const extraCost =
    shippingCost +
    customsCost +
    packagingCost +
    otherCost;

  // ==============================================
  // TOTAL INVESTMENT
  // ==============================================

  const totalInvestment =
    productCost + extraCost;

  // ==============================================
  // POTENTIAL REVENUE
  // ==============================================

  const potentialRevenue = items.reduce(
    (total, item) =>
      total +
      toNumber(item.quantity) *
        toNumber(item.selling_price),
    0
  );

  // ==============================================
  // POTENTIAL PROFIT
  // ==============================================

  const potentialProfit =
    potentialRevenue -
    totalInvestment;

  // ==============================================
  // STOCK
  // ==============================================

  const totalUnits = items.reduce(
    (total, item) =>
      total +
      toNumber(item.quantity),
    0
  );

  const soldUnits = items.reduce(
    (total, item) =>
      total +
      toNumber(item.sold_quantity),
    0
  );

  const remainingUnits = Math.max(
    totalUnits - soldUnits,
    0
  );

  // ==============================================
  // ACTUAL REVENUE
  // ==============================================

  const actualRevenue = items.reduce(
    (total, item) =>
      total +
      toNumber(item.sold_quantity) *
        toNumber(item.selling_price),
    0
  );

  // ==============================================
  // SOLD PRODUCT COST
  // ==============================================

  const soldProductCost = items.reduce(
    (total, item) =>
      total +
      toNumber(item.sold_quantity) *
        toNumber(item.unit_cost),
    0
  );

  // ==============================================
  // ALLOCATED ADDITIONAL COST
  // ==============================================

  const soldRatio =
    totalUnits > 0
      ? soldUnits / totalUnits
      : 0;

  const allocatedExtraCost =
    extraCost * soldRatio;

  const realizedCost =
    soldProductCost +
    allocatedExtraCost;

  // ==============================================
  // REALIZED PROFIT
  // ==============================================

  const realizedProfit =
    actualRevenue -
    realizedCost;

  // ==============================================
  // INVESTMENT RECOVERY
  // ==============================================

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
  };
}

/*
==================================================
GET SINGLE INVESTMENT
GET /api/admin/finance/investments/[id]
==================================================
*/

export async function GET(
  _req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Investment ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ==============================================
    // LOAD INVESTMENT
    // ==============================================

    const {
      data: batch,
      error,
    } = await supabaseAdmin
      .from("investment_batches")
      .select(`
        *,
        investment_items (*)
      `)
      .eq("id", id)
      .single();

    if (error || !batch) {
      console.error(
        "GET INVESTMENT ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error?.message ||
            "Investment not found.",
        },
        {
          status: 404,
        }
      );
    }

    const items =
      batch.investment_items || [];

    const calculations =
      calculateInvestment(
        batch,
        items
      );

    // ==============================================
    // FORMAT RESPONSE
    // ==============================================

    const investment = {
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

      ...calculations,

      items: items.map(
        (item: any) => ({
          id: item.id,

          productId:
            item.product_id,

          productName:
            item.product_name,

          quantity:
            toNumber(
              item.quantity
            ),

          unitCost:
            toNumber(
              item.unit_cost
            ),

          sellingPrice:
            toNumber(
              item.selling_price
            ),

          soldQuantity:
            toNumber(
              item.sold_quantity
            ),

          remainingQuantity:
            Math.max(
              toNumber(
                item.quantity
              ) -
                toNumber(
                  item.sold_quantity
                ),
              0
            ),

          createdAt:
            item.created_at,

          updatedAt:
            item.updated_at,
        })
      ),

      createdAt:
        batch.created_at,

      updatedAt:
        batch.updated_at,
    };

    return NextResponse.json({
      success: true,
      investment,
    });
  } catch (error) {
    console.error(
      "GET SINGLE INVESTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

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
==================================================
UPDATE INVESTMENT
PUT /api/admin/finance/investments/[id]
==================================================
*/

export async function PUT(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    const body =
      await req.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Investment ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      investmentName,
      investmentDate,
      supplier,

      shippingCost = 0,
      customsCost = 0,
      packagingCost = 0,
      otherCost = 0,

      notes,

      status,

      items = [],
    } = body;

    /*
    ================================================
    VALIDATION
    ================================================
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
          error:
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
          error:
            "Add at least one product.",
        },
        {
          status: 400,
        }
      );
    }

    for (const item of items) {
      if (
        !item.productName ||
        !String(
          item.productName
        ).trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Product name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        toNumber(
          item.quantity
        ) <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Product quantity must be greater than 0.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        toNumber(
          item.unitCost
        ) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unit cost cannot be negative.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        toNumber(
          item.sellingPrice
        ) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selling price cannot be negative.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    ================================================
    CHECK EXISTING INVESTMENT
    ================================================
    */

    const {
      data: existingBatch,
      error: existingBatchError,
    } = await supabaseAdmin
      .from("investment_batches")
      .select(`
        *,
        investment_items (*)
      `)
      .eq("id", id)
      .single();

    if (
      existingBatchError ||
      !existingBatch
    ) {
      console.error(
        "INVESTMENT LOOKUP ERROR:",
        existingBatchError
      );

      return NextResponse.json(
        {
          success: false,

          error:
            existingBatchError?.message ||
            "Investment not found.",
        },
        {
          status: 404,
        }
      );
    }

    const existingItems =
      existingBatch.investment_items ||
      [];

    /*
    ================================================
    SALES SAFETY VALIDATION
    ================================================

    Once units have been sold, purchased quantity
    cannot be reduced below sold quantity.
    ================================================
    */

    for (const item of items) {
      const existingItem =
        existingItems.find(
          (existing: any) =>
            String(existing.id) ===
              String(item.id) ||
            (
              item.productId &&
              String(
                existing.product_id
              ) ===
                String(
                  item.productId
                )
            )
        );

      if (!existingItem) {
        continue;
      }

      const soldQuantity =
        toNumber(
          existingItem.sold_quantity
        );

      const newQuantity =
        toNumber(
          item.quantity
        );

      if (
        newQuantity <
        soldQuantity
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              `${existingItem.product_name} already has ${soldQuantity} sold unit(s). ` +
              `Quantity cannot be reduced below ${soldQuantity}.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    ================================================
    PREVENT DELETING PRODUCTS WITH SALES
    ================================================
    */

    for (
      const existingItem of
      existingItems
    ) {
      const soldQuantity =
        toNumber(
          existingItem.sold_quantity
        );

      if (
        soldQuantity <= 0
      ) {
        continue;
      }

      const stillExists =
        items.some(
          (item: any) =>
            String(item.id) ===
              String(
                existingItem.id
              ) ||
            (
              item.productId &&
              String(
                item.productId
              ) ===
                String(
                  existingItem.product_id
                )
            )
        );

      if (!stillExists) {
        return NextResponse.json(
          {
            success: false,

            error:
              `${existingItem.product_name} already has ${soldQuantity} sold unit(s) and cannot be removed from this investment.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    ================================================
    UPDATE INVESTMENT BATCH
    ================================================
    */

    const now =
      new Date().toISOString();

    const {
      data: updatedBatch,
      error: batchUpdateError,
    } = await supabaseAdmin
      .from("investment_batches")
      .update({
        investment_name:
          String(
            investmentName
          ).trim(),

        investment_date:
          investmentDate ||
          existingBatch.investment_date,

        supplier:
          supplier &&
          String(
            supplier
          ).trim()
            ? String(
                supplier
              ).trim()
            : null,

        shipping_cost:
          toNumber(
            shippingCost
          ),

        customs_cost:
          toNumber(
            customsCost
          ),

        packaging_cost:
          toNumber(
            packagingCost
          ),

        other_cost:
          toNumber(
            otherCost
          ),

        notes:
          notes &&
          String(
            notes
          ).trim()
            ? String(
                notes
              ).trim()
            : null,

        status:
          status ||
          existingBatch.status ||
          "active",

        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (
      batchUpdateError ||
      !updatedBatch
    ) {
      console.error(
        "INVESTMENT UPDATE ERROR:",
        batchUpdateError
      );

      throw new Error(
        batchUpdateError?.message ||
          "Could not update investment."
      );
    }

    /*
    ================================================
    UPDATE / INSERT INVESTMENT ITEMS
    ================================================
    */

    const submittedExistingIds =
      new Set<string>();

    for (const item of items) {
      const existingItem =
        existingItems.find(
          (existing: any) =>
            (
              item.id &&
              String(
                existing.id
              ) ===
                String(
                  item.id
                )
            ) ||
            (
              item.productId &&
              String(
                existing.product_id
              ) ===
                String(
                  item.productId
                )
            )
        );

      /*
      ----------------------------------------------
      UPDATE EXISTING PRODUCT
      ----------------------------------------------
      */

      if (existingItem) {
        submittedExistingIds.add(
          String(
            existingItem.id
          )
        );

        const {
          error:
            itemUpdateError,
        } = await supabaseAdmin
          .from(
            "investment_items"
          )
          .update({
            product_id:
              item.productId ||
              existingItem.product_id ||
              null,

            product_name:
              String(
                item.productName
              ).trim(),

            quantity:
              toNumber(
                item.quantity
              ),

            unit_cost:
              toNumber(
                item.unitCost
              ),

            selling_price:
              toNumber(
                item.sellingPrice
              ),

            /*
            IMPORTANT:
            sold_quantity is NOT updated here.

            Existing sales data stays untouched.
            */

            updated_at:
              now,
          })
          .eq(
            "id",
            existingItem.id
          )
          .eq(
            "investment_id",
            id
          );

        if (itemUpdateError) {
          console.error(
            "ITEM UPDATE ERROR:",
            itemUpdateError
          );

          throw new Error(
            itemUpdateError.message
          );
        }

        continue;
      }

      /*
      ----------------------------------------------
      INSERT NEW PRODUCT
      ----------------------------------------------
      */

      const {
        error:
          itemInsertError,
      } = await supabaseAdmin
        .from(
          "investment_items"
        )
        .insert({
          investment_id:
            id,

          product_id:
            item.productId ||
            null,

          product_name:
            String(
              item.productName
            ).trim(),

          quantity:
            toNumber(
              item.quantity
            ),

          unit_cost:
            toNumber(
              item.unitCost
            ),

          selling_price:
            toNumber(
              item.sellingPrice
            ),

          sold_quantity: 0,

          updated_at:
            now,
        });

      if (itemInsertError) {
        console.error(
          "ITEM INSERT ERROR:",
          itemInsertError
        );

        throw new Error(
          itemInsertError.message
        );
      }
    }

    /*
    ================================================
    REMOVE UNSOLD PRODUCTS THAT WERE DELETED
    FROM EDIT FORM
    ================================================
    */

    const removableIds =
      existingItems
        .filter(
          (existing: any) =>
            !submittedExistingIds.has(
              String(
                existing.id
              )
            ) &&
            toNumber(
              existing.sold_quantity
            ) === 0
        )
        .map(
          (existing: any) =>
            existing.id
        );

    if (
      removableIds.length > 0
    ) {
      const {
        error:
          deleteItemsError,
      } = await supabaseAdmin
        .from(
          "investment_items"
        )
        .delete()
        .eq(
          "investment_id",
          id
        )
        .in(
          "id",
          removableIds
        );

      if (deleteItemsError) {
        console.error(
          "ITEM DELETE ERROR:",
          deleteItemsError
        );

        throw new Error(
          deleteItemsError.message
        );
      }
    }

    /*
    ================================================
    GET FINAL UPDATED INVESTMENT
    ================================================
    */

    const {
      data: finalBatch,
      error: finalError,
    } = await supabaseAdmin
      .from("investment_batches")
      .select(`
        *,
        investment_items (*)
      `)
      .eq("id", id)
      .single();

    if (
      finalError ||
      !finalBatch
    ) {
      throw new Error(
        finalError?.message ||
          "Investment updated, but could not reload it."
      );
    }

    const finalItems =
      finalBatch.investment_items ||
      [];

    const calculations =
      calculateInvestment(
        finalBatch,
        finalItems
      );

    /*
    ================================================
    RESPONSE
    ================================================
    */

    return NextResponse.json({
      success: true,

      message:
        "Investment updated successfully.",

      investment: {
        id:
          finalBatch.id,

        investmentCode:
          finalBatch.investment_code,

        investmentName:
          finalBatch.investment_name,

        investmentDate:
          finalBatch.investment_date,

        supplier:
          finalBatch.supplier,

        status:
          finalBatch.status,

        notes:
          finalBatch.notes,

        ...calculations,

        items:
          finalItems.map(
            (item: any) => ({
              id:
                item.id,

              productId:
                item.product_id,

              productName:
                item.product_name,

              quantity:
                toNumber(
                  item.quantity
                ),

              unitCost:
                toNumber(
                  item.unit_cost
                ),

              sellingPrice:
                toNumber(
                  item.selling_price
                ),

              soldQuantity:
                toNumber(
                  item.sold_quantity
                ),

              remainingQuantity:
                Math.max(
                  toNumber(
                    item.quantity
                  ) -
                    toNumber(
                      item.sold_quantity
                    ),
                  0
                ),
            })
          ),

        createdAt:
          finalBatch.created_at,

        updatedAt:
          finalBatch.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "FINANCE PUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Investment update failed.",

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
==================================================
DELETE INVESTMENT
DELETE /api/admin/finance/investments/[id]
==================================================
*/

export async function DELETE(
  _req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    /*
    ================================================
    VALIDATE ID
    ================================================
    */

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Investment ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ================================================
    LOAD INVESTMENT + ITEMS
    ================================================
    */

    const {
      data: investment,
      error: investmentError,
    } = await supabaseAdmin
      .from("investment_batches")
      .select(`
        id,
        investment_code,
        investment_name,
        investment_items (
          id,
          product_name,
          sold_quantity
        )
      `)
      .eq("id", id)
      .single();

    if (
      investmentError ||
      !investment
    ) {
      console.error(
        "DELETE INVESTMENT LOOKUP ERROR:",
        investmentError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            investmentError?.message ||
            "Investment not found.",
        },
        {
          status: 404,
        }
      );
    }

    const items =
      investment.investment_items ||
      [];

    /*
    ================================================
    SALES SAFETY CHECK
    ================================================

    An investment with recorded sales must not
    be permanently deleted because that would
    damage historical finance data.
    ================================================
    */

    const soldUnits = items.reduce(
      (
        total: number,
        item: any
      ) =>
        total +
        toNumber(
          item.sold_quantity
        ),
      0
    );

    if (soldUnits > 0) {
      return NextResponse.json(
        {
          success: false,

          error:
            `This investment already has ${soldUnits} sold unit(s) ` +
            "and cannot be permanently deleted.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    ================================================
    DELETE INVESTMENT ITEMS FIRST
    ================================================

    We delete child records first instead of
    depending on database cascade behaviour.
    ================================================
    */

    const {
      error: itemsDeleteError,
    } = await supabaseAdmin
      .from("investment_items")
      .delete()
      .eq("investment_id", id);

    if (itemsDeleteError) {
      console.error(
        "DELETE INVESTMENT ITEMS ERROR:",
        itemsDeleteError
      );

      throw new Error(
        itemsDeleteError.message
      );
    }

    /*
    ================================================
    DELETE INVESTMENT BATCH
    ================================================
    */

    const {
      error: batchDeleteError,
    } = await supabaseAdmin
      .from("investment_batches")
      .delete()
      .eq("id", id);

    if (batchDeleteError) {
      console.error(
        "DELETE INVESTMENT BATCH ERROR:",
        batchDeleteError
      );

      throw new Error(
        batchDeleteError.message
      );
    }

    /*
    ================================================
    SUCCESS
    ================================================
    */

    return NextResponse.json({
      success: true,

      message:
        "Investment deleted successfully.",

      deletedInvestment: {
        id: investment.id,

        investmentCode:
          investment.investment_code,

        investmentName:
          investment.investment_name,
      },
    });
  } catch (error) {
    console.error(
      "FINANCE DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Investment deletion failed.",

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