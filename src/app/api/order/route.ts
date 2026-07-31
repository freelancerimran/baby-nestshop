import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

import crypto from "crypto";

/*
==========================================
CREATE ORDER
==========================================

IMPORTANT:

Order creation + stock deduction are
handled atomically by PostgreSQL RPC:

create_order_with_stock()

This protects against:

- Order created but stock not deducted
- Stock deducted but order not created
- Simultaneous stock race conditions
- Overselling caused by concurrent orders

Facebook CAPI runs only AFTER the database
transaction succeeds.
==========================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    /*
    ========================================
    REQUEST BODY
    ========================================
    */

    const body =
      await request.json();

    console.log(
      "ORDER BODY:",
      body
    );

    const productId =
      String(
        body.productId || ""
      ).trim();

    const quantity =
      Number(
        body.quantity || 1
      );

    /*
    ========================================
    BASIC VALIDATION
    ========================================
    */

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product ID required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid quantity",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    GET PRODUCT
    ========================================

    We still fetch the product here for:

    - canonical product name
    - canonical slug
    - canonical selling price
    - Facebook CAPI

    Stock validation itself happens again
    inside PostgreSQL under a row lock.
    ========================================
    */

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
      .eq(
        "product_id",
        productId
      )
      .single();

    if (
      productError ||
      !product
    ) {
      console.error(
        "PRODUCT FETCH ERROR:",
        productError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
    ========================================
    PRE-CHECK STOCK
    ========================================

    This gives the customer a clean error
    quickly.

    The authoritative stock check still
    happens inside the PostgreSQL RPC.
    ========================================
    */

    const realStock =
      Number(
        product.real_stock || 0
      );

    if (
      realStock < quantity
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product Out Of Stock",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    GENERATE ORDER ID
    ========================================
    */

    const orderId =
      "BN-" + Date.now();

    /*
    ========================================
    NORMALIZE ORDER VALUES
    ========================================
    */

    const deliveryCharge =
      Number(
        body.deliveryCharge || 0
      );

    const discount =
      Number(
        body.discount || 0
      );

    const total =
      Number(
        body.total || 0
      );

    const productPrice =
      Number(
        product.price || 0
      );

    /*
    ========================================
    ATOMIC ORDER + STOCK TRANSACTION
    ========================================

    PostgreSQL performs:

    1. Lock product row
    2. Validate real stock
    3. Calculate real stock
    4. Calculate display stock
    5. Refill display stock if required
    6. Create order
    7. Update product stock
    8. Commit everything together

    Any failure rolls back everything.
    ========================================
    */

    const {
      data: rpcResult,
      error: rpcError,
    } = await supabaseAdmin.rpc(
      "create_order_with_stock",
      {
        p_order_id:
          orderId,

        p_order_date:
          body.orderDate ||
          new Date().toISOString(),

        p_product_id:
          productId,

        p_product_name:
          product.product_name,

        p_product_slug:
          product.slug ||
          body.productSlug ||
          "",

        p_customer_name:
          String(
            body.customerName ||
              ""
          ),

        p_phone:
          String(
            body.phone || ""
          ),

        p_district:
          String(
            body.district || ""
          ),

        p_delivery_area:
          String(
            body.deliveryArea ||
              ""
          ),

        p_address:
          String(
            body.address || ""
          ),

        p_delivery_charge:
          deliveryCharge,

        p_discount:
          discount,

        p_coupon_code:
          body.couponCode
            ? String(
                body.couponCode
              )
            : null,

        p_quantity:
          quantity,

        p_product_price:
          productPrice,

        p_total:
          total,
      }
    );

    /*
    ========================================
    RPC ERROR
    ========================================
    */

    if (rpcError) {
      console.error(
        "CREATE ORDER RPC ERROR:",
        rpcError
      );

      const message =
        String(
          rpcError.message || ""
        );

      if (
        message.includes(
          "Product Out Of Stock"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product Out Of Stock",
          },
          {
            status: 400,
          }
        );
      }

      if (
        message.includes(
          "Product not found"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product not found",
          },
          {
            status: 404,
          }
        );
      }

      if (
        message.includes(
          "Invalid order quantity"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid quantity",
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json(
        {
          success: false,

          message:
            "Unable to create order",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "ATOMIC ORDER RESULT:",
      rpcResult
    );

    /*
    ========================================
    FACEBOOK CONVERSIONS API
    ========================================

    IMPORTANT:

    CAPI failure does NOT fail the order.

    The real order has already been safely
    committed to the database.
    ========================================
    */

    const pixelId =
      process.env
        .NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

    const accessToken =
      process.env
        .FACEBOOK_ACCESS_TOKEN;

    const forwardedFor =
      request.headers.get(
        "x-forwarded-for"
      ) || "";

    const clientIp =
      forwardedFor
        .split(",")[0]
        .trim();

    const userAgent =
      request.headers.get(
        "user-agent"
      ) || "";

    const normalizedPhone =
      String(
        body.phone || ""
      )
        .replace(/\D/g, "")
        .trim();

    const hashedPhone =
      crypto
        .createHash("sha256")
        .update(
          normalizedPhone
        )
        .digest("hex");

    try {
      if (
        pixelId &&
        accessToken
      ) {
        const capiResponse =
          await fetch(
            `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  data: [
                    {
                      event_name:
                        "Purchase",

                      event_time:
                        Math.floor(
                          Date.now() /
                            1000
                        ),

                      action_source:
                        "website",

                      event_source_url:
                        "https://www.baby-nestshop.com",

                      event_id:
                        orderId,

                      user_data: {
                        ph: [
                          hashedPhone,
                        ],

                        client_ip_address:
                          clientIp,

                        client_user_agent:
                          userAgent,
                      },

                      custom_data: {
                        currency:
                          "BDT",

                        value:
                          total,

                        content_ids: [
                          productId,
                        ],

                        content_name:
                          product.product_name,

                        content_type:
                          "product",

                        num_items:
                          quantity,
                      },
                    },
                  ],
                }),
            }
          );

        /*
        ====================================
        OPTIONAL CAPI LOGGING
        ====================================
        */

        if (
          !capiResponse.ok
        ) {
          const capiError =
            await capiResponse
              .text();

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

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      orderId,

      stock:
        rpcResult,
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
      {
        status: 500,
      }
    );
  }
}