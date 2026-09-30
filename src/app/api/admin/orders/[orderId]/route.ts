import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

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
    variantId?: number | null;
    variantName?: string | null;
    variantSku?: string | null;
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
    /*
    ========================================
    PERMISSION CHECK
    ========================================

    Viewing an individual order requires:

    orders.view
    ========================================
    */

    const allowed = await hasPermission(
      "orders",
      "view"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to view orders.",
        },
        { status: 403 }
      );
    }

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
      data: storedItems,
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
    NORMALIZE ITEMS
    ========================================

    New orders already have `order_items`.

    Older single-product orders may have NO
    `order_items` row and keep their product
    information directly on `orders`.

    Edit Order requires one common `items[]`
    structure, so we create a virtual legacy
    item here without changing the database.
    ========================================
    */

    let items = (storedItems ?? []).map((item) => ({
      ...item,
      product_id: String(
        item.product_id ?? ""
      ).trim(),
      product_name:
        item.product_name || "Product",
      quantity: Math.max(
        1,
        Number(item.quantity ?? 0)
      ),
      unit_price: Number(
        item.unit_price ?? 0
      ),
      line_total:
        Number(item.line_total ?? 0) ||
        Math.max(
          1,
          Number(item.quantity ?? 0)
        ) *
          Number(item.unit_price ?? 0),

      /*
      Variant fields are normalized to the
      camelCase shape expected by EditOrderForm.
      Legacy/non-variant items remain null.
      */
      variantId:
        item.variant_id != null
          ? Number(item.variant_id)
          : item.variantId != null
            ? Number(item.variantId)
            : null,

      variantName:
        item.variant_name ??
        item.variantName ??
        null,

      variantSku:
        item.variant_sku ??
        item.variantSku ??
        null,
    }));

    if (
      items.length === 0 &&
      order.product_id
    ) {
      const productId = String(
        order.product_id
      ).trim();

      const storedQuantity = Number(
        order.quantity ?? 0
      );

      const productPrice = Number(
        order.product_price ?? 0
      );

      const total = Number(
        order.total ??
          order.grand_total ??
          0
      );

      const deliveryCharge = Number(
        order.delivery_charge ?? 0
      );

      const discount = Number(
        order.discount ?? 0
      );

      let quantity =
        storedQuantity > 0
          ? Math.round(storedQuantity)
          : 0;

      /*
      Recover the quantity for old records
      where orders.quantity was saved as 0.
      */

      if (
        quantity <= 0 &&
        productPrice > 0
      ) {
        const derived =
          (total -
            deliveryCharge +
            discount) /
          productPrice;

        if (
          Number.isFinite(derived) &&
          derived > 0 &&
          Math.abs(
            derived -
              Math.round(derived)
          ) < 0.01
        ) {
          quantity =
            Math.round(derived);
        }
      }

      if (quantity <= 0) {
        quantity = 1;
      }

      items = [
        {
          id: undefined,
          order_id: orderId,
          product_id: productId,
          product_name:
            order.product_name ||
            "Product",
          quantity,
          unit_price:
            productPrice,
          line_total:
            productPrice *
            quantity,
        },
      ];
    }

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,
      order,
      items,
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
    /*
    ========================================
    EDIT PERMISSION CHECK
    ========================================

    Updating an order requires:

    orders.edit
    ========================================
    */

    const editAllowed = await hasPermission(
      "orders",
      "edit"
    );

    if (!editAllowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to edit orders.",
        },
        { status: 403 }
      );
    }

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
    ORDER SNAPSHOT FOR AUDIT
    ========================================
    */
    const { data: existingOrder, error: existingOrderError } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (existingOrderError) {
      console.error(
        "Order audit snapshot fetch error:",
        existingOrderError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            existingOrderError.message ||
            "Failed to fetch order.",
        },
        { status: 500 }
      );
    }

    if (!existingOrder) {
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
    ORDER STATUS PERMISSION
    ========================================

    Status changes are a separate permission.

    This means a user may have:

        orders.edit

    but still NOT be allowed to change:

        orders.update_status

    ========================================
    */

    const hasOrderStatus =
      typeof body.orderStatus === "string";

    if (hasOrderStatus) {
      const statusAllowed =
        await hasPermission(
          "orders",
          "update_status"
        );

      if (!statusAllowed) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You do not have permission to update order status.",
          },
          { status: 403 }
        );
      }
    }

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
          error:
            "Customer name is required.",
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
          error:
            "Phone number is required.",
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

      const hasVariantId =
        item.variantId !== undefined &&
        item.variantId !== null &&
        String(item.variantId).trim() !== "";

      const variantId =
        hasVariantId
          ? Number(item.variantId)
          : null;

      if (
        hasVariantId &&
        (variantId === null ||
          !Number.isInteger(variantId) ||
          variantId <= 0)
      ) {
        throw new Error(
          `Invalid variant ID for product ${productId}.`
        );
      }

      const variantName =
        item.variantName == null
          ? null
          : String(
              item.variantName
            ).trim() || null;

      const variantSku =
        item.variantSku == null
          ? null
          : String(
              item.variantSku
            ).trim() || null;

      return {
        productId,
        quantity,
        variantId,
        variantName,
        variantSku,
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

    const itemKeys = items.map(
      (item) =>
        `${item.productId}::${item.variantId ?? "product"}`
    );

    const uniqueItemKeys =
      new Set(itemKeys);

    if (
      uniqueItemKeys.size !==
      itemKeys.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The same product/variant cannot be added twice.",
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
    AUDIT LOG
    ========================================

    The database RPC has already completed the
    order update successfully.

    Audit captures the previous order snapshot
    plus the requested mutation payload/result.
    ========================================
    */

    const auditLogged = await writeAuditLog({
      request,
      action: "update",
      module: "orders",
      targetType: "order",
      targetId: orderId,
      description:
        `Updated admin order ${orderId}.`,
      metadata: {
        order_id: orderId,

        previous_order: {
          customer_name:
            existingOrder.customer_name ?? null,
          phone:
            existingOrder.phone ?? null,
          district:
            existingOrder.district ?? null,
          address:
            existingOrder.address ?? null,
          note:
            existingOrder.note ?? null,
          delivery_charge:
            existingOrder.delivery_charge ?? null,
          discount:
            existingOrder.discount ?? null,
          coupon_code:
            existingOrder.coupon_code ?? null,
          paid_amount:
            existingOrder.paid_amount ?? null,
          due_amount:
            existingOrder.due_amount ?? null,
          payment_method:
            existingOrder.payment_method ?? null,
          payment_status:
            existingOrder.payment_status ?? null,
          status:
            existingOrder.status ?? null,
          total:
            existingOrder.total ?? null,
          stock_restored:
            existingOrder.stock_restored ?? false,
        },

        requested_update: {
          customer_name: customerName,
          phone,
          district,
          address,
          note,
          delivery_charge: deliveryCharge,
          manual_discount: manualDiscount,
          coupon_code: couponCode,
          paid_amount: paidAmount,
          payment_method: paymentMethod,
          order_status: orderStatus,
          items,
        },

        status_changed:
          hasOrderStatus &&
          existingOrder.status !== orderStatus,

        payment_changed:
          Number(existingOrder.paid_amount ?? 0) !== paidAmount ||
          String(existingOrder.payment_method ?? "") !==
            String(paymentMethod ?? ""),

        result: data ?? null,
      },
    });

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      result: data,

      auditLogged,

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

/*
========================================
DELETE — PERMANENTLY DELETE ADMIN ORDER
========================================

Required permission:

orders.delete

IMPORTANT:

The actual permanent deletion + stock
restoration is handled atomically by:

permanent_delete_admin_order()

This API route is responsible for:

- Authentication / permission check
- Order ID validation
- Fetching order information for audit
- Calling the database RPC
- Mapping database errors
- Writing audit log
- Returning the result

The PostgreSQL function remains the
authoritative transaction boundary.
========================================
*/

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  try {
    /*
    ========================================
    1. PERMISSION CHECK
    ========================================

    Permanent order deletion requires:

    orders.delete
    ========================================
    */

    const allowed = await hasPermission(
      "orders",
      "delete"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to permanently delete orders.",
        },
        { status: 403 }
      );
    }

    /*
    ========================================
    2. GET ORDER ID
    ========================================
    */

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
    3. GET ORDER BEFORE DELETE
    ========================================

    We need this information for the audit log
    because the order itself will be deleted by
    the PostgreSQL function.
    ========================================
    */

    const {
      data: existingOrder,
      error: orderFetchError,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderFetchError) {
      console.error(
        "Permanent delete order fetch error:",
        orderFetchError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            orderFetchError.message ||
            "Failed to fetch order.",
        },
        { status: 500 }
      );
    }

    if (!existingOrder) {
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
    4. CALL DATABASE FUNCTION
    ========================================

    IMPORTANT:

    DO NOT manually restore stock here.

    The database function handles:

    - row locking
    - courier safety
    - finance safety
    - variant stock restoration
    - legacy product stock restoration
    - stock_restored protection
    - coupon usage restoration
    - order_items deletion
    - order deletion

    This keeps the operation atomic.
    ========================================
    */

    const {
      data,
      error,
    } = await supabaseAdmin.rpc(
      "permanent_delete_admin_order",
      {
        p_order_id: orderId,
      }
    );

    /*
    ========================================
    5. RPC ERROR
    ========================================
    */

    if (error) {
      console.error(
        "Permanent delete order RPC error:",
        error
      );

      const message =
        error.message ||
        "Failed to permanently delete order.";

      const lowerMessage =
        message.toLowerCase();

      /*
      ----------------------------------------
      ORDER NOT FOUND
      ----------------------------------------
      */

      if (
        lowerMessage.includes(
          "order not found"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Order not found.",
          },
          { status: 404 }
        );
      }

      /*
      ----------------------------------------
      COURIER SAFETY
      ----------------------------------------
      */

      if (
        lowerMessage.includes(
          "courier"
        ) ||
        lowerMessage.includes(
          "consignment"
        ) ||
        lowerMessage.includes(
          "tracking"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: message,
          },
          { status: 409 }
        );
      }

      /*
      ----------------------------------------
      FINANCE SAFETY
      ----------------------------------------
      */

      if (
        lowerMessage.includes(
          "finance"
        ) ||
        lowerMessage.includes(
          "financial"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: message,
          },
          { status: 409 }
        );
      }

      /*
      ----------------------------------------
      PRODUCT / VARIANT SAFETY
      ----------------------------------------
      */

      if (
        lowerMessage.includes(
          "product"
        ) ||
        lowerMessage.includes(
          "variant"
        ) ||
        lowerMessage.includes(
          "stock"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: message,
          },
          { status: 409 }
        );
      }

      /*
      ----------------------------------------
      GENERIC RPC ERROR
      ----------------------------------------
      */

      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    6. RPC RETURN VALIDATION
    ========================================
    */

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      data.success === false
    ) {
      const rpcError =
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : "Failed to permanently delete order.";

      const lowerError =
        rpcError.toLowerCase();

      if (
        lowerError.includes(
          "order not found"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Order not found.",
          },
          { status: 404 }
        );
      }

      if (
        lowerError.includes(
          "courier"
        ) ||
        lowerError.includes(
          "consignment"
        ) ||
        lowerError.includes(
          "tracking"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: rpcError,
            result: data,
          },
          { status: 409 }
        );
      }

      if (
        lowerError.includes(
          "finance"
        ) ||
        lowerError.includes(
          "financial"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: rpcError,
            result: data,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: rpcError,
          result: data,
        },
        { status: 400 }
      );
    }

    /*
    ========================================
    7. AUDIT LOG
    ========================================

    The order has already been permanently
    deleted successfully.

    Therefore the audit entry is written
    AFTER the successful RPC.

    If audit logging itself fails, the delete
    remains successful. The helper handles
    the audit error internally.
    ========================================
    */

    const auditLogged =
      await writeAuditLog({
        request,
        action:
          "permanent_delete",
        module: "orders",
        targetType: "order",
        targetId: orderId,
        description:
          `Permanently deleted order ${orderId}.`,
        metadata: {
          order_id: orderId,
          customer_name:
            existingOrder.customer_name ??
            null,
          status:
            existingOrder.status ??
            null,
          courier_status:
            existingOrder.courier_status ??
            null,
          consignment_id:
            existingOrder.consignment_id ??
            null,
          tracking_code:
            existingOrder.tracking_code ??
            null,
          stock_restored_before_delete:
            existingOrder.stock_restored ??
            false,
          finance_processed:
            existingOrder.finance_processed ??
            false,
          total:
            existingOrder.total ??
            null,
          rpc_result: data ?? null,
        },
      });

    /*
    ========================================
    8. SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,

      result: data,

      auditLogged,

      message:
        "Order permanently deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/orders/[orderId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to permanently delete order.",
      },
      { status: 500 }
    );
  }
}