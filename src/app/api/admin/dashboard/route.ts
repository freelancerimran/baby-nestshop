import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/admin/orders",
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    const orders = data.orders || [];

    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
      (order: any) => order.status === "Pending"
    ).length;

    const totalRevenue = orders.reduce(
      (sum: number, order: any) =>
        sum + Number(order.total || 0),
      0
    );

    return NextResponse.json({
      success: true,
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalProducts: 5,
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