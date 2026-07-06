import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Orders
    const { data: orders, error: ordersError } =
      await supabase
        .from("orders")
        .select("*");

    if (ordersError) {
      throw ordersError;
    }

    // Products
    const { data: products, error: productsError } =
      await supabase
        .from("products")
        .select("*");

    if (productsError) {
      throw productsError;
    }

    const totalOrders = orders?.length || 0;

    const pendingOrders =
      orders?.filter(
        (order) =>
          order.status?.toLowerCase() ===
          "pending"
      ).length || 0;

    const deliveredOrders =
      orders?.filter(
        (order) =>
          order.status?.toLowerCase() ===
          "delivered"
      ).length || 0;

    const totalRevenue =
      orders?.reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      ) || 0;

    const totalProducts =
      products?.length || 0;

    const lowStockProducts =
      products?.filter(
        (product) =>
          Number(product.real_stock) <= 5
      ).length || 0;

    return NextResponse.json({
      success: true,

      totalOrders,

      pendingOrders,

      deliveredOrders,

      totalRevenue,

      totalProducts,

      lowStockProducts,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}