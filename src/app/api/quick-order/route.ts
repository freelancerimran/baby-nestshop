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

Flow:

Quick Cart
    ↓
Quick Order Page
    ↓
Product / Variant Selection
    ↓
POST /api/quick-order
    ↓
create_quick_order()
    ↓
Atomic Order + Stock Transaction


IMPORTANT:

The database is the source of truth for:

- Product
- Variant
- Price
- Stock
- Subtotal
- Discount
- Grand Total

The client NEVER controls final price or stock.
============================================================
*/


/*
============================================================
TYPES
============================================================
*/

interface QuickOrderItem {
  productId: number | string;

  /*
  Variant product:

  variantId = selected variant ID

  Non-variant product:

  variantId = null
  */

  variantId?: number | string | null;

  variantName?: string | null;

  variantSku?: string | null;

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


    /*
    ========================================================
    REQUIRED FIELDS
    ========================================================
    */

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
    NORMALIZE ITEMS
    ========================================================

    IMPORTANT:

    We preserve variantId.

    Before:

        productId
        quantity

    Now:

        productId
        variantId
        quantity

    Product price and stock are still NOT trusted from
    the client.
    ========================================================
    */

    const items =
      body.items.map(
        (
          item,
          index
        ) => {

          const productId =
            String(
              item?.productId ?? ""
            ).trim();


          const rawVariantId =
            item?.variantId;


          const variantId =
            rawVariantId ===
              null ||
            rawVariantId ===
              undefined ||
            String(
              rawVariantId
            ).trim() === ""
              ? null
              : Number(
                  rawVariantId
                );


          const quantity =
            Number(
              item?.quantity ?? 0
            );


          /*
          ----------------------------------------------------
          PRODUCT ID
          ----------------------------------------------------
          */

          if (!productId) {

            throw new Error(
              `Product ID missing for cart item ${
                index + 1
              }.`
            );

          }


          /*
          ----------------------------------------------------
          QUANTITY
          ----------------------------------------------------
          */

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


          /*
          ----------------------------------------------------
          VARIANT ID
          ----------------------------------------------------

          If provided, it MUST be a valid integer.
          ----------------------------------------------------
          */

          if (
            variantId !== null &&
            (
              !Number.isInteger(
                variantId
              ) ||
              variantId <= 0
            )
          ) {

            throw new Error(
              `Invalid variant for product ${productId}.`
            );

          }


          return {

            productId,

            variantId,

            quantity,

          };

        }
      );


    /*
    ========================================================
    DUPLICATE CART ITEM CHECK
    ========================================================

    IMPORTANT:

    Same product with DIFFERENT variants is allowed.

    Example:

        Product A / Red × 2
        Product A / Blue × 1

    Same exact product + variant cannot appear twice.
    ========================================================
    */

    const itemKeys =
      items.map(
        (item) =>
          `${item.productId}::${
            item.variantId ??
            "base"
          }`
      );


    const uniqueItemKeys =
      new Set(
        itemKeys
      );


    if (
      uniqueItemKeys.size !==
      itemKeys.length
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            "Duplicate product variant found in cart.",
        },
        {
          status: 400,
        }
      );

    }


    /*
    ========================================================
    DELIVERY
    ========================================================
    */

    const deliveryCharge =
      Math.max(
        0,
        Number(
          body.deliveryCharge ?? 0
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


    /*
    ========================================================
    DISCOUNT

    Client discount is passed only for compatibility.

    Final discount is calculated inside PostgreSQL.
    ========================================================
    */

    const discount =
      Math.max(
        0,
        Number(
          body.discount ?? 0
        )
      );


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

    create_quick_order() already supports:

    - variantId
    - multiple variants
    - multiple products
    - legacy non-variant products
    - authoritative variant price
    - authoritative stock
    - atomic inventory update
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
          rpcError.message ??
            ""
        );


      /*
      ------------------------------------------------------
      VARIANT STOCK
      ------------------------------------------------------
      */

      if (
        message.includes(
          "Product Variant Out Of Stock"
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
      ------------------------------------------------------
      PRODUCT STOCK
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
            message,
          },
          {
            status: 400,
          }
        );

      }


      /*
      ------------------------------------------------------
      VARIANT NOT FOUND
      ------------------------------------------------------
      */

      if (
        message.includes(
          "Product variant not found"
        )
      ) {

        return NextResponse.json(
          {
            success: false,
            message:
              "Selected variant was not found.",
          },
          {
            status: 404,
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
      COUPON ERROR
      ------------------------------------------------------
      */

      if (
        message.includes(
          "Coupon"
        ) ||
        message.includes(
          "coupon"
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
    EXTRACT ORDER RESULT
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
        orderResult.orderId ??
          ""
      ).trim();


    /*
    ========================================================
    ORDER ID VALIDATION
    ========================================================
    */

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
    META COOKIES
    ========================================================
    */

    const fbp =
      request.cookies.get(
        "_fbp"
      )?.value || "";


    const fbc =
      request.cookies.get(
        "_fbc"
      )?.value || "";


    /*
    ========================================================
    PHONE HASH
    ========================================================
    */

    const phoneDigits =
      phone.replace(
        /\D/g,
        ""
      );


    let normalizedPhone =
      phoneDigits;


    if (
      phoneDigits.startsWith(
        "01"
      ) &&
      phoneDigits.length ===
        11
    ) {

      normalizedPhone =
        `88${phoneDigits}`;

    }


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
    EVENT SOURCE URL
    ========================================================
    */

    const eventSourceUrl =
      request.headers.get(
        "referer"
      ) ||
      `${
        new URL(
          request.url
        ).origin
      }/quick-order`;


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

              body: JSON.stringify(
                {
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
                        eventSourceUrl,

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

                        ...(fbp
                          ? {
                              fbp,
                            }
                          : {}),

                        ...(fbc
                          ? {
                              fbc,
                            }
                          : {}),
                      },

                      custom_data: {

                        currency:
                          "BDT",

                        value:
                          Number(
                            orderResult.grandTotal ??
                              0
                          ),

                        /*
                        Meta receives the parent
                        product IDs.

                        Variant IDs are included in
                        contents below.
                        */

                        content_ids:
                          Array.from(
                            new Set(
                              items.map(
                                (
                                  item
                                ) =>
                                  String(
                                    item.productId
                                  )
                              )
                            )
                          ),

                        contents:
                          items.map(
                            (
                              item
                            ) => ({
                              id:
                                String(
                                  item.productId
                                ),

                              quantity:
                                Number(
                                  item.quantity
                                ),

                              ...(item.variantId
                                ? {
                                    item_price:
                                      undefined,
                                  }
                                : {}),
                            })
                          ),

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
                }
              ),
            }
          );


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

      /*
      Facebook failure must NEVER
      cancel a successful order.
      */

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

  } catch (
    error
  ) {

    /*
    ========================================================
    UNEXPECTED ERROR
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
    CLIENT VALIDATION
    --------------------------------------------------------
    */

    if (
      message.includes(
        "Product ID missing"
      ) ||
      message.includes(
        "Invalid quantity"
      ) ||
      message.includes(
        "Invalid variant"
      ) ||
      message.includes(
        "Duplicate product variant"
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