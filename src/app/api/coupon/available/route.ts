import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const productId =
      searchParams.get("productId");

    const subtotal = Number(
      searchParams.get("subtotal") || 0
    );

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          coupon: null,
          error: "Product ID is required",
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    CURRENT TIME
    ========================================
    */

    const now = new Date();

    /*
    ========================================
    FIND COUPON MAPPINGS
    ========================================
    */

    const {
      data: mappings,
      error: mappingError,
    } = await supabaseAdmin
      .from("coupon_products")
      .select("coupon_id")
      .eq(
        "product_id",
        String(productId)
      );

    if (mappingError) {
      console.error(
        "Available Coupon Mapping Error:",
        mappingError
      );

      return NextResponse.json(
        {
          success: false,
          coupon: null,
          error: mappingError.message,
        },
        { status: 500 }
      );
    }

    /*
    ========================================
    NO COUPON FOR THIS PRODUCT
    ========================================
    */

    if (
      !mappings ||
      mappings.length === 0
    ) {
      return NextResponse.json({
        success: true,
        coupon: null,
      });
    }

    const couponIds = mappings.map(
      (item) => item.coupon_id
    );

    /*
    ========================================
    LOAD COUPONS
    ========================================
    */

    const {
      data: coupons,
      error: couponError,
    } = await supabaseAdmin
      .from("coupons")
      .select(
        `
          id,
          code,
          discount_type,
          discount_value,
          minimum_order_amount,
          starts_at,
          expires_at,
          usage_limit,
          used_count,
          is_active,
          created_at
        `
      )
      .in("id", couponIds)
      .eq("is_active", true)
      .order("created_at", {
        ascending: false,
      });

    if (couponError) {
      console.error(
        "Available Coupon Error:",
        couponError
      );

      return NextResponse.json(
        {
          success: false,
          coupon: null,
          error: couponError.message,
        },
        { status: 500 }
      );
    }

    /*
    ========================================
    FIND VALID COUPON
    ========================================
    */

    const validCoupon =
      (coupons || []).find(
        (coupon) => {
          /*
          ------------------------------------
          START DATE
          ------------------------------------
          */

          if (
            coupon.starts_at &&
            new Date(
              coupon.starts_at
            ).getTime() >
              now.getTime()
          ) {
            return false;
          }

          /*
          ------------------------------------
          EXPIRY DATE
          ------------------------------------
          */

          if (
            coupon.expires_at &&
            new Date(
              coupon.expires_at
            ).getTime() <
              now.getTime()
          ) {
            return false;
          }

          /*
          ------------------------------------
          USAGE LIMIT
          ------------------------------------
          */

          if (
            coupon.usage_limit !==
              null &&
            coupon.usage_limit !==
              undefined &&
            Number(
              coupon.used_count || 0
            ) >=
              Number(
                coupon.usage_limit
              )
          ) {
            return false;
          }

          /*
          ------------------------------------
          MINIMUM ORDER
          ------------------------------------
          */

          if (
            subtotal <
            Number(
              coupon.minimum_order_amount ||
                0
            )
          ) {
            return false;
          }

          /*
          ------------------------------------
          DISCOUNT TYPE
          ------------------------------------
          */

          if (
            coupon.discount_type !==
            "fixed"
          ) {
            return false;
          }

          return true;
        }
      );

    /*
    ========================================
    NO VALID COUPON
    ========================================
    */

    if (!validCoupon) {
      return NextResponse.json({
        success: true,
        coupon: null,
      });
    }

    /*
    ========================================
    RETURN PUBLIC COUPON DATA
    ========================================
    */

    return NextResponse.json({
      success: true,

      coupon: {
        id: validCoupon.id,

        code: validCoupon.code,

        discountType:
          validCoupon.discount_type,

        discountValue: Number(
          validCoupon.discount_value
        ),

        minimumOrderAmount:
          Number(
            validCoupon.minimum_order_amount ||
              0
          ),

        expiresAt:
          validCoupon.expires_at,
      },
    });
  } catch (error) {
    console.error(
      "Available Coupon Exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        coupon: null,
        error: String(error),
      },
      { status: 500 }
    );
  }
}