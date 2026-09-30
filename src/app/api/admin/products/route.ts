import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    /*
    ========================================
    PERMISSION CHECK
    ========================================
    */

    const allowed = await hasPermission(
      "products",
      "view"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to view products.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    GET PRODUCTS
    ========================================
    */

    const { data, error } = await supabaseAdmin
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
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    GET PRODUCT VARIANTS
    ========================================
    */

    const {
      data: variantsData,
      error: variantsError,
    } = await supabaseAdmin
      .from("product_variants")
      .select(
        `
          id,
          product_id,
          variant_name,
          sku,
          price,
          real_stock,
          display_stock,
          image,
          status,
          sort_order,
          created_at,
          updated_at
        `
      )
      .order("sort_order", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      });

    if (variantsError) {
      return NextResponse.json(
        {
          success: false,
          error: variantsError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    GROUP VARIANTS BY PRODUCT
    ========================================
    */

    const variantsByProduct = new Map<
      string,
      typeof variantsData
    >();

    for (const variant of variantsData || []) {
      const existing =
        variantsByProduct.get(
          String(variant.product_id)
        ) || [];

      existing.push(variant);

      variantsByProduct.set(
        String(variant.product_id),
        existing
      );
    }

    /*
    ========================================
    FORMAT PRODUCTS
    ========================================
    */

    const products = (data || []).map(
      (product) => {
        const variants =
          variantsByProduct.get(
            String(product.product_id)
          ) || [];

        return {
          productId:
            product.product_id,

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

          hasVariants:
            variants.length > 0,

          variants:
            variants.map(
              (variant) => ({
                id:
                  variant.id,

                productId:
                  String(
                    variant.product_id
                  ),

                variantName:
                  variant.variant_name,

                sku:
                  variant.sku,

                price:
                  variant.price,

                realStock:
                  variant.real_stock,

                displayStock:
                  variant.display_stock,

                image:
                  variant.image || null,

                status:
                  variant.status,

                sortOrder:
                  variant.sort_order,

                createdAt:
                  variant.created_at,

                updatedAt:
                  variant.updated_at,
              })
            ),
        };
      }
    );

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json({
      success: true,
      products,
    });

  } catch (error) {
    console.error(
      "PRODUCTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}