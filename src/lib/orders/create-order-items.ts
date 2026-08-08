import { supabaseAdmin } from "@/lib/supabase-admin";

import type {
  OrderItemInput,
} from "./types";

/*
==========================================
CREATE ORDER ITEMS
==========================================

Purpose

Insert every product belonging to
a master order.

This function DOES NOT

- Create master order
- Update stock
- Facebook
- Courier

==========================================
*/

export async function createOrderItems(
  orderId: string,
  items: OrderItemInput[]
): Promise<void> {
  if (items.length === 0) {
    throw new Error(
      "Order must contain at least one item."
    );
  }

  const rows = items.map(
    (item) => ({
      order_id: orderId,

      product_id: item.productId,

      product_name:
        item.productName,

      product_slug:
        item.productSlug,

      quantity:
        item.quantity,

      unit_price:
        item.unitPrice,

      line_total:
        item.lineTotal,
    })
  );

  const { error } =
    await supabaseAdmin
      .from("order_items")
      .insert(rows);

  if (error) {
    throw new Error(
      error.message
    );
  }
}