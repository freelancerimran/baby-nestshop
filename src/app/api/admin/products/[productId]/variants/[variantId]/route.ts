import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import {
  writeAuditLog,
} from "@/lib/audit";

interface RouteContext {
  params: Promise<{
    productId: string;
    variantId: string;
  }>;
}


/*
==================================================
PATCH VARIANT
==================================================
*/

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const canManageVariants =
      await hasPermission(
        "products",
        "manage_variants"
      );

    if (!canManageVariants) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage product variants.",
        },
        { status: 403 }
      );
    }

    const {
      productId,
      variantId,
    } =
      await context.params;

    if (
      !productId ||
      !variantId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product ID and Variant ID are required.",
        },
        { status: 400 }
      );
    }

    const numericVariantId =
      Number(variantId);

    if (
      !Number.isInteger(
        numericVariantId
      ) ||
      numericVariantId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Variant ID.",
        },
        { status: 400 }
      );
    }

    /*
    ==============================================
    VERIFY CURRENT VARIANT
    ==============================================
    */

    const {
      data: currentVariant,
      error:
        currentVariantError,
    } = await supabaseAdmin
      .from(
        "product_variants"
      )
      .select(
        `
        id,
        product_id,
        variant_name,
        sku,
        price,
        real_stock,
        display_stock,
        image,
        status,
        sort_order
      `
      )
      .eq(
        "id",
        numericVariantId
      )
      .eq(
        "product_id",
        productId
      )
      .maybeSingle();

    if (
      currentVariantError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            currentVariantError.message,
        },
        { status: 500 }
      );
    }

    if (!currentVariant) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Variant not found.",
        },
        { status: 404 }
      );
    }

    const body =
      await req.json();

    const updateData:
      Record<
        string,
        unknown
      > = {};

    /*
    ==============================================
    VARIANT NAME
    ==============================================
    */

    if (
      body.variantName !==
      undefined
    ) {
      const variantName =
        typeof body.variantName ===
        "string"
          ? body.variantName.trim()
          : "";

      if (!variantName) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Variant name cannot be empty.",
          },
          { status: 400 }
        );
      }

      updateData.variant_name =
        variantName;
    }

    /*
    ==============================================
    SKU
    ==============================================
    */

    if (
      body.sku !==
      undefined
    ) {
      const sku =
        typeof body.sku ===
        "string"
          ? body.sku.trim()
          : "";

      if (sku) {
        const {
          data: existingSku,
          error: skuError,
        } =
          await supabaseAdmin
            .from(
              "product_variants"
            )
            .select("id")
            .eq(
              "sku",
              sku
            )
            .neq(
              "id",
              numericVariantId
            )
            .maybeSingle();

        if (skuError) {
          return NextResponse.json(
            {
              success: false,
              message:
                skuError.message,
            },
            { status: 500 }
          );
        }

        if (existingSku) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This SKU is already in use.",
            },
            { status: 409 }
          );
        }
      }

      updateData.sku =
        sku || null;
    }

    /*
    ==============================================
    PRICE
    ==============================================
    */

    if (
      body.price !==
      undefined
    ) {
      if (
        body.price ===
          null ||
        body.price ===
          ""
      ) {
        updateData.price =
          null;
      } else {
        const price =
          Number(
            body.price
          );

        if (
          !Number.isFinite(
            price
          ) ||
          price < 0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Price must be a valid non-negative number.",
            },
            { status: 400 }
          );
        }

        updateData.price =
          price;
      }
    }

    /*
    ==============================================
    STOCK
    ==============================================
    */

    const changingRealStock =
      body.realStock !==
      undefined;

    const changingDisplayStock =
      body.displayStock !==
      undefined;

    if (
      changingRealStock ||
      changingDisplayStock
    ) {
      const canManageStock =
        await hasPermission(
          "products",
          "manage_stock"
        );

      if (!canManageStock) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You do not have permission to manage product stock.",
          },
          { status: 403 }
        );
      }
    }

    if (
      changingRealStock
    ) {
      const realStock =
        Number(
          body.realStock
        );

      if (
        !Number.isInteger(
          realStock
        ) ||
        realStock < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Real stock must be a non-negative integer.",
          },
          { status: 400 }
        );
      }

      updateData.real_stock =
        realStock;
    }

    if (
      changingDisplayStock
    ) {
      const displayStock =
        Number(
          body.displayStock
        );

      if (
        !Number.isInteger(
          displayStock
        ) ||
        displayStock < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Display stock must be a non-negative integer.",
          },
          { status: 400 }
        );
      }

      updateData.display_stock =
        displayStock;
    }

    /*
    ==============================================
    IMAGE
    ==============================================
    */

    if (
      body.image !==
      undefined
    ) {
      updateData.image =
        typeof body.image ===
          "string" &&
        body.image.trim()
          ? body.image.trim()
          : null;
    }

    /*
    ==============================================
    STATUS
    ==============================================
    */

    if (
      body.status !==
      undefined
    ) {
      updateData.status =
        body.status ===
        "Inactive"
          ? "Inactive"
          : "Active";
    }

    /*
    ==============================================
    SORT ORDER
    ==============================================
    */

    if (
      body.sortOrder !==
      undefined
    ) {
      const sortOrder =
        Number(
          body.sortOrder
        );

      if (
        !Number.isInteger(
          sortOrder
        ) ||
        sortOrder < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Sort order must be a non-negative integer.",
          },
          { status: 400 }
        );
      }

      updateData.sort_order =
        sortOrder;
    }

    /*
    ==============================================
    NOTHING TO UPDATE
    ==============================================
    */

    if (
      Object.keys(
        updateData
      ).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No changes were provided.",
        },
        { status: 400 }
      );
    }

    /*
    ==============================================
    UPDATE
    ==============================================
    */

    const {
      data: variant,
      error,
    } = await supabaseAdmin
      .from(
        "product_variants"
      )
      .update(
        updateData
      )
      .eq(
        "id",
        numericVariantId
      )
      .eq(
        "product_id",
        productId
      )
      .select(
        `
        id,
        product_id,
        variant_name,
        sku,
        price,
        real_stock,
        display_stock,
        image,
        status,
        sort_order,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      console.error(
        "UPDATE VARIANT ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        { status: 500 }
      );
    }

    const auditLogged =
      await writeAuditLog({
        request: req,
        action: "update",
        module: "products",
        targetType: "product_variant",
        targetId: String(
          numericVariantId
        ),
        description:
          `Updated product variant "${variant.variant_name}" (${variant.sku || "no SKU"}).`,
        metadata: {
          product_id: productId,
          variant_id:
            numericVariantId,
          variant_name:
            variant.variant_name,
          sku:
            variant.sku,
          previous_variant:
            currentVariant,
          updated_fields:
            updateData,
          updated_variant:
            variant,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Product variant updated successfully.",
      variant,
      auditLogged,
    });
  } catch (error) {
    console.error(
      "PATCH VARIANT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}


/*
==================================================
DELETE / DEACTIVATE VARIANT
==================================================
*/

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const allowed =
      await hasPermission(
        "products",
        "manage_variants"
      );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage product variants.",
        },
        { status: 403 }
      );
    }

    const {
      productId,
      variantId,
    } =
      await context.params;

    const numericVariantId =
      Number(variantId);

    if (
      !productId ||
      !Number.isInteger(
        numericVariantId
      ) ||
      numericVariantId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid product or variant ID.",
        },
        { status: 400 }
      );
    }

    /*
    ==============================================
    CHECK VARIANT
    ==============================================
    */

    const {
      data: variant,
      error: variantError,
    } = await supabaseAdmin
      .from(
        "product_variants"
      )
      .select(
        `
        id,
        product_id,
        variant_name,
        sku,
        status
      `
      )
      .eq(
        "id",
        numericVariantId
      )
      .eq(
        "product_id",
        productId
      )
      .maybeSingle();

    if (variantError) {
      return NextResponse.json(
        {
          success: false,
          message:
            variantError.message,
        },
        { status: 500 }
      );
    }

    if (!variant) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Variant not found.",
        },
        { status: 404 }
      );
    }

    /*
    ==============================================
    CHECK ORDER USAGE
    ==============================================
    */

    const {
      count,
      error:
        orderItemError,
    } = await supabaseAdmin
      .from("order_items")
      .select(
        "id",
        {
          count:
            "exact",
          head: true,
        }
      )
      .eq(
        "variant_id",
        numericVariantId
      );

    if (orderItemError) {
      return NextResponse.json(
        {
          success: false,
          message:
            orderItemError.message,
        },
        { status: 500 }
      );
    }

    /*
    ==============================================
    USED VARIANT
    ==============================================
    */

    if (
      (count ?? 0) > 0
    ) {
      const {
        data:
          deactivatedVariant,
        error,
      } =
        await supabaseAdmin
          .from(
            "product_variants"
          )
          .update({
            status:
              "Inactive",
          })
          .eq(
            "id",
            numericVariantId
          )
          .eq(
            "product_id",
            productId
          )
          .select(
            `
            id,
            product_id,
            variant_name,
            sku,
            price,
            real_stock,
            display_stock,
            image,
            status,
            sort_order,
            created_at,
            updated_at
          `
          )
          .single();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
          },
          { status: 500 }
        );
      }

      const auditLogged =
        await writeAuditLog({
          request: _req,
          action: "deactivate",
          module: "products",
          targetType:
            "product_variant",
          targetId: String(
            numericVariantId
          ),
          description:
            `Deactivated used product variant "${deactivatedVariant.variant_name}" (${deactivatedVariant.sku || "no SKU"}) instead of deleting it.`,
          metadata: {
            product_id:
              productId,
            variant_id:
              numericVariantId,
            variant_name:
              deactivatedVariant.variant_name,
            sku:
              deactivatedVariant.sku,
            order_item_usage_count:
              count ?? 0,
            previous_status:
              variant.status,
            new_status:
              "Inactive",
          },
        });

      return NextResponse.json({
        success: true,
        action:
          "deactivated",
        message:
          "Variant is already used in an order, so it was deactivated instead of deleted.",
        variant:
          deactivatedVariant,
        auditLogged,
      });
    }

    /*
    ==============================================
    HARD DELETE
    ==============================================
    */

    const {
      error: deleteError,
    } = await supabaseAdmin
      .from(
        "product_variants"
      )
      .delete()
      .eq(
        "id",
        numericVariantId
      )
      .eq(
        "product_id",
        productId
      );

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          message:
            deleteError.message,
        },
        { status: 500 }
      );
    }

    const auditLogged =
      await writeAuditLog({
        request: _req,
        action: "delete",
        module: "products",
        targetType:
          "product_variant",
        targetId: String(
          numericVariantId
        ),
        description:
          `Permanently deleted product variant "${variant.variant_name}" (${variant.status || "unknown status"}).`,
        metadata: {
          product_id:
            productId,
          variant_id:
            numericVariantId,
          variant_name:
            variant.variant_name,
          previous_status:
            variant.status,
          order_item_usage_count:
            count ?? 0,
          sku:
            variant.sku ?? null,
        },
      });

    return NextResponse.json({
      success: true,
      action: "deleted",
      message:
        "Product variant deleted successfully.",
      auditLogged,
    });
  } catch (error) {
    console.error(
      "DELETE VARIANT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}