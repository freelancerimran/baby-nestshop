import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    /*
    ========================================
    PRODUCT EDIT PERMISSION
    ========================================
    */

    const canEditProduct = await hasPermission(
      "products",
      "edit"
    );

    if (!canEditProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to edit products.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    GET REQUEST BODY
    ========================================
    */

    const body = await req.json();

    if (!body.productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    GET CURRENT PRODUCT
    ========================================
    */

    const { data: currentProduct, error: fetchError } =
      await supabase
        .from("products")
        .select(
          "product_id, product_name, real_stock, display_stock"
        )
        .eq(
          "product_id",
          body.productId
        )
        .single();

    if (fetchError || !currentProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            fetchError?.message ||
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    ========================================
    CHECK STOCK CHANGE
    ========================================
    */

    const currentRealStock =
      Number(currentProduct.real_stock);

    const currentDisplayStock =
      Number(currentProduct.display_stock);

    const requestedRealStock =
      Number(body.realStock);

    const requestedDisplayStock =
      Number(body.displayStock);

    const realStockChanged =
      Number.isFinite(requestedRealStock) &&
      requestedRealStock !==
        currentRealStock;

    const displayStockChanged =
      Number.isFinite(requestedDisplayStock) &&
      requestedDisplayStock !==
        currentDisplayStock;

    const stockChanged =
      realStockChanged ||
      displayStockChanged;

    /*
    ========================================
    STOCK MANAGEMENT PERMISSION
    ========================================
    */

    if (stockChanged) {
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
          {
            status: 403,
          }
        );
      }
    }

    /*
    ========================================
    UPDATE PRODUCT
    ========================================
    */

    const updateData: Record<
      string,
      unknown
    > = {
      product_name:
        body.productName,

      status:
        body.status,

      price:
        body.price,

      regular_price:
        body.regularPrice,

      slug:
        body.slug,

      description:
        body.description,

      image:
        body.image,

      gallery_image_1:
        body.galleryImage1,

      gallery_image_2:
        body.galleryImage2,

      gallery_image_3:
        body.galleryImage3,

      gallery_image_4:
        body.galleryImage4,

      featured:
        body.featured || false,

      best_seller:
        body.bestSeller || false,

      new_arrival:
        body.newArrival || false,
    };

    /*
    ========================================
    ONLY UPDATE STOCK WHEN PROVIDED
    AND AUTHORIZED
    ========================================
    */

    if (
      body.realStock !== undefined &&
      body.displayStock !== undefined
    ) {
      updateData.real_stock =
        body.realStock;

      updateData.display_stock =
        body.displayStock;
    }

    /*
    ========================================
    DATABASE UPDATE
    ========================================
    */

    const { error } =
      await supabase
        .from("products")
        .update(updateData)
        .eq(
          "product_id",
          body.productId
        );

    /*
    ========================================
    UPDATE ERROR
    ========================================
    */

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    STOCK AUDIT LOG
    ========================================
    */

    const stockWasActuallyUpdated =
      stockChanged &&
      body.realStock !== undefined &&
      body.displayStock !== undefined;

    let auditLogged = false;

    if (stockWasActuallyUpdated) {
      auditLogged = await writeAuditLog({
        request: req,
        action: "update_stock",
        module: "products",
        targetType: "product",
        targetId: String(body.productId),
        description:
          `Product stock updated for ${currentProduct.product_name || "product"} (${body.productId}).`,
        metadata: {
          product_id: body.productId,
          product_name:
            currentProduct.product_name || null,

          previous_real_stock:
            currentRealStock,
          previous_display_stock:
            currentDisplayStock,

          new_real_stock:
            requestedRealStock,
          new_display_stock:
            requestedDisplayStock,

          real_stock_changed:
            realStockChanged,
          display_stock_changed:
            displayStockChanged,
        },
      });
    }

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,
      message:
        stockChanged
          ? "Product and stock updated successfully."
          : "Product updated successfully.",
      ...(stockWasActuallyUpdated
        ? { auditLogged }
        : {}),
    });
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          String(error),
      },
      {
        status: 500,
      }
    );
  }
}