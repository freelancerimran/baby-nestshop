import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

/*
============================================================
UPDATE COUPON
============================================================
*/

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const couponId = Number(id);

    if (!Number.isInteger(couponId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coupon ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      code,
      discountType,
      discountValue,
      isActive,
      startsAt,
      expiresAt,
      usageLimit,
      minimumOrderAmount,
      productIds,
    } = body;

    /*
    ========================================================
    CHECK EXISTING COUPON
    ========================================================
    */

    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          success: false,
          error: existingError.message,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Coupon not found",
        },
        { status: 404 }
      );
    }

    /*
    ========================================================
    VALIDATE
    ========================================================
    */

    const cleanCode = String(
      code ?? existing.code
    )
      .trim()
      .toUpperCase();

    const parsedDiscount = Number(
      discountValue ??
        existing.discount_value
    );

    const parsedMinimum = Number(
      minimumOrderAmount ??
        existing.minimum_order_amount ??
        0
    );

    if (!cleanCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Coupon code is required",
        },
        { status: 400 }
      );
    }

    if (
      discountType &&
      discountType !== "fixed"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only fixed discount is supported",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(parsedDiscount) ||
      parsedDiscount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid discount value",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(parsedMinimum) ||
      parsedMinimum < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid minimum order amount",
        },
        { status: 400 }
      );
    }

    let parsedUsageLimit:
      | number
      | null =
      existing.usage_limit ?? null;

    if (
      usageLimit !== undefined &&
      usageLimit !== null &&
      String(usageLimit).trim() !== ""
    ) {
      parsedUsageLimit =
        Number(usageLimit);

      if (
        !Number.isInteger(
          parsedUsageLimit
        ) ||
        parsedUsageLimit <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid usage limit",
          },
          { status: 400 }
        );
      }
    }

    /*
    ========================================================
    CHECK DUPLICATE CODE
    ========================================================
    */

    const {
      data: duplicateCoupon,
      error: duplicateError,
    } = await supabaseAdmin
      .from("coupons")
      .select("id")
      .ilike("code", cleanCode)
      .neq("id", couponId)
      .maybeSingle();

    if (duplicateError) {
      return NextResponse.json(
        {
          success: false,
          error: duplicateError.message,
        },
        { status: 500 }
      );
    }

    if (duplicateCoupon) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This coupon code already exists",
        },
        { status: 409 }
      );
    }

    /*
    ========================================================
    UPDATE COUPON
    ========================================================
    */

    const {
      data: updatedCoupon,
      error: updateError,
    } = await supabaseAdmin
      .from("coupons")
      .update({
        code: cleanCode,

        discount_type: "fixed",

        discount_value:
          parsedDiscount,

        is_active: Boolean(
          isActive ??
            existing.is_active
        ),

        starts_at:
          startsAt !== undefined
            ? startsAt || null
            : existing.starts_at,

        expires_at:
          expiresAt !== undefined
            ? expiresAt || null
            : existing.expires_at,

        usage_limit:
          parsedUsageLimit,

        minimum_order_amount:
          parsedMinimum,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", couponId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    /*
    ========================================================
    UPDATE PRODUCT TARGETING
    ========================================================
    */

    const cleanProductIds =
      Array.isArray(productIds)
        ? [
            ...new Set(
              productIds
                .map(
                  (
                    productId: unknown
                  ) =>
                    String(
                      productId
                    ).trim()
                )
                .filter(Boolean)
            ),
          ]
        : null;

    if (
      cleanProductIds !== null
    ) {
      /*
      ================================================
      REMOVE OLD PRODUCT TARGETING
      ================================================
      */

      const {
        error: deleteError,
      } = await supabaseAdmin
        .from("coupon_products")
        .delete()
        .eq(
          "coupon_id",
          couponId
        );

      if (deleteError) {
        return NextResponse.json(
          {
            success: false,
            error:
              deleteError.message,
          },
          { status: 500 }
        );
      }

      /*
      ================================================
      EMPTY = ALL PRODUCTS
      ================================================
      */

      if (
        cleanProductIds.length >
        0
      ) {
        const rows =
          cleanProductIds.map(
            (productId) => ({
              coupon_id:
                couponId,

              product_id:
                productId,
            })
          );

        const {
          error: insertError,
        } = await supabaseAdmin
          .from(
            "coupon_products"
          )
          .insert(rows);

        if (insertError) {
          return NextResponse.json(
            {
              success: false,
              error:
                insertError.message,
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon,
      message:
        "Coupon updated successfully",
    });
  } catch (error) {
    console.error(
      "Coupon PATCH Exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

/*
============================================================
DELETE COUPON
============================================================
*/

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const couponId = Number(id);

    if (!Number.isInteger(couponId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coupon ID",
        },
        { status: 400 }
      );
    }

    /*
    ========================================================
    DELETE PRODUCT RELATIONS FIRST
    ========================================================
    */

    const {
      error: productDeleteError,
    } = await supabaseAdmin
      .from("coupon_products")
      .delete()
      .eq(
        "coupon_id",
        couponId
      );

    if (productDeleteError) {
      console.error(
        "Coupon Products DELETE Error:",
        productDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            productDeleteError.message,
        },
        { status: 500 }
      );
    }

    /*
    ========================================================
    DELETE COUPON
    ========================================================
    */

    const {
      error,
    } = await supabaseAdmin
      .from("coupons")
      .delete()
      .eq("id", couponId);

    if (error) {
      console.error(
        "Coupon DELETE Error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Coupon deleted successfully",
    });
  } catch (error) {
    console.error(
      "Coupon DELETE Exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}