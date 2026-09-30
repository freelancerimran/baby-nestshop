import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

type IncomingItem = {
  productId?: string | number;
  productName?: string;
  productSlug?: string;
  variantId?: string | number | null;
  variantName?: string | null;
  variantSku?: string | null;
  quantity?: number;
  unitPrice?: number;
};

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const productId = String(
      body.productId || ""
    ).trim();

    const quantity = Number(
      body.quantity || 1
    );

    const items = Array.isArray(body.items)
      ? (body.items as IncomingItem[])
      : [];

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID required",
        },
        { status: 400 }
      );
    }

    if (
      items.length === 0 &&
      (!Number.isInteger(quantity) || quantity <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid quantity",
        },
        { status: 400 }
      );
    }

    const {
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select(
        `
        product_id,
        product_name,
        slug,
        price,
        real_stock,
        display_stock,
        status
        `
      )
      .eq("product_id", productId)
      .single();

    if (productError || !product) {
      console.error(
        "PRODUCT FETCH ERROR:",
        productError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    const {
      count: variantCount,
      error: variantCountError,
    } = await supabaseAdmin
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if (variantCountError) {
      console.error(
        "PRODUCT VARIANT CHECK ERROR:",
        variantCountError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify product variants.",
        },
        { status: 500 }
      );
    }

    const productHasVariants =
      Number(variantCount || 0) > 0;

    if (productHasVariants && items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select at least one variant to continue.",
        },
        { status: 400 }
      );
    }

    const orderId = "BN-" + Date.now();

    const deliveryCharge = Number(
      body.deliveryCharge || 0
    );

    const couponCode = body.couponCode
      ? String(body.couponCode).trim().toUpperCase()
      : null;

    let rpcResult: Record<string, unknown> | null = null;

    if (items.length > 0) {
      /*
      ========================================
      VARIANT ORDER VALIDATION
      ========================================
      */

      const normalizedItems = items.map(
        (item) => ({
          productId: String(
            item.productId || productId
          ).trim(),
          productName: String(
            item.productName || product.product_name
          ).trim(),
          productSlug: String(
            item.productSlug || product.slug || ""
          ).trim(),
          variantId:
            item.variantId === null ||
            item.variantId === undefined ||
            item.variantId === ""
              ? null
              : Number(item.variantId),
          variantName:
            item.variantName
              ? String(item.variantName).trim()
              : null,
          variantSku:
            item.variantSku
              ? String(item.variantSku).trim()
              : null,
          quantity: Math.floor(
            Number(item.quantity || 0)
          ),
        })
      );

      if (
        normalizedItems.some(
          (item) =>
            !item.productId ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0 ||
            !Number.isInteger(item.variantId) ||
            Number(item.variantId) <= 0
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select at least one valid variant and quantity.",
          },
          { status: 400 }
        );
      }

      /*
      ========================================
      AUTHORITATIVE VARIANT PRE-CHECK
      ========================================
      */

      for (const item of normalizedItems) {
        const {
          data: variant,
          error: variantError,
        } = await supabaseAdmin
          .from("product_variants")
          .select(
            "id, product_id, variant_name, price, real_stock, status"
          )
          .eq("id", Number(item.variantId))
          .eq("product_id", item.productId)
          .maybeSingle();

        if (variantError) {
          console.error(
            "VARIANT FETCH ERROR:",
            variantError
          );

          return NextResponse.json(
            {
              success: false,
              message: "Unable to verify selected variant.",
            },
            { status: 500 }
          );
        }

        if (!variant) {
          return NextResponse.json(
            {
              success: false,
              message: "Selected variant was not found.",
            },
            { status: 404 }
          );
        }

        if (
          String(variant.status).toLowerCase() !==
          "active"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `${variant.variant_name} is currently unavailable.`,
            },
            { status: 400 }
          );
        }

        if (
          Number(variant.real_stock || 0) <
          item.quantity
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `${variant.variant_name} does not have enough stock.`,
            },
            { status: 400 }
          );
        }
      }

      /*
      ========================================
      ATOMIC MULTI-VARIANT ORDER
      ========================================
      */

      const {
        data,
        error,
      } = await supabaseAdmin.rpc(
        "create_customer_order_multi_variant",
        {
          p_order_id: orderId,
          p_order_date:
            body.orderDate || new Date().toISOString(),
          p_customer_name: String(
            body.customerName || ""
          ),
          p_phone: String(body.phone || ""),
          p_district: String(
            body.district || ""
          ),
          p_delivery_area: String(
            body.deliveryArea || ""
          ),
          p_address: String(
            body.address || ""
          ),
          p_note: body.note
            ? String(body.note)
            : null,
          p_delivery_charge: deliveryCharge,
          p_manual_discount: 0,
          p_coupon_code: couponCode,
          p_items: normalizedItems,
        }
      );

      if (error) {
        console.error(
          "MULTI-VARIANT ORDER RPC ERROR:",
          error
        );

        const message = String(
          error.message || ""
        );

        if (
          message.includes("Out Of Stock") ||
          message.includes("unavailable")
        ) {
          return NextResponse.json(
            {
              success: false,
              message,
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to create order safely.",
          },
          { status: 500 }
        );
      }

      rpcResult =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : null;
    } else {
      /*
      ========================================
      LEGACY NON-VARIANT ORDER
      ========================================

      Existing customer behavior remains on
      create_order_with_stock().
      ========================================
      */

      const realStock = Number(
        product.real_stock || 0
      );

      if (realStock < quantity) {
        return NextResponse.json(
          {
            success: false,
            message: "Product Out Of Stock",
          },
          { status: 400 }
        );
      }

      const {
        data,
        error,
      } = await supabaseAdmin.rpc(
        "create_order_with_stock",
        {
          p_order_id: orderId,
          p_order_date:
            body.orderDate || new Date().toISOString(),
          p_product_id: productId,
          p_product_name:
            product.product_name,
          p_product_slug:
            product.slug || body.productSlug || "",
          p_customer_name: String(
            body.customerName || ""
          ),
          p_phone: String(body.phone || ""),
          p_district: String(
            body.district || ""
          ),
          p_delivery_area: String(
            body.deliveryArea || ""
          ),
          p_address: String(
            body.address || ""
          ),
          p_delivery_charge: deliveryCharge,
          p_discount: Number(
            body.discount || 0
          ),
          p_coupon_code: couponCode,
          p_quantity: quantity,
          p_product_price: Number(
            product.price || 0
          ),
          p_total: Number(
            body.total || 0
          ),
        }
      );

      if (error) {
        console.error(
          "CREATE ORDER RPC ERROR:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to create order safely.",
          },
          { status: 500 }
        );
      }

      rpcResult =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : null;
    }

    /*
    ========================================
    FACEBOOK CONVERSIONS API
    ========================================

    CAPI failure never fails the order.
    ========================================
    */

    const pixelId =
      process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

    const accessToken =
      process.env.FACEBOOK_ACCESS_TOKEN;

    const forwardedFor =
      request.headers.get("x-forwarded-for") || "";

    const clientIp = forwardedFor
      .split(",")[0]
      .trim();

    const userAgent =
      request.headers.get("user-agent") || "";

    const normalizedPhone = String(
      body.phone || ""
    )
      .replace(/\D/g, "")
      .trim();

    const hashedPhone = crypto
      .createHash("sha256")
      .update(normalizedPhone)
      .digest("hex");

    const serverTotal = Number(
      rpcResult?.grandTotal ??
        body.total ??
        0
    );

    const contentIds =
      items.length > 0
        ? items.map((item) =>
            String(item.variantId)
          )
        : [productId];

    const totalItems =
      items.length > 0
        ? items.reduce(
            (sum, item) =>
              sum + Number(item.quantity || 0),
            0
          )
        : quantity;

    try {
      if (pixelId && accessToken) {
        const capiResponse =
          await fetch(
            `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                data: [
                  {
                    event_name: "Purchase",
                    event_time: Math.floor(
                      Date.now() / 1000
                    ),
                    action_source: "website",
                    event_source_url:
                      "https://www.baby-nestshop.com",
                    event_id: orderId,
                    user_data: {
                      ph: [hashedPhone],
                      client_ip_address:
                        clientIp,
                      client_user_agent:
                        userAgent,
                    },
                    custom_data: {
                      currency: "BDT",
                      value: serverTotal,
                      content_ids: contentIds,
                      content_name:
                        product.product_name,
                      content_type: "product",
                      num_items: totalItems,
                    },
                  },
                ],
              }),
            }
          );

        if (!capiResponse.ok) {
          const capiError =
            await capiResponse.text();

          console.error(
            "CAPI RESPONSE ERROR:",
            capiError
          );
        }
      }
    } catch (capiError) {
      console.error(
        "CAPI ERROR:",
        capiError
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      stock: rpcResult,
    });
  } catch (error) {
    console.error(
      "ORDER API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Order submission failed",
      },
      { status: 500 }
    );
  }
}
