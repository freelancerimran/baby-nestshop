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

        regular_price:
          body.regularPrice,

        slug:
          body.slug,

        description:
          body.description,

        image:
          body.image,
          gallery_image_1:
  body.galleryImage1,

gallery_image_2:
  body.galleryImage2,

gallery_image_3:
  body.galleryImage3,

gallery_image_4:
  body.galleryImage4,

featured:
  body.featured || false,

best_seller:
  body.bestSeller || false,

new_arrival:
  body.newArrival || false,
  
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