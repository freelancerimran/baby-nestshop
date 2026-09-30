import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    /*
     * ========================================
     * PERMISSION CHECK
     * ========================================
     */

    const allowed = await hasPermission(
      "inventory",
      "view"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to view inventory.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ========================================
     * GET PRODUCTS
     * ========================================
     *
     * Existing product data/fields are preserved.
     * No existing stock formula is changed.
     */

    const {
      data: productsData,
      error: productsError,
    } = await supabase
      .from("products")
      .select("*")
      .order("id", {
        ascending: true,
      });

    if (productsError) {
      console.error(
        "INVENTORY PRODUCTS ERROR:",
        productsError
      );

      return NextResponse.json(
        {
          success: false,
          error: productsError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ========================================
     * GET PRODUCT VARIANTS
     * ========================================
     *
     * Variants are read server-side using the
     * service-role client.
     *
     * The service-role key is NEVER exposed
     * to the browser.
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
      });

    if (variantsError) {
      console.error(
        "INVENTORY VARIANTS ERROR:",
        variantsError
      );

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
     * ========================================
     * GROUP VARIANTS BY PRODUCT
     * ========================================
     */

    const variantsByProduct = new Map<
      string,
      NonNullable<typeof variantsData>
    >();

    for (const variant of variantsData || []) {
      const existingVariants =
        variantsByProduct.get(
          variant.product_id
        ) || [];

      existingVariants.push(variant);

      variantsByProduct.set(
        variant.product_id,
        existingVariants
      );
    }

    /*
     * ========================================
     * FORMAT PRODUCTS
     * ========================================
     *
     * Existing parent stock values are kept
     * exactly as they currently exist.
     *
     * We are NOT changing any stock formula.
     */

    const products = (productsData || []).map(
      (product) => {
        const variants =
          variantsByProduct.get(
            product.product_id
          ) || [];

        return {
          productId:
            product.product_id,

          productName:
            product.product_name,

          /*
           * Existing stock fields.
           * DO NOT change the formula here.
           */
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

          /*
           * ========================================
           * VARIANT INFORMATION
           * ========================================
           */

          hasVariants:
            variants.length > 0,

          variants:
            variants.map(
              (variant) => ({
                id:
                  variant.id,

                productId:
                  variant.product_id,

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
     * ========================================
     * SUCCESS
     * ========================================
     */

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "INVENTORY GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}