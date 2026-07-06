import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const products = (data || []).map(
      (product) => ({
    productId: product.product_id,

    productName:
      product.product_name,

    realStock:
      product.real_stock,

    displayStock:
      product.display_stock,

    status:
      product.status,

    price:
      product.price,

    regularPrice:
      product.regular_price || 0,

    slug:
      product.slug,

    description:
      product.description,

    image:
      product.image || "",

    galleryImage1:
      product.gallery_image_1 || "",

    galleryImage2:
      product.gallery_image_2 || "",

    galleryImage3:
      product.gallery_image_3 || "",

    galleryImage4:
      product.gallery_image_4 || "",
      featured:
  product.featured || false,

bestSeller:
  product.best_seller || false,

newArrival:
  product.new_arrival || false,
      
      })
    );

    return NextResponse.json({
      success: true,
      products,
    });

  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}