import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } =
      await supabaseAdmin
        .from("orders")
        .select(
          "product_name, quantity"
        );

    if (error) throw error;

    const summary: Record<
      string,
      number
    > = {};

    (data || []).forEach((item) => {
      const product =
        item.product_name?.trim() ||
        "Unknown Product";

      summary[product] =
        (summary[product] || 0) +
        Number(item.quantity || 0);
    });

    const products =
      Object.entries(summary)
        .map(([name, qty]) => ({
          name,
          qty,
        }))
        .filter(
          (item) => item.qty > 0
        )
        .sort(
          (a, b) => b.qty - a.qty
        );

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(
      "Product Summary Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
      },
      {
        status: 500,
      }
    );
  }
}