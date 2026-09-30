import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";

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
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const couponId = Number(id);

    if (!Number.isInteger(couponId)) {
      return NextResponse.json(
        { success: false, error: "Invalid coupon ID" },
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

    const { data: existing, error: existingError } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    const cleanCode = String(code ?? existing.code)
      .trim()
      .toUpperCase();

    const parsedDiscount = Number(
      discountValue ?? existing.discount_value
    );

    const parsedMinimum = Number(
      minimumOrderAmount ?? existing.minimum_order_amount ?? 0
    );

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (discountType && discountType !== "fixed") {
      return NextResponse.json(
        {
          success: false,
          error: "Only fixed discount is supported",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(parsedDiscount) || parsedDiscount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid discount value" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(parsedMinimum) || parsedMinimum < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid minimum order amount",
        },
        { status: 400 }
      );
    }

    let parsedUsageLimit: number | null = existing.usage_limit ?? null;

    if (
      usageLimit !== undefined &&
      usageLimit !== null &&
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
            error: "Invalid usage limit",
          },
          { status: 400 }
        );
      }
    }

    const { data: duplicateCoupon, error: duplicateError } = await supabase
      .from("coupons")
      .select("id")
      .ilike("code", cleanCode)
      .neq("id", couponId)
      .maybeSingle();

    if (duplicateError) {
      return NextResponse.json(
        { success: false, error: duplicateError.message },
        { status: 500 }
      );
    }

    if (duplicateCoupon) {
      return NextResponse.json(
        {
          success: false,
          error: "This coupon code already exists",
        },
        { status: 409 }
      );
    }

    const { data: updatedCoupon, error: updateError } = await supabase
      .from("coupons")
      .update({
        code: cleanCode,
        discount_type: "fixed",
        discount_value: parsedDiscount,
        is_active: Boolean(isActive ?? existing.is_active),
        starts_at:
          startsAt !== undefined ? startsAt || null : existing.starts_at,
        expires_at:
          expiresAt !== undefined ? expiresAt || null : existing.expires_at,
        usage_limit: parsedUsageLimit,
        minimum_order_amount: parsedMinimum,
        updated_at: new Date().toISOString(),
      })
      .eq("id", couponId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    const cleanProductIds = Array.isArray(productIds)
      ? [
          ...new Set(
            productIds
              .map((productId: unknown) => String(productId).trim())
              .filter(Boolean)
          ),
        ]
      : null;

    if (cleanProductIds !== null) {
      const { error: deleteError } = await supabase
        .from("coupon_products")
        .delete()
        .eq("coupon_id", couponId);

      if (deleteError) {
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        );
      }

      if (cleanProductIds.length > 0) {
        const rows = cleanProductIds.map((productId) => ({
          coupon_id: couponId,
          product_id: productId,
        }));

        const { error: insertError } = await supabase
          .from("coupon_products")
          .insert(rows);

        if (insertError) {
          return NextResponse.json(
            { success: false, error: insertError.message },
            { status: 500 }
          );
        }
      }
    }

    const auditLogged = await writeAuditLog({
      request,
      action: "update",
      module: "coupons",
      targetType: "coupon",
      targetId: String(couponId),
      description: `Updated coupon "${updatedCoupon.code}".`,
      metadata: {
        coupon_id: couponId,
        previous: {
          code: existing.code,
          discount_type: existing.discount_type,
          discount_value: existing.discount_value,
          is_active: existing.is_active,
          starts_at: existing.starts_at,
          expires_at: existing.expires_at,
          usage_limit: existing.usage_limit,
          minimum_order_amount: existing.minimum_order_amount,
        },
        updated: {
          code: updatedCoupon.code,
          discount_type: updatedCoupon.discount_type,
          discount_value: updatedCoupon.discount_value,
          is_active: updatedCoupon.is_active,
          starts_at: updatedCoupon.starts_at,
          expires_at: updatedCoupon.expires_at,
          usage_limit: updatedCoupon.usage_limit,
          minimum_order_amount: updatedCoupon.minimum_order_amount,
        },
        product_ids: cleanProductIds,
        product_targeting_changed: cleanProductIds !== null,
      },
    });

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon,
      message: "Coupon updated successfully",
      auditLogged,
    });
  } catch (error) {
    console.error("Coupon PATCH Exception:", error);

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
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const couponId = Number(id);

    if (!Number.isInteger(couponId)) {
      return NextResponse.json(
        { success: false, error: "Invalid coupon ID" },
        { status: 400 }
      );
    }

    const { data: existingCoupon, error: fetchError } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    const { data: productTargets, error: targetsError } = await supabase
      .from("coupon_products")
      .select("product_id")
      .eq("coupon_id", couponId);

    if (targetsError) {
      return NextResponse.json(
        { success: false, error: targetsError.message },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", couponId);

    if (error) {
      console.error("Coupon DELETE Error:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const auditLogged = await writeAuditLog({
      request,
      action: "delete",
      module: "coupons",
      targetType: "coupon",
      targetId: String(couponId),
      description: `Deleted coupon "${existingCoupon.code}".`,
      metadata: {
        coupon_id: couponId,
        code: existingCoupon.code,
        discount_type: existingCoupon.discount_type,
        discount_value: existingCoupon.discount_value,
        is_active: existingCoupon.is_active,
        starts_at: existingCoupon.starts_at,
        expires_at: existingCoupon.expires_at,
        usage_limit: existingCoupon.usage_limit,
        used_count: existingCoupon.used_count,
        minimum_order_amount: existingCoupon.minimum_order_amount,
        product_ids: (productTargets ?? []).map((row) => row.product_id),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
      auditLogged,
    });
  } catch (error) {
    console.error("Coupon DELETE Exception:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
