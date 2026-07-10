import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    // ====================================
    // Get Queue Item
    // ====================================

    const {
      data: queueItem,
      error: queueError,
    } = await supabaseAdmin
      .from("fulfillment_queue")
      .select("*")
      .eq("id", id)
      .single();

    if (queueError || !queueItem) {
      throw new Error(
        "Queue item not found"
      );
    }

    // ====================================
    // Find Product
    // ====================================

    const {
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq(
        "product_name",
        queueItem.product_name
      )
      .single();

    // ====================================
    // Stock Deduction
    // ====================================

    if (product && !productError) {
      const currentStock =
        Number(
          product.real_stock || 0
        );

      const qty =
        Number(
          queueItem.quantity || 0
        );

      const newStock =
        Math.max(
          currentStock - qty,
          0
        );

      await supabaseAdmin
        .from("products")
        .update({
          real_stock: newStock,
        })
        .eq("id", product.id);

      console.log(
        `Stock Updated: ${product.product_name}`
      );

      console.log(
        `Old Stock: ${currentStock}`
      );

      console.log(
        `Qty: ${qty}`
      );

      console.log(
        `New Stock: ${newStock}`
      );
    }

    // ====================================
    // Mark Delivered
    // ====================================

    const { data, error } =
      await supabaseAdmin
        .from("fulfillment_queue")
        .update({
          fulfillment_status:
            "delivered",
          delivered_at:
            new Date().toISOString(),
        })
        .eq("id", id)
        .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "DELIVERED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Delivered Update Failed",
      },
      {
        status: 500,
      }
    );
  }
}