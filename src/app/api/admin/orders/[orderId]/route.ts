import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type UpdateOrderBody = {
  customerName?: string;
  phone?: string;
  district?: string;
  address?: string;
  note?: string;

  deliveryCharge?: number;
  manualDiscount?: number;
  couponCode?: string;

  paidAmount?: number;
  paymentMethod?: string;

  orderStatus?: string;

  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
  }>;
};

/*
========================================
GET — ORDER DETAILS
========================================
*/

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    GET ORDER
    ========================================
    */

    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Get order error:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          error: orderError.message,
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 }
      );
    }

    /*
    ========================================
    GET ORDER ITEMS
    ========================================
    */

    const {
      data: items,
      error: itemsError,
    } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("id", {
        ascending: true,
      });

    if (itemsError) {
      console.error(
        "Get order items error:",
        itemsError
      );

      return NextResponse.json(
        {
          success: false,
          error: itemsError.message,
        },
        { status: 500 }
      );
    }

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,
      order,
      items: items ?? [],
    });
  } catch (error) {
    console.error(
      "GET /api/admin/orders/[orderId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch order.",
      },
      { status: 500 }
    );
  }
}

/*
========================================
PATCH — UPDATE ADMIN ORDER
========================================
*/

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  try {
    const { orderId } = await context.params;

    /*
    ========================================
    ORDER ID VALIDATION
    ========================================
    */

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    READ BODY
    ========================================
    */

    const body =
      (await request.json()) as UpdateOrderBody;

    /*
    ========================================
    BASIC VALIDATION
    ========================================
    */

    if (
      !body.customerName ||
      !body.customerName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer name is required.",
        },
        { status: 400 }
      );
    }

    if (
      !body.phone ||
      !body.phone.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "At least one product is required.",
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    NORMALIZE ITEMS
    ========================================
    */

    const items = body.items.map((item) => {
      const productId =
        String(
          item.productId ?? ""
        ).trim();

      const quantity =
        Math.max(
          1,
          Number(item.quantity) || 1
        );

      const unitPrice =
        item.unitPrice === undefined
          ? undefined
          : Math.max(
              0,
              Number(item.unitPrice) || 0
            );

      return {
        productId,
        quantity,
        ...(unitPrice !== undefined
          ? { unitPrice }
          : {}),
      };
    });

    /*
    ========================================
    PRODUCT ID VALIDATION
    ========================================
    */

    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Every order item must have a product ID.",
          },
          { status: 400 }
        );
      }
    }

    /*
    ========================================
    DUPLICATE PRODUCT CHECK
    ========================================
    */

    const productIds = items.map(
      (item) => item.productId
    );

    const uniqueProductIds =
      new Set(productIds);

    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The same product cannot be added twice.",
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    NORMALIZE MONEY VALUES
    ========================================
    */

    const deliveryCharge =
      Math.max(
        0,
        Number(
          body.deliveryCharge ?? 0
        ) || 0
      );

    const manualDiscount =
      Math.max(
        0,
        Number(
          body.manualDiscount ?? 0
        ) || 0
      );

    const paidAmount =
      Math.max(
        0,
        Number(
          body.paidAmount ?? 0
        ) || 0
      );

    /*
    ========================================
    NORMALIZE TEXT VALUES
    ========================================
    */

    const customerName =
      body.customerName.trim();

    const phone =
      body.phone.trim();

    const district =
      body.district?.trim() || null;

    const address =
      body.address?.trim() || null;

    const note =
      body.note?.trim() || null;

    const couponCode =
      body.couponCode?.trim() || null;

    const paymentMethod =
      body.paymentMethod?.trim() || null;

    const orderStatus =
      body.orderStatus?.trim() ||
      "Pending";

    /*
    ========================================
    CALL DATABASE FUNCTION
    ========================================

    IMPORTANT:

    Stock calculation and order item
    synchronization happen inside the
    PostgreSQL function.

    The database function is responsible for:

    - Restoring old stock
    - Validating new stock
    - Calculating subtotal
    - Applying discount
    - Applying coupon
    - Calculating delivery charge
    - Calculating paid amount
    - Calculating due amount
    - Updating order
    - Updating order_items
    - Updating product stock
    ========================================
    */

    const { data, error } =
      await supabaseAdmin.rpc(
        "update_admin_order_with_stock",
        {
          p_order_id: orderId,

          p_customer_name:
            customerName,

          p_phone:
            phone,

          p_district:
            district,

          p_address:
            address,

          p_note:
            note,

          p_delivery_charge:
            deliveryCharge,

          p_manual_discount:
            manualDiscount,

          p_coupon_code:
            couponCode,

          p_paid_amount:
            paidAmount,

          p_payment_method:
            paymentMethod,

          p_order_status:
            orderStatus,

          p_items:
            items,
        }
      );

    /*
    ========================================
    RPC ERROR
    ========================================
    */

    if (error) {
      console.error(
        "Update admin order RPC error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message ||
            "Failed to update order.",
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    RPC RETURN VALIDATION
    ========================================
    */

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      data.success === false
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "error" in data
              ? data.error
              : "Failed to update order.",
          result: data,
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      result: data,

      message:
        "Order updated successfully.",
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/orders/[orderId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update order.",
      },
      { status: 500 }
    );
  }
}