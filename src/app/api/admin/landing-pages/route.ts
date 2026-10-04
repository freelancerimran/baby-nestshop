import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";

/*
============================================================
CONFIG
============================================================
*/

const DEFAULT_BUCKET =
  "landing-page-images";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/*
============================================================
HELPERS
============================================================
*/

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function nullableText(
  value: unknown
): string | null {
  const text =
    cleanText(value);

  return text || null;
}

function numberOrNull(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function nonNegativeNumber(
  value: unknown
): number {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return 0;
  }

  return number;
}

function normalizeDeliveryMode(
  value: unknown
): "free" | "paid" {
  return cleanText(value) ===
    "paid"
    ? "paid"
    : "free";
}

function stringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      cleanText(item)
    )
    .filter(Boolean);
}

function slugify(
  value: string
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}

function normalizeSlug(
  value: unknown,
  fallback: string
): string {
  const custom =
    slugify(
      cleanText(value)
    );

  return (
    custom ||
    slugify(fallback) ||
    `landing-${Date.now()}`
  );
}

function extensionForType(
  type: string
): string {
  switch (type) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/gif":
      return "gif";

    default:
      return "jpg";
  }
}

/*
============================================================
GET ALL LANDING PAGES
============================================================
*/

export async function GET() {
  try {
    const allowed =
      await hasPermission(
        "products",
        "view"
      );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to view landing pages.",
        },
        { status: 403 }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "LANDING PAGES GET ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      landingPages:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "LANDING PAGES GET UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load landing pages.",
      },
      { status: 500 }
    );
  }
}

/*
============================================================
POST
============================================================

Supports:

1. application/json
   -> Create landing page

2. multipart/form-data
   -> Upload landing page image
============================================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    const allowed =
      await hasPermission(
        "products",
        "view"
      );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to manage landing pages.",
        },
        { status: 403 }
      );
    }

    const contentType =
      request.headers.get(
        "content-type"
      ) || "";

    /*
    ========================================================
    IMAGE UPLOAD
    ========================================================
    */

    if (
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      const formData =
        await request.formData();

      const file =
        formData.get("file");

      if (
        !(file instanceof File)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Image file is required.",
          },
          { status: 400 }
        );
      }

      if (
        !ALLOWED_TYPES.has(
          file.type
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only JPG, PNG, WebP, and GIF images are allowed.",
          },
          { status: 400 }
        );
      }

      if (
        file.size <= 0 ||
        file.size >
          MAX_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Image size must be between 1 byte and 10 MB.",
          },
          { status: 400 }
        );
      }

      const bucket =
        process.env
          .SUPABASE_LANDING_PAGE_IMAGE_BUCKET
          ?.trim() ||
        DEFAULT_BUCKET;

      const {
        data: buckets,
        error: bucketListError,
      } =
        await supabaseAdmin.storage
          .listBuckets();

      if (bucketListError) {
        console.error(
          "LANDING IMAGE BUCKET LIST ERROR:",
          bucketListError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to access image storage.",
          },
          { status: 500 }
        );
      }

      const bucketExists =
        (buckets || []).some(
          (item) =>
            item.name ===
            bucket
        );

      if (!bucketExists) {
        const {
          error:
            createBucketError,
        } =
          await supabaseAdmin.storage.createBucket(
            bucket,
            {
              public: true,
              fileSizeLimit:
                `${MAX_FILE_SIZE}`,
              allowedMimeTypes:
                Array.from(
                  ALLOWED_TYPES
                ),
            }
          );

        if (
          createBucketError
        ) {
          console.error(
            "LANDING IMAGE BUCKET CREATE ERROR:",
            createBucketError
          );

          return NextResponse.json(
            {
              success: false,
              error:
                "Unable to initialize image storage.",
            },
            { status: 500 }
          );
        }
      } else {
        const {
          error:
            updateBucketError,
        } =
          await supabaseAdmin.storage.updateBucket(
            bucket,
            {
              public: true,
              fileSizeLimit:
                `${MAX_FILE_SIZE}`,
              allowedMimeTypes:
                Array.from(
                  ALLOWED_TYPES
                ),
            }
          );

        if (
          updateBucketError
        ) {
          console.error(
            "LANDING IMAGE BUCKET UPDATE ERROR:",
            updateBucketError
          );

          return NextResponse.json(
            {
              success: false,
              error:
                "Unable to configure image storage.",
            },
            { status: 500 }
          );
        }
      }

      const fileName =
        `${crypto.randomUUID()}.${extensionForType(
          file.type
        )}`;

      const storagePath =
        `landing-pages/${fileName}`;

      const bytes =
        await file.arrayBuffer();

      const buffer =
        Buffer.from(bytes);

      const {
        error: uploadError,
      } =
        await supabaseAdmin.storage
          .from(bucket)
          .upload(
            storagePath,
            buffer,
            {
              contentType:
                file.type,
              cacheControl:
                "31536000",
              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          "LANDING IMAGE UPLOAD ERROR:",
          uploadError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to upload image.",
          },
          { status: 500 }
        );
      }

      const {
        data: publicUrlData,
      } =
        supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(
            storagePath
          );

      if (
        !publicUrlData?.publicUrl
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Image uploaded but its public URL could not be generated.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        url:
          publicUrlData.publicUrl,
        path: storagePath,
      });
    }

    /*
    ========================================================
    CREATE LANDING PAGE
    ========================================================
    */

    const body =
      await request.json();

    const isManual =
      Boolean(
        body.isManual
      );

    let productId =
      nullableText(
        body.productId
      );

    let pageTitle =
      nullableText(
        body.pageTitle
      );

    let shortDescription =
      nullableText(
        body.shortDescription
      );

    let description =
      nullableText(
        body.description
      );

    let regularPrice =
      numberOrNull(
        body.regularPrice
      );

    let offerPrice =
      numberOrNull(
        body.offerPrice
      );

    let images =
      stringArray(
        body.images
      );

    let variants =
      Array.isArray(
        body.variants
      )
        ? body.variants
        : [];

    /*
    ========================================================
    DELIVERY
    ========================================================
    */

    const deliveryMode =
      normalizeDeliveryMode(
        body.deliveryMode
      );

    const deliveryInsideDhaka =
      deliveryMode === "paid"
        ? nonNegativeNumber(
            body.deliveryInsideDhaka
          )
        : 0;

    const deliveryOutsideDhaka =
      deliveryMode === "paid"
        ? nonNegativeNumber(
            body.deliveryOutsideDhaka
          )
        : 0;

    /*
    ========================================================
    PRODUCT-BASED LANDING PAGE
    ========================================================
    */

    if (!isManual) {
      if (!productId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Product ID is required.",
          },
          { status: 400 }
        );
      }

      const {
        data: product,
        error:
          productError,
      } =
        await supabaseAdmin
          .from("products")
          .select(
            `
            product_id,
            product_name,
            slug,
            price,
            regular_price,
            description,
            image,
            gallery_image_1,
            gallery_image_2,
            gallery_image_3,
            gallery_image_4
          `
          )
          .eq(
            "product_id",
            productId
          )
          .maybeSingle();

      if (
        productError ||
        !product
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              productError?.message ||
              "Product not found.",
          },
          { status: 404 }
        );
      }

      const {
        data:
          productVariants,
        error:
          variantsError,
      } =
        await supabaseAdmin
          .from(
            "product_variants"
          )
          .select(
            `
            id,
            product_id,
            variant_name,
            sku,
            price,
            image,
            status,
            sort_order
          `
          )
          .eq(
            "product_id",
            productId
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

      if (variantsError) {
        return NextResponse.json(
          {
            success: false,
            error:
              variantsError.message,
          },
          { status: 500 }
        );
      }

      pageTitle =
        pageTitle ||
        product.product_name;

      shortDescription =
        shortDescription ||
        product.description ||
        null;

      description =
        description ||
        product.description ||
        null;

      regularPrice =
        regularPrice ??
        Number(
          product.regular_price ??
            product.price ??
            0
        );

      offerPrice =
        offerPrice ??
        Number(
          product.price ?? 0
        );

      if (
        images.length ===
        0
      ) {
        images = [
          product.image,
          product.gallery_image_1,
          product.gallery_image_2,
          product.gallery_image_3,
          product.gallery_image_4,
        ].filter(
          (
            image
          ): image is string =>
            Boolean(
              image &&
                String(
                  image
                ).trim()
            )
        );
      }

      if (
        variants.length ===
        0
      ) {
        variants =
          (
            productVariants ||
            []
          ).map(
            (variant) => ({
              id: Number(
                variant.id
              ),
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
              image:
                variant.image,
              status:
                variant.status,
              sortOrder:
                variant.sort_order,
            })
          );
      }
    } else {
      /*
      MANUAL LANDING PAGE
      */

      productId = null;

      if (!pageTitle) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Page title is required for manual landing pages.",
          },
          { status: 400 }
        );
      }
    }

    /*
    ========================================================
    SLUG
    ========================================================
    */

    const slug =
      normalizeSlug(
        body.slug,
        pageTitle ||
          `landing-${Date.now()}`
      );

    /*
    ========================================================
    DUPLICATE SLUG
    ========================================================
    */

    const {
      data: existingSlug,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .select("id")
        .eq(
          "slug",
          slug
        )
        .maybeSingle();

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This landing page slug already exists.",
        },
        { status: 409 }
      );
    }

    /*
    ========================================================
    STATUS
    ========================================================
    */

    const status =
      cleanText(
        body.status
      ) === "published"
        ? "published"
        : "draft";

    /*
    ========================================================
    CREATE DATABASE RECORD
    ========================================================
    */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .insert({
          product_id:
            productId,

          is_manual:
            isManual,

          slug,

          status,

          page_title:
            pageTitle,

          short_description:
            shortDescription,

          description,

          regular_price:
            regularPrice,

          offer_price:
            offerPrice,

          images,

          variants,

          benefits:
            stringArray(
              body.benefits
            ),

          features:
            stringArray(
              body.features
            ),

          reviews:
            Array.isArray(
              body.reviews
            )
              ? body.reviews
              : [],

          facebook_pixel_id:
            null,

          /*
          ======================================================
          DELIVERY
          ======================================================
          */

          delivery_mode:
            deliveryMode,

          delivery_inside_dhaka:
            deliveryInsideDhaka,

          delivery_outside_dhaka:
            deliveryOutsideDhaka,

          published_at:
            status ===
            "published"
              ? new Date().toISOString()
              : null,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "LANDING PAGE CREATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        landingPage:
          data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "LANDING PAGES POST UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process landing page request.",
      },
      { status: 500 }
    );
  }
}