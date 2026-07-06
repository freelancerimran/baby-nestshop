import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("SUPABASE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          orders: [],
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const orders = (data || []).map((order) => ({
      orderId: order.order_id,
      date: order.order_date,

      productId: order.product_id,
      productName: order.product_name,
      productSlug: order.product_slug,

customerName: order.customer_name,
phone: order.phone,

district: order.district,
deliveryArea: order.delivery_area,

address: order.address,

      deliveryCharge: Number(
        order.delivery_charge || 0
      ),

      discount: Number(
        order.discount || 0
      ),

      couponCode: order.coupon_code,

      quantity: order.quantity,

      productPrice: Number(
        order.product_price || 0
      ),

      total: Number(order.total || 0),

      status: order.status,

      trackingCode: order.tracking_code,

      consignmentId: order.consignment_id,

      courierStatus: order.courier_status, 

      lastStatusSync: order.last_status_sync,

      paymentStatus: order.payment_status,
    }));

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error(
      "ORDERS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        orders: [],
        error:
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