import { supabaseAdmin } from "@/lib/supabase-admin";

import type {
  CreateMasterOrderInput,
  MasterOrderResult,
} from "./types";

/*
==========================================
CREATE MASTER ORDER
==========================================

Purpose:

Create ONLY the master order.

This function DOES NOT:

- Insert order_items
- Update stock
- Send Facebook events
- Send courier request

Those are handled separately.

==========================================
*/

export async function createMasterOrder(
  input: CreateMasterOrderInput
): Promise<MasterOrderResult> {
  const {
    orderId,
    customer,
    pricing,
    items,
  } = input;

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("orders")
    .insert({
      /*
      ======================================
      ORDER
      ======================================
      */

      order_id: orderId,

      order_date: now,

      created_at: now,

      updated_at: now,

      order_type: "quick",

      /*
      ======================================
      CUSTOMER
      ======================================
      */

      customer_name:
        customer.customerName,

      phone: customer.phone,

      district:
        customer.district,

      delivery_area:
        customer.deliveryArea,

      address:
        customer.address,

      /*
      ======================================
      PRICING
      ======================================
      */

      subtotal:
        pricing.subtotal,

      delivery_charge:
        pricing.deliveryCharge,

      discount:
        pricing.discount,

      grand_total:
        pricing.grandTotal,

      total:
        pricing.grandTotal,

      coupon_code:
        pricing.couponCode ?? null,

      /*
      ======================================
      LEGACY COMPATIBILITY
      ======================================
      */

      product_id: "MULTIPLE",

      product_name:
        "Multiple Products",

      product_slug:
        "multiple-products",

      quantity: totalItems,

      product_price:
        pricing.subtotal,

      /*
      ======================================
      PAYMENT
      ======================================
      */

      paid_amount: 0,

      due_amount:
        pricing.grandTotal,

      payment_status:
        "Unpaid",

      /*
      ======================================
      ORDER STATUS
      ======================================
      */

      status: "Pending",

      fulfillment_status:
        "received",

      courier_status: "",

      tracking_code: "",

      consignment_id: "",

      finance_processed: false,

      stock_restored: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,

    orderId,

    createdAt: now,
  };
}