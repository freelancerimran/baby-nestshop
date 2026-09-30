import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import {
  writeAuditLog,
} from "@/lib/audit";

export async function DELETE(req: NextRequest) {
  try {
    /*
     * ========================================
     * DELETE PRODUCT PERMISSION
     * ========================================
     */

    const canDeleteProduct = await hasPermission(
      "products",
      "delete"
    );

    if (!canDeleteProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to delete products.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ========================================
     * GET PRODUCT ID
     * ========================================
     */

    const body = await req.json();

    const productId = body?.productId?.toString().trim();

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================
     * CHECK PRODUCT EXISTS
     * ========================================
     */

    const {
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select("product_id, product_name")
      .eq("product_id", productId)
      .maybeSingle();

    if (productError) {
      console.error(
        "DELETE PRODUCT FETCH ERROR:",
        productError
      );

      return NextResponse.json(
        {
          success: false,
          message: productError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ========================================
     * CHECK ORDER ITEMS
     * ========================================
     *
     * We must preserve historical order data.
     *
     * If this product has already been used
     * in an order, hard deletion is blocked.
     */

    const {
      count: orderItemsCount,
      error: orderItemsError,
    } = await supabaseAdmin
      .from("order_items")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("product_id", productId);

    if (orderItemsError) {
      console.error(
        "DELETE PRODUCT ORDER ITEMS CHECK ERROR:",
        orderItemsError
      );

      return NextResponse.json(
        {
          success: false,
          message: orderItemsError.message,
        },
        {
          status: 500,
        }
      );
    }

    if ((orderItemsCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This product cannot be deleted because it is already used in order history.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ========================================
     * CHECK ORDERS
     * ========================================
     *
     * Additional protection in case an order
     * exists without a corresponding order_item.
     */

    const {
      count: ordersCount,
      error: ordersError,
    } = await supabaseAdmin
      .from("orders")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("product_id", productId);

    if (ordersError) {
      console.error(
        "DELETE PRODUCT ORDERS CHECK ERROR:",
        ordersError
      );

      return NextResponse.json(
        {
          success: false,
          message: ordersError.message,
        },
        {
          status: 500,
        }
      );
    }

    if ((ordersCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This product cannot be deleted because it is already used in order history.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ========================================
     * DELETE PRODUCT
     * ========================================
     *
     * product_variants use ON DELETE CASCADE,
     * so variants belonging to this product
     * will be removed with the product.
     */

    const { error: deleteError } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      console.error(
        "DELETE PRODUCT DATABASE ERROR:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message: deleteError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ========================================
     * AUDIT LOG
     * ========================================
     *
     * The product has been deleted successfully.
     * Write an audit record after the mutation.
     *
     * Audit logging is best-effort here:
     * a failure to write the audit record must
     * not make a successful product deletion
     * appear to have failed.
     */

    const auditLogged = await writeAuditLog({
      request: req,
      action: "delete",
      module: "products",
      targetType: "product",
      targetId: productId,
      description: `Product "${product.product_name}" was permanently deleted.`,
      metadata: {
        product_id: productId,
        product_name: product.product_name,
        order_items_count: orderItemsCount || 0,
        orders_count: ordersCount || 0,
        deleted_at: new Date().toISOString(),
      },
    });

    /*
     * ========================================
     * SUCCESS
     * ========================================
     */

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
      productId,
      productName: product.product_name,
      auditLogged,
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}