import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();
   
   console.log("ORDER BODY:", body);

    console.log(
      "LOOKING FOR PRODUCT:",
      body.productId
    );

    const quantity = Number(
      body.quantity || 1
    );

    // Get Product

    const {
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq(
        "product_id",
        String(body.productId)
      )
      .single();

      console.log("PRODUCT RESULT:", product);
console.log("PRODUCT ERROR:", productError);

    if (
      productError ||
      !product
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

    const realStock =
      Number(
        product.real_stock || 0
      );

    const displayStock =
      Number(
        product.display_stock || 0
      );

    // Stock Check

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

    // Generate Order ID

    const orderId =
      "BN-" + Date.now();
    const pixelId =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

const accessToken =
  process.env.FACEBOOK_ACCESS_TOKEN;

const clientIp =
  request.headers.get(
    "x-forwarded-for"
  ) || "";

const userAgent =
  request.headers.get(
    "user-agent"
  ) || "";

const hashedPhone =
  crypto
    .createHash("sha256")
    .update(
      String(body.phone || "")
        .replace(/\D/g, "")
        .trim()
    )
    .digest("hex");


    // Create Order

    const {
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .insert({
        order_id: orderId,

        order_date:
          body.orderDate,

        product_id:
          String(
            body.productId
          ),

        product_name:
          body.productName,

        product_slug:
          body.productSlug,

        customer_name:
          body.customerName,

phone:
  body.phone,

district:
  body.district,

delivery_area:
  body.deliveryArea,

address:
  body.address,

        delivery_charge:
          Number(
            body.deliveryCharge
          ),

        discount:
          Number(
            body.discount
          ),

        coupon_code:
          body.couponCode,

        quantity,

        product_price:
          Number(
            product.price
          ),

        total:
          Number(body.total),

        status:
          "Pending",

        tracking_code: "",
        consignment_id: "",
        courier_status: "",
      });

    if (orderError) {
      return NextResponse.json(
        {
          success: false,
          message:
            orderError.message,
        },
        {
          status: 500,
        }
      );
    }

    // Update Stock

    let newRealStock =
      realStock - quantity;

    let newDisplayStock =
      displayStock - quantity;

    let newStatus =
      product.status;

    if (
      newRealStock <= 0
    ) {
      newRealStock = 0;
      newDisplayStock = 0;
      newStatus =
        "Inactive";
    } else {
      if (
        newDisplayStock <= 0
      ) {
        newDisplayStock =
          Math.min(
            20,
            newRealStock
          );
      }
    }

    const {
      error: stockError,
    } = await supabaseAdmin
      .from("products")
      .update({
        real_stock:
          newRealStock,

        display_stock:
          newDisplayStock,

        status:
          newStatus,
      })
      .eq(
        "product_id",
        String(body.productId)
      );

try {
  if (
    pixelId &&
    accessToken
  ) {
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
                  Number(
                    body.total
                  ),

                content_ids: [
                  String(
                    body.productId
                  ),
                ],

                content_name:
                  body.productName,

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
  }
} catch (error) {
  console.error(
    "CAPI ERROR:",
    error
  );
}

    if (stockError) {
      return NextResponse.json(
        {
          success: false,
          message:
            stockError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
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