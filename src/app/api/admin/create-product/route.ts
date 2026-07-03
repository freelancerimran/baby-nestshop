import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest
) {
  try {

    const body = await req.json();

    // Next Product ID

    const { data: lastProduct } =
      await supabase
        .from("products")
        .select("product_id")
        .order("id", {
          ascending: false,
        })
        .limit(1)
        .single();

    const nextProductId =
      String(
        Number(
          lastProduct?.product_id || 0
        ) + 1
      );

    const { error } =
      await supabase
        .from("products")
        .insert([
          {
            product_id:
              nextProductId,

            product_name:
              body.productName,

            real_stock:
              body.realStock,

            display_stock:
              body.displayStock,

            status:
              body.status,

            price:
              body.price,

            slug:
              body.slug,

            description:
              body.description,

            image:
              body.image,
          },
        ]);

    if (error) {

      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Product Created",
    });

  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message:
          String(error),
      },
      { status: 500 }
    );
  }
}