import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function numberValue(value: unknown) {
  const number = Number(value ?? 0);

  return Number.isFinite(number) ? number : 0;
}

export async function POST(
  request: NextRequest
) {
  try {
    /*
    ========================================
    PERMISSION CHECK
    ========================================

    Creating an admin/internal order requires:

    orders.create

    Super Admin is automatically allowed
    by the permission engine.
    ========================================
    */

    const allowed = await hasPermission(
      "orders",
      "create"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to create orders.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    READ REQUEST BODY
    ========================================
    */

    const body = await request.json();

    const orderId =
      cleanText(body.order_id) ||
      `BN-${Date.now()}`;

    const orderDate =
      cleanText(body.order_date) ||
      new Date().toISOString();

    const customerName =
      cleanText(body.customer_name);

    const phone =
      cleanText(body.phone);

    const district =
      cleanText(body.district);

    const deliveryArea =
      cleanText(body.delivery_area);

    const address =
      cleanText(body.address);

    const note =
      cleanText(body.note);

    const deliveryCharge =
      numberValue(
        body.delivery_charge
      );

    const manualDiscount =
      numberValue(
        body.discount
      );

    const couponCode =
      cleanText(
        body.coupon_code
      );

    const paidAmount =
      numberValue(
        body.paid_amount
      );

    const paymentMethod =
      cleanText(
        body.payment_method
      );

    const orderStatus =
      cleanText(
        body.status
      ) || "Pending";

    const createdBy =
      body.created_by ===
        null ||
      body.created_by ===
        undefined ||
      body.created_by === ""
        ? null
        : Number(
            body.created_by
          );

    const items =
      Array.isArray(body.items)
        ? body.items
        : [];

    /*
    ========================================
    BASIC VALIDATION
    ========================================
    */

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          error:
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
          error:
            "Customer phone is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "At least one product is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      createdBy !== null &&
      !Number.isFinite(createdBy)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid created_by value.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    NORMALIZE ITEMS
    ========================================

    Normalize items for PostgreSQL function.
    ========================================
    */

    const normalizedItems =
      items.map(
        (item: unknown) => {
          const value =
            item as Record<
              string,
              unknown
            >;

          return {
            productId:
              cleanText(
                value.productId
              ),

            productName:
              cleanText(
                value.productName
              ),

            productSlug:
              cleanText(
                value.productSlug
              ),

            variantId:
              value.variantId === null ||
              value.variantId === undefined ||
              value.variantId === ""
                ? null
                : Math.floor(
                    numberValue(
                      value.variantId
                    )
                  ),

            variantName:
              cleanText(
                value.variantName
              ) || null,

            variantSku:
              cleanText(
                value.variantSku
              ) || null,

            quantity: Math.floor(
              numberValue(
                value.quantity
              )
            ),

            unitPrice:
              numberValue(
                value.unitPrice
              ),
          };
        }
      );

    /*
    ========================================
    ITEM VALIDATION
    ========================================
    */

    for (const item of normalizedItems) {
      if (!item.productId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Every order item must have a product.",
          },
          {
            status: 400,
          }
        );
      }

      if (item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Product quantity must be greater than zero.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        item.variantId !== null &&
        (!Number.isInteger(item.variantId) ||
          item.variantId <= 0)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid variant ID.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    ========================================
    ADMIN ORDER RPC
    ========================================

    Facebook Pixel / CAPI is intentionally
    NOT used here.

    Admin orders are internal orders.
    The customer-facing website order flow
    remains responsible for browser/server
    tracking.
    ========================================
    */

    const {
      data,
      error,
    } = await supabaseAdmin.rpc(
      "create_admin_order_with_stock_v2",
      {
        p_order_id:
          orderId,

        p_order_date:
          orderDate,

        p_customer_name:
          customerName,

        p_phone:
          phone,

        p_district:
          district,

        p_delivery_area:
          null,

        p_address:
          address,

        p_note:
          note || null,

        p_delivery_charge:
          deliveryCharge,

        p_manual_discount:
          manualDiscount,

        p_coupon_code:
          couponCode || null,

        p_paid_amount:
          paidAmount,

        p_payment_method:
          paymentMethod || null,

        p_order_status:
          orderStatus,

        p_payment_status:
          "Unpaid",

        p_created_by:
          createdBy,

        p_items:
          normalizedItems,
      }
    );

    /*
    ========================================
    RPC ERROR
    ========================================
    */

    if (error) {
      console.error(
        "ADMIN ORDER CREATE RPC ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    AUDIT LOG
    ========================================
    */

    const auditLogged = await writeAuditLog({
      request,
      action: "create",
      module: "orders",
      targetType: "order",
      targetId: orderId,
      description:
        `Admin order created for ${customerName}.`,
      metadata: {
        order_id: orderId,
        customer_name: customerName,
        phone,
        district,
        delivery_area: deliveryArea,
        item_count: normalizedItems.length,
        items: normalizedItems.map((item: (typeof normalizedItems)[number]) => ({
          product_id: item.productId,
          product_name: item.productName,
          variant_id: item.variantId,
          variant_name: item.variantName,
          variant_sku: item.variantSku,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        delivery_charge: deliveryCharge,
        manual_discount: manualDiscount,
        coupon_code: couponCode || null,
        paid_amount: paidAmount,
        payment_method: paymentMethod || null,
        order_status: orderStatus,
        created_by: createdBy,
      },
    });

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json(
      {
        success: true,
        order: data,
        auditLogged,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /*
    ========================================
    UNEXPECTED ERROR
    ========================================
    */

    console.error(
      "ADMIN ORDER CREATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create admin order.",
      },
      {
        status: 500,
      }
    );
  }
}