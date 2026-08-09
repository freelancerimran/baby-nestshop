import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

/*
============================================================
GET COUPONS
============================================================
*/

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select(`
        *,
        coupon_products (
          id,
          product_id
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Coupons GET Error:", error);

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
      coupons: data || [],
    });
  } catch (error) {
    console.error("Coupons GET Exception:", error);

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
CREATE COUPON
============================================================
*/

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
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
    VALIDATION
    ========================================================
    */

    const cleanCode = String(code || "")
      .trim()
      .toUpperCase();

    if (!cleanCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Coupon code is required",
        },
        { status: 400 }
      );
    }

    if (discountType !== "fixed") {
      return NextResponse.json(
        {
          success: false,
          error: "Only fixed discount is supported",
        },
        { status: 400 }
      );
    }

    const parsedDiscount = Number(discountValue);

    if (
      !Number.isFinite(parsedDiscount) ||
      parsedDiscount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Discount must be greater than 0",
        },
        { status: 400 }
      );
    }

    const parsedMinimum = Number(
      minimumOrderAmount || 0
    );

    if (
      !Number.isFinite(parsedMinimum) ||
      parsedMinimum < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid minimum order amount",
        },
        { status: 400 }
      );
    }

    let parsedUsageLimit: number | null = null;

    if (
      usageLimit !== null &&
      usageLimit !== undefined &&
      String(usageLimit).trim() !== ""
    ) {
      parsedUsageLimit = Number(usageLimit);

      if (
        !Number.isInteger(parsedUsageLimit) ||
        parsedUsageLimit <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Usage limit must be a positive whole number",
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
      data: existingCoupon,
      error: existingError,
    } = await supabaseAdmin
      .from("coupons")
      .select("id")
      .ilike("code", cleanCode)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Coupon duplicate check error:",
        existingError
      );

      return NextResponse.json(
        {
          success: false,
          error: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existingCoupon) {
      return NextResponse.json(
        {
          success: false,
          error: "This coupon code already exists",
        },
        { status: 409 }
      );
    }

    /*
    ========================================================
    CREATE COUPON
    ========================================================
    */

    const {
      data: coupon,
      error: couponError,
    } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: cleanCode,

        discount_type: "fixed",

        discount_value: parsedDiscount,

        is_active: Boolean(
          isActive ?? true
        ),

        starts_at: startsAt || null,

        expires_at: expiresAt || null,

        usage_limit: parsedUsageLimit,

        used_count: 0,

        minimum_order_amount: parsedMinimum,
      })
      .select("*")
      .single();

    if (couponError) {
      console.error(
        "Coupon Create Error:",
        couponError
      );

      return NextResponse.json(
        {
          success: false,
          error: couponError.message,
        },
        { status: 500 }
      );
    }

    /*
    ========================================================
    PRODUCT TARGETING
    ========================================================

    Empty productIds = ALL PRODUCTS
    ========================================================
    */

    const cleanProductIds = Array.isArray(productIds)
      ? [
          ...new Set(
            productIds
              .map((id: unknown) =>
                String(id).trim()
              )
              .filter(Boolean)
          ),
        ]
      : [];

    if (cleanProductIds.length > 0) {
      const rows = cleanProductIds.map(
        (productId) => ({
          coupon_id: coupon.id,
          product_id: productId,
        })
      );

      const {
        error: productError,
      } = await supabaseAdmin
        .from("coupon_products")
        .insert(rows);

      if (productError) {
        /*
        ================================================
        ROLLBACK COUPON
        ================================================
        */

        await supabaseAdmin
          .from("coupons")
          .delete()
          .eq("id", coupon.id);

        console.error(
          "Coupon Product Error:",
          productError
        );

        return NextResponse.json(
          {
            success: false,
            error: productError.message,
          },
          { status: 500 }
        );
      }
    }

    /*
    ========================================================
    RESPONSE
    ========================================================
    */

    return NextResponse.json(
      {
        success: true,
        coupon,
        message: "Coupon created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Coupon POST Exception:",
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