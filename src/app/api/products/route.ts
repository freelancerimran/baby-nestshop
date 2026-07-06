import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "Active")
      .order("product_id", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          products: [],
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const products = (data || []).map(
      (product) => ({
        productId: Number(
          product.product_id
        ),

        productName:
          product.product_name,

        realStock:
          Number(
            product.real_stock
          ),

        displayStock:
          Number(
            product.display_stock
          ),

        status:
          product.status,

        price:
          Number(product.price),

        slug:
          product.slug,

        description:
          product.description,

        image:
          product.image,
      })
    );

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        products: [],
      },
      {
        status: 500,
      }
    );
  }
}