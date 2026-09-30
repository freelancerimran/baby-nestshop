export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";

import ProductGallery from "@/components/product/ProductGallery";
import ProductCheckout from "@/components/product/ProductCheckout";
import ProductDescription from "@/components/product/ProductDescription";
import SimilarProducts from "@/components/product/SimilarProducts";
import ViewContentPixel from "@/components/facebook/ViewContentPixel";

import { supabaseAdmin } from "@/lib/supabase-admin";

import type { CartVariant } from "@/types/cart";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({
  params,
}: Props) {
  const { slug } = await params;

  /*
  ============================================================
  PRODUCT
  ============================================================
  */

  const {
    data: product,
    error: productError,
  } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (
    productError ||
    !product
  ) {
    notFound();
  }

  /*
  ============================================================
  VARIANTS

  IMPORTANT:
  Customer product pages need to read active variants, but
  product_variants is protected from direct public access.

  This page is a SERVER COMPONENT, so we safely use the
  server-only Supabase admin client here.

  The service-role key never reaches the browser.
  Only the selected variant data is passed to ProductCheckout.
  ============================================================
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
      sort_order
    `
    )
    .eq(
      "product_id",
      product.product_id
    )
    .eq(
      "status",
      "Active"
    )
    .order(
      "sort_order",
      {
        ascending: true,
      }
    )
    .order(
      "id",
      {
        ascending: true,
      }
    );

  /*
  If the variant query fails, do not break the whole product
  page. Log the server-side error and keep the product page
  available with an empty variant list.
  */

  if (variantsError) {
    console.error(
      "PRODUCT VARIANTS FETCH ERROR:",
      variantsError
    );
  }

  /*
  ============================================================
  FORMAT VARIANTS
  ============================================================
  */

  const formattedVariants: CartVariant[] =
    (
      variantsData || []
    ).map(
      (variant) => ({
        id: Number(
          variant.id
        ),

        productId: Number(
          variant.product_id
        ),

        variantName:
          String(
            variant.variant_name ||
              ""
          ),

        sku:
          variant.sku
            ? String(
                variant.sku
              )
            : null,

        price:
          variant.price ==
          null
            ? null
            : Number(
                variant.price
              ),

        realStock:
          Number(
            variant.real_stock ||
              0
          ),

        displayStock:
          Number(
            variant.display_stock ||
              0
          ),

        image:
          variant.image ||
          null,

        status:
          String(
            variant.status ||
              ""
          ),

        sortOrder:
          Number(
            variant.sort_order ||
              0
          ),
      })
    );

  /*
  ============================================================
  FORMATTED PRODUCT
  ============================================================
  */

  const formattedProduct = {
    id: Number(
      product.product_id
    ),

    slug:
      product.slug,

    name:
      product.product_name,

    shortDescription:
      product.short_description ||
      "",

    description:
      product.description ||
      "",

    regularPrice:
      Number(
        product.regular_price ||
          0
      ),

    sellingPrice:
      Number(
        product.price ||
          0
      ),

    deliveryInsideDhaka:
      Number(
        product.delivery_inside_dhaka ||
          0
      ),

    deliveryOutsideDhaka:
      Number(
        product.delivery_outside_dhaka ||
          0
      ),

    image:
      product.image ||
      "",

    galleryImage1:
      product.gallery_image_1 ||
      "",

    galleryImage2:
      product.gallery_image_2 ||
      "",

    galleryImage3:
      product.gallery_image_3 ||
      "",

    galleryImage4:
      product.gallery_image_4 ||
      "",

    status:
      product.status,

    displayStock:
      Number(
        product.display_stock ||
          0
      ),

    /*
     * IMPORTANT:
     * Latest active variants are now passed directly
     * from the server-side database query.
     */
    variants:
      formattedVariants,
  };

  /*
  ============================================================
  PAGE
  ============================================================
  */

  return (
    <main className="min-h-screen bg-gray-50 py-10 text-gray-900">

      {/* ======================================================
          FACEBOOK VIEW CONTENT
      ====================================================== */}

      <ViewContentPixel
        productId={
          formattedProduct.id
        }
        productName={
          formattedProduct.name
        }
        price={
          formattedProduct.sellingPrice
        }
      />

      <Container>

        <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr]">

          {/* ==================================================
              PRODUCT GALLERY
          ================================================== */}

          <ProductGallery
            image={
              formattedProduct.image
            }

            galleryImage1={
              formattedProduct.galleryImage1
            }

            galleryImage2={
              formattedProduct.galleryImage2
            }

            galleryImage3={
              formattedProduct.galleryImage3
            }

            galleryImage4={
              formattedProduct.galleryImage4
            }

            name={
              formattedProduct.name
            }
          />

          {/* ==================================================
              PRODUCT CHECKOUT
          ================================================== */}

          <div className="space-y-3">

            <ProductCheckout
              product={
                formattedProduct
              }
            />

          </div>

        </div>

        {/* ====================================================
            PRODUCT DESCRIPTION
        ==================================================== */}

        <ProductDescription
          description={
            formattedProduct.description
          }
        />

        {/* ====================================================
            SIMILAR PRODUCTS
        ==================================================== */}

        <SimilarProducts
          currentSlug={
            formattedProduct.slug
          }
        />

      </Container>

    </main>
  );
}
