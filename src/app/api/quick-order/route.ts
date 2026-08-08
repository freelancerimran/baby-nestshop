import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";

/*
============================================================
QUICK ORDER API
============================================================

Purpose:

Quick Cart
    ↓
One API Request
    ↓
create_quick_order()
    ↓
One Master Order
    ↓
Multiple order_items
    ↓
Atomic Inventory Update

IMPORTANT:

This API does NOT call:

create_order_with_stock()

The existing single-product production API remains
untouched.

Inventory is handled atomically inside:

create_quick_order()

============================================================
*/

interface QuickOrderItem {
  productId: number | string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  slug?: string;
}

interface QuickOrderRequest {
  customerName: string;
  phone: string;
  district: string;
  address: string;

  note?: string;

  deliveryArea?: string;
  deliveryCharge?: number;

  couponCode?: string;
  discount?: number;

  subtotal?: number;
  total?: number;

  items: QuickOrderItem[];
}

/*
============================================================
POST
============================================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    /*
    ========================================================
    READ REQUEST
    ========================================================
    */

    const body =
      (await request.json()) as QuickOrderRequest;


    /*
    ========================================================
    BASIC CUSTOMER VALIDATION
    ========================================================
    */

    const customerName =
      String(
        body.customerName ?? ""
      ).trim();

    const phone =
      String(
        body.phone ?? ""
      ).trim();

    const district =
      String(
        body.district ?? ""
      ).trim();

    const address =
      String(
        body.address ?? ""
      ).trim();

    const deliveryArea =
      String(
        body.deliveryArea ?? ""
      ).trim();

    const couponCode =
      String(
        body.couponCode ?? ""
      ).trim();


    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer name is required.",
        },
        {
          status: 400,
        }
      );
    }


    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number is required.",
        },
        {
          status: 400,
        }
      );
    }


    if (!district) {
      return NextResponse.json(
        {
          success: false,
          message:
            "District is required.",
        },
        {
          status: 400,
        }
      );
    }


    if (!address) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Address is required.",
        },
        {
          status: 400,
        }
      );
    }


    /*
    ========================================================
    CART VALIDATION
    ========================================================
    */

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cart is empty.",
        },
        {
          status: 400,
        }
      );
    }


    /*
    ========================================================
    NORMALIZE CART ITEMS
    ========================================================

    The database is the source of truth for:

    - Product name
    - Product price
    - Product slug
    - Stock

    Therefore we only send:

    productId
    quantity

    to the PostgreSQL function.
    ========================================================
    */

    const items = body.items.map(
      (
        item,
        index
      ) => {
        const productId =
          String(
            item?.productId ?? ""
          ).trim();

        const quantity =
          Number(
            item?.quantity ?? 0
          );

        if (!productId) {
          throw new Error(
            `Product ID missing for cart item ${index + 1}.`
          );
        }

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          throw new Error(
            `Invalid quantity for product ${productId}.`
          );
        }

        return {
          productId,
          quantity,
        };
      }
    );


    /*
    ========================================================
    CHECK DUPLICATE PRODUCTS
    ========================================================

    One product should exist only once in the cart.

    This prevents accidental duplicate order_items.
    ========================================================
    */

    const productIds =
      items.map(
        (item) =>
          item.productId
      );

    const uniqueProductIds =
      new Set(
        productIds
      );

    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Duplicate products found in cart.",
        },
        {
          status: 400,
        }
      );
    }


    /*
    ========================================================
    NORMALIZE DELIVERY / DISCOUNT
    ========================================================
    */

    const deliveryCharge =
      Math.max(
        0,
        Number(
          body.deliveryCharge ?? 0
        )
      );

    const discount =
      Math.max(
        0,
        Number(
          body.discount ?? 0
        )
      );


    if (
      !Number.isFinite(
        deliveryCharge
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid delivery charge.",
        },
        {
          status: 400,
        }
      );
    }


    if (
      !Number.isFinite(
        discount
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid discount.",
        },
        {
          status: 400,
        }
      );
    }


    /*
    ========================================================
    CALL ATOMIC DATABASE FUNCTION
    ========================================================

    IMPORTANT:

    We deliberately do NOT calculate:

    - Product price
    - Subtotal
    - Grand total
    - Stock

    here.

    PostgreSQL calculates those values using the current
    database state.

    This prevents the client from changing product prices
    or bypassing stock validation.
    ========================================================
    */

    const {
      data: result,
      error: rpcError,
    } =
      await supabaseAdmin.rpc(
        "create_quick_order",
        {
          p_customer_name:
            customerName,

          p_phone:
            phone,

          p_district:
            district,

          p_delivery_area:
            deliveryArea,

          p_address:
            address,

          p_delivery_charge:
            deliveryCharge,

          p_discount:
            discount,

          p_coupon_code:
            couponCode ||
            null,

          p_items:
            items,
        }
      );


    /*
    ========================================================
    DATABASE ERROR
    ========================================================
    */

    if (rpcError) {
      console.error(
        "QUICK ORDER RPC ERROR:",
        rpcError
      );

      const message =
        String(
          rpcError.message ?? ""
        );


      /*
      ------------------------------------------------------
      STOCK ERROR
      ------------------------------------------------------
      */

      if (
        message.includes(
          "Product Out Of Stock"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              message,
          },
          {
            status: 400,
          }
        );
      }


      /*
      ------------------------------------------------------
      PRODUCT NOT FOUND
      ------------------------------------------------------
      */

      if (
        message.includes(
          "Product not found"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              message,
          },
          {
            status: 404,
          }
        );
      }


      /*
      ------------------------------------------------------
      CART ERROR
      ------------------------------------------------------
      */

      if (
        message.includes(
          "Cart is empty"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Cart is empty.",
          },
          {
            status: 400,
          }
        );
      }


      /*
      ------------------------------------------------------
      GENERIC DATABASE ERROR
      ------------------------------------------------------
      */

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create order.",
        },
        {
          status: 500,
        }
      );
    }


    /*
    ========================================================
    VALIDATE RPC RESPONSE
    ========================================================
    */

    if (
      !result ||
      typeof result !==
        "object"
    ) {
      console.error(
        "INVALID QUICK ORDER RPC RESULT:",
        result
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Order creation returned an invalid response.",
        },
        {
          status: 500,
        }
      );
    }


    /*
    ========================================================
    EXTRACT MASTER ORDER INFORMATION
    ========================================================
    */

    const orderResult =
      result as {
        success?: boolean;
        orderId?: string;
        orderType?: string;
        itemCount?: number;
        totalItems?: number;
        subtotal?: number;
        deliveryCharge?: number;
        discount?: number;
        grandTotal?: number;
        paidAmount?: number;
        dueAmount?: number;
        paymentStatus?: string;
      };


    const orderId =
      String(
        orderResult.orderId ?? ""
      ).trim();


    if (!orderId) {
      console.error(
        "QUICK ORDER ID MISSING:",
        result
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Order was created but order ID was not returned.",
        },
        {
          status: 500,
        }
      );
    }


    /*
    ========================================================
    FACEBOOK CONVERSIONS API
    ========================================================

    IMPORTANT:

    The database transaction has already succeeded.

    Therefore Facebook failure MUST NOT cancel the order.

    Purchase event:

    One Master Order
    Multiple Product IDs
    One Total Value
    ========================================================
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


    /*
    ========================================================
    HASH PHONE FOR FACEBOOK
    ========================================================
    */

    const normalizedPhone =
      phone.replace(
        /\D/g,
        ""
      );


    const hashedPhone =
      crypto
        .createHash(
          "sha256"
        )
        .update(
          normalizedPhone
        )
        .digest(
          "hex"
        );


    /*
    ========================================================
    FACEBOOK PURCHASE
    ========================================================
    */

    try {
      if (
        pixelId &&
        accessToken
      ) {
        const capiResponse =
          await fetch(
            `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${accessToken}`,
            {
              method:
                "POST",

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

                      /*
                      ----------------------------------------
                      IMPORTANT

                      Same order ID is used as event_id.
                      This gives Facebook a stable identifier
                      for the Purchase event.
                      ----------------------------------------
                      */

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
                            orderResult.grandTotal ??
                              0
                          ),

                        content_ids:
                          productIds,

                        content_type:
                          "product",

                        num_items:
                          Number(
                            orderResult.totalItems ??
                              0
                          ),
                      },
                    },
                  ],
                }),
            }
          );


        /*
        ------------------------------------------------------
        CAPI FAILURE

        Never fail the actual order.
        ------------------------------------------------------
        */

        if (
          !capiResponse.ok
        ) {
          const capiError =
            await capiResponse.text();

          console.error(
            "QUICK ORDER CAPI RESPONSE ERROR:",
            capiError
          );
        }
      }
    } catch (
      capiError
    ) {
      console.error(
        "QUICK ORDER CAPI ERROR:",
        capiError
      );
    }


    /*
    ========================================================
    SUCCESS
    ========================================================
    */

    return NextResponse.json(
      {
        success: true,

        orderId,

        orderType:
          orderResult.orderType ||
          "multi",

        itemCount:
          Number(
            orderResult.itemCount ??
              items.length
          ),

        totalItems:
          Number(
            orderResult.totalItems ??
              0
          ),

        subtotal:
          Number(
            orderResult.subtotal ??
              0
          ),

        deliveryCharge:
          Number(
            orderResult.deliveryCharge ??
              deliveryCharge
          ),

        discount:
          Number(
            orderResult.discount ??
              discount
          ),

        grandTotal:
          Number(
            orderResult.grandTotal ??
              0
          ),

        paidAmount:
          Number(
            orderResult.paidAmount ??
              0
          ),

        dueAmount:
          Number(
            orderResult.dueAmount ??
              0
          ),

        paymentStatus:
          orderResult.paymentStatus ||
          "Unpaid",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /*
    ========================================================
    REQUEST / UNEXPECTED ERROR
    ========================================================
    */

    console.error(
      "QUICK ORDER API ERROR:",
      error
    );


    const message =
      error instanceof Error
        ? error.message
        : "Order submission failed.";


    /*
    --------------------------------------------------------
    CLIENT-SIDE VALIDATION ERROR
    --------------------------------------------------------
    */

    if (
      message.includes(
        "Product ID missing"
      ) ||
      message.includes(
        "Invalid quantity"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status: 400,
        }
      );
    }


    /*
    --------------------------------------------------------
    GENERIC ERROR
    --------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: false,
        message:
          "Order submission failed.",
      },
      {
        status: 500,
      }
    );
  }
}