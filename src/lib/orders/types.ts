/*
==========================================
ORDER TYPES
==========================================

Shared types used by:

- Quick Order
- Single Order
- Admin
- Finance
- Fulfillment
- Courier
- Future Invoice System

==========================================
*/

export interface OrderItemInput {
  productId: string;

  productName: string;

  productSlug: string;

  quantity: number;

  unitPrice: number;

  lineTotal: number;
}

export interface CustomerInfo {
  customerName: string;

  phone: string;

  district: string;

  deliveryArea: string;

  address: string;

  note?: string;
}

export interface OrderPricing {
  subtotal: number;

  deliveryCharge: number;

  discount: number;

  grandTotal: number;

  couponCode?: string | null;
}

export interface CreateMasterOrderInput {
  orderId: string;

  customer: CustomerInfo;

  pricing: OrderPricing;

  items: OrderItemInput[];
}

export interface MasterOrderResult {
  success: boolean;

  orderId: string;

  createdAt: string;
}