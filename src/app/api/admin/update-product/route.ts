import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest
) {
  try {

    const body = await req.json();

    const { error } = await supabase
      .from("products")
      .update({
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
      })
      .eq(
        "product_id",
        body.productId
      );

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
        "Product Updated",
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