import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

/*
========================================================
HELPER
========================================================
*/

function isCouponCurrentlyValid(
  coupon: {
    is_active: boolean;
    starts_at: string | null;
    expires_at: string | null;
    usage_limit: number | null;
    used_count: number | null;
    minimum_order_amount: number | null;
    discount_type: string;
  },
  subtotal: number
) {
  /*
  ========================================
  ACTIVE CHECK
  ========================================
  */

  if (!coupon.is_active) {
    return {
      valid: false,
      reason: "Coupon is inactive",
    };
  }

  /*
  ========================================
  START DATE
  ========================================
  */

  const now = Date.now();

  if (
    coupon.starts_at &&
    new Date(coupon.starts_at).getTime() > now
  ) {
    return {
      valid: false,
      reason: "Coupon has not started yet",
    };
  }

  /*
  ========================================
  EXPIRY DATE
  ========================================
  */

  if (
    coupon.expires_at &&
    new Date(coupon.expires_at).getTime() < now
  ) {
    return {
      valid: false,
      reason: "Coupon has expired",
    };
  }

  /*
  ========================================
  USAGE LIMIT
  ========================================
  */

  if (
    coupon.usage_limit !== null &&
    coupon.usage_limit !== undefined &&
    Number(coupon.used_count || 0) >=
      Number(coupon.usage_limit)
  ) {
    return {
      valid: false,
      reason: "Coupon usage limit reached",
    };
  }

  /*
  ========================================
  MINIMUM ORDER
  ========================================
  */

  const minimumOrder = Number(
    coupon.minimum_order_amount || 0
  );

  if (subtotal < minimumOrder) {
    return {
      valid: false,
      reason: `Minimum order amount is ৳${minimumOrder}`,
    };
  }

  /*
  ========================================
  DISCOUNT TYPE
  ========================================
  */

  if (coupon.discount_type !== "fixed") {
    return {
      valid: false,
      reason: "Unsupported coupon type",
    };
  }

  return {
    valid: true,
    reason: "",
  };
}

/*
========================================================
GET
========================================================

Returns the currently available coupon for a product.

Used by the Product Single Order Page to show:

🎟️ Special Coupon
BABY20
Apply Now

IMPORTANT:

If a coupon has NO coupon_products mapping,
it means the coupon applies to ALL PRODUCTS.

========================================================
*/

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

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
    FIND PRODUCT-SPECIFIC MAPPINGS
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

    const mappedCouponIds =
      (mappings || []).map(
        (item) => item.coupon_id
      );

    /*
    ========================================
    LOAD ALL ACTIVE COUPONS
    ========================================

    We load all active coupons because:

    1. Product-specific coupon
       -> exists in coupon_products

    2. Global coupon
       -> has no coupon_products rows
    ========================================
    */

    const {
      data: allCoupons,
      error: couponError,
    } = await supabaseAdmin
      .from("coupons")
      .select(`
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
      `)
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
    DETERMINE WHETHER COUPON IS GLOBAL
    ========================================

    A coupon with no coupon_products rows
    is treated as a global coupon.
    ========================================
    */

    let validCoupon = null;

    for (const coupon of allCoupons || []) {
      const isMappedToProduct =
        mappedCouponIds.includes(coupon.id);

      /*
      Check whether this coupon has
      ANY product mapping.
      */

      const {
        data: couponMappings,
        error: couponMappingError,
      } = await supabaseAdmin
        .from("coupon_products")
        .select("id")
        .eq(
          "coupon_id",
          coupon.id
        )
        .limit(1);

      if (couponMappingError) {
        console.error(
          "Coupon Mapping Check Error:",
          couponMappingError
        );

        continue;
      }

      const hasProductRestrictions =
        (couponMappings || []).length > 0;

      /*
      Global coupon:
      no product mappings
      */

      const appliesToProduct =
        !hasProductRestrictions ||
        isMappedToProduct;

      if (!appliesToProduct) {
        continue;
      }

      const validation =
        isCouponCurrentlyValid(
          coupon,
          subtotal
        );

      if (!validation.valid) {
        continue;
      }

      validCoupon = coupon;
      break;
    }

    /*
    ========================================
    NO AVAILABLE COUPON
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
    SAFE PUBLIC RESPONSE
    ========================================
    */

    return NextResponse.json({
      success: true,

      coupon: {
        id: validCoupon.id,

        code: validCoupon.code,

        discountType:
          validCoupon.discount_type,

        discountValue:
          Number(
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

      discount:
        Number(
          validCoupon.discount_value
        ),

      subtotal,

      finalSubtotal: Math.max(
        0,
        subtotal -
          Number(
            validCoupon.discount_value
          )
      ),

      message:
        `🎟️ ৳${Number(
          validCoupon.discount_value
        )} টাকা ছাড় পাওয়া যাচ্ছে`,
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

/*
========================================================
POST
========================================================

Validates a coupon entered by the customer.

Example:

POST /api/coupon/validate

{
  couponCode: "BABY20",
  productId: "3",
  subtotal: 399
}

========================================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const couponCode = String(
      body?.couponCode || ""
    )
      .trim()
      .toUpperCase();

    const productId = String(
      body?.productId || ""
    ).trim();

    const subtotal = Number(
      body?.subtotal || 0
    );

    /*
    ========================================
    BASIC VALIDATION
    ========================================
    */

    if (!couponCode) {
      return NextResponse.json(
        {
          success: false,
          coupon: null,
          discount: 0,
          error:
            "Coupon code is required",
        },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          coupon: null,
          discount: 0,
          error:
            "Product ID is required",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(subtotal) ||
      subtotal < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          coupon: null,
          discount: 0,
          error:
            "Invalid subtotal",
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    FIND COUPON BY CODE
    ========================================
    */

    const {
      data: coupon,
      error: couponError,
    } = await supabaseAdmin
      .from("coupons")
      .select(`
        id,
        code,
        discount_type,
        discount_value,
        minimum_order_amount,
        starts_at,
        expires_at,
        usage_limit,
        used_count,
        is_active
      `)
      .ilike(
        "code",
        couponCode
      )
      .maybeSingle();

    if (couponError) {
      console.error(
        "Coupon Lookup Error:",
        couponError
      );

      return NextResponse.json(
        {
          success: false,
          coupon: null,
          discount: 0,
          error:
            couponError.message,
        },
        { status: 500 }
      );
    }

    /*
    ========================================
    COUPON NOT FOUND
    ========================================
    */

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          coupon: null,
          discount: 0,
          error:
            "❌ কুপন কোড সঠিক নয়",
        },
        { status: 404 }
      );
    }

    /*
    ========================================
    CHECK COUPON VALIDITY
    ========================================
    */

    const validation =
      isCouponCurrentlyValid(
        coupon,
        subtotal
      );

    if (!validation.valid) {
      let message =
        "❌ কুপনটি বর্তমানে ব্যবহার করা যাচ্ছে না";

      if (
        validation.reason ===
        "Coupon is inactive"
      ) {
        message =
          "❌ কুপনটি সক্রিয় নয়";
      }

      if (
        validation.reason ===
        "Coupon has not started yet"
      ) {
        message =
          "❌ কুপনটি এখনো শুরু হয়নি";
      }

      if (
        validation.reason ===
        "Coupon has expired"
      ) {
        message =
          "❌ কুপনটির মেয়াদ শেষ হয়ে গেছে";
      }

      if (
        validation.reason ===
        "Coupon usage limit reached"
      ) {
        message =
          "❌ এই কুপনের ব্যবহার সীমা শেষ";
      }

      if (
        validation.reason.startsWith(
          "Minimum order amount"
        )
      ) {
        message =
          `❌ ${validation.reason}`;
      }

      return NextResponse.json(
        {
          success: false,
          coupon: null,
          discount: 0,
          subtotal,
          finalSubtotal: subtotal,
          error: message,
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    CHECK PRODUCT TARGETING
    ========================================
    */

    const {
      data: mappings,
      error: mappingError,
    } = await supabaseAdmin
      .from("coupon_products")
      .select("product_id")
      .eq(
        "coupon_id",
        coupon.id
      );

    if (mappingError) {
      console.error(
        "Coupon Product Mapping Error:",
        mappingError
      );

      return NextResponse.json(
        {
          success: false,
          coupon: null,
          discount: 0,
          error:
            mappingError.message,
        },
        { status: 500 }
      );
    }

    const mappedProductIds =
      (mappings || []).map(
        (item) =>
          String(item.product_id)
      );

    /*
    ========================================
    PRODUCT RESTRICTION

    No mapping = ALL PRODUCTS

    Mapping exists =
    only mapped products
    ========================================
    */

    if (
      mappedProductIds.length > 0 &&
      !mappedProductIds.includes(
        productId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          coupon: null,
          discount: 0,
          subtotal,
          finalSubtotal: subtotal,
          error:
            "❌ এই কুপনটি এই পণ্যের জন্য প্রযোজ্য নয়",
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    CALCULATE DISCOUNT
    ========================================
    */

    let discount = 0;

    if (
      coupon.discount_type ===
      "fixed"
    ) {
      discount = Number(
        coupon.discount_value || 0
      );
    }

    /*
    Never allow discount
    greater than subtotal.
    */

    discount = Math.min(
      Math.max(0, discount),
      Math.max(0, subtotal)
    );

    const finalSubtotal =
      Math.max(
        0,
        subtotal - discount
      );

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      coupon: {
        id: coupon.id,

        code: coupon.code,

        discountType:
          coupon.discount_type,

        discountValue:
          Number(
            coupon.discount_value
          ),

        minimumOrderAmount:
          Number(
            coupon.minimum_order_amount ||
              0
          ),

        expiresAt:
          coupon.expires_at,
      },

      discount,

      subtotal,

      finalSubtotal,

      message:
        `✅ ৳${discount} টাকা ছাড় প্রয়োগ হয়েছে`,
    });
  } catch (error) {
    console.error(
      "Coupon POST Exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        coupon: null,
        discount: 0,
        error:
          "কুপন যাচাই করতে সমস্যা হয়েছে",
      },
      { status: 500 }
    );
  }
}