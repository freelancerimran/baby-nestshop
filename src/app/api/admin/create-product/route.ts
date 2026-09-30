import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

interface VariantInput {
  variantName?: unknown;
  sku?: unknown;
  price?: unknown;
  realStock?: unknown;
  displayStock?: unknown;
  image?: unknown;
  status?: unknown;
  sortOrder?: unknown;
}

function normalizeString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeNonNegativeInteger(
  value: unknown,
  fallback = 0
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const numberValue =
    Number(value);

  if (
    !Number.isInteger(
      numberValue
    ) ||
    numberValue < 0
  ) {
    throw new Error(
      "Stock and sort order must be non-negative integers."
    );
  }

  return numberValue;
}

function normalizePrice(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numberValue =
    Number(value);

  if (
    !Number.isFinite(
      numberValue
    ) ||
    numberValue < 0
  ) {
    throw new Error(
      "Price must be a valid non-negative number."
    );
  }

  return numberValue;
}

export async function POST(
  req: NextRequest
) {
  try {
    /*
    ========================================
    PRODUCT CREATE PERMISSION
    ========================================
    */

    const canCreateProduct =
      await hasPermission(
        "products",
        "create"
      );

    if (!canCreateProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to create products.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    ========================================
    REQUEST BODY
    ========================================
    */

    const body =
      await req.json();

    if (
      !body ||
      typeof body !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    BASIC PRODUCT VALIDATION
    ========================================
    */

    const productName =
      normalizeString(
        body.productName
      );

    if (!productName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const slug =
      normalizeString(
        body.slug
      );

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    const price =
      Number(body.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product price must be a valid non-negative number.",
        },
        {
          status: 400,
        }
      );
    }

    const regularPrice =
      Number(
        body.regularPrice
      );

    if (
      !Number.isFinite(
        regularPrice
      ) ||
      regularPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Regular price must be a valid non-negative number.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    ========================================
    VARIANTS
    ========================================
    */

    const rawVariants =
      Array.isArray(
        body.variants
      )
        ? (body.variants as VariantInput[])
        : [];

    /*
    ========================================
    VARIANT PERMISSION
    ========================================
    */

    if (
      rawVariants.length >
      0
    ) {
      const canManageVariants =
        await hasPermission(
          "products",
          "manage_variants"
        );

      if (!canManageVariants) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You do not have permission to create product variants.",
          },
          {
            status: 403,
          }
        );
      }
    }

    /*
    ========================================
    STOCK PERMISSION
    ========================================
    */

    const canManageStock =
      await hasPermission(
        "products",
        "manage_stock"
      );

    /*
    ========================================
    VALIDATE VARIANTS
    ========================================
    */

    const variants =
      rawVariants.map(
        (
          variant,
          index
        ) => {
          const variantName =
            normalizeString(
              variant.variantName
            );

          if (!variantName) {
            throw new Error(
              `Variant ${
                index + 1
              }: Variant name is required.`
            );
          }

          const sku =
            normalizeString(
              variant.sku
            ).toUpperCase();

          const variantPrice =
            normalizePrice(
              variant.price
            );

          const realStock =
            normalizeNonNegativeInteger(
              variant.realStock
            );

          const displayStock =
            normalizeNonNegativeInteger(
              variant.displayStock
            );

          const sortOrder =
            normalizeNonNegativeInteger(
              variant.sortOrder,
              index + 1
            );

          const image =
            normalizeString(
              variant.image
            );

          const status =
            variant.status ===
            "Inactive"
              ? "Inactive"
              : "Active";

          return {
            variantName,
            sku: sku || null,
            price:
              variantPrice,
            realStock,
            displayStock,
            image:
              image || null,
            status,
            sortOrder,
          };
        }
      );

    /*
    ========================================
    DUPLICATE SKU INSIDE REQUEST
    ========================================
    */

    const skuSet =
      new Set<string>();

    for (
      const variant of variants
    ) {
      if (!variant.sku) {
        continue;
      }

      if (
        skuSet.has(
          variant.sku
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Duplicate variant SKU: ${variant.sku}`,
          },
          {
            status: 409,
          }
        );
      }

      skuSet.add(
        variant.sku
      );
    }

    /*
    ========================================
    CHECK EXISTING SKU
    ========================================
    */

    if (
      skuSet.size > 0
    ) {
      const {
        data: existingVariants,
        error:
          existingSkuError,
      } =
        await supabaseAdmin
          .from(
            "product_variants"
          )
          .select(
            "sku"
          )
          .in(
            "sku",
            Array.from(
              skuSet
            )
          );

      if (
        existingSkuError
      ) {
        console.error(
          "CHECK EXISTING VARIANT SKU ERROR:",
          existingSkuError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              existingSkuError.message,
          },
          {
            status: 500,
          }
        );
      }

      if (
        existingVariants &&
        existingVariants.length >
          0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `SKU already exists: ${existingVariants[0].sku}`,
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
    ========================================
    STOCK VALIDATION
    ========================================
    */

    if (
      !canManageStock
    ) {
      if (
        variants.some(
          (variant) =>
            variant.realStock !==
              0 ||
            variant.displayStock !==
              0
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You do not have permission to manage product stock.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        rawVariants.length ===
          0 &&
        (
          Number(
            body.realStock
          ) !== 0 ||
          Number(
            body.displayStock
          ) !== 0
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You do not have permission to manage product stock.",
          },
          {
            status: 403,
          }
        );
      }
    }

    /*
    ========================================
    FINAL PRODUCT STOCK
    ========================================
    */

    const finalRealStock =
      variants.length >
      0
        ? variants.reduce(
            (
              total,
              variant
            ) =>
              total +
              variant.realStock,
            0
          )
        : normalizeNonNegativeInteger(
            body.realStock
          );

    const finalDisplayStock =
      variants.length >
      0
        ? variants.reduce(
            (
              total,
              variant
            ) =>
              total +
              variant.displayStock,
            0
          )
        : normalizeNonNegativeInteger(
            body.displayStock
          );

    /*
    ========================================
    GET NEXT PRODUCT ID
    ========================================
    */

    const {
      data: lastProduct,
      error:
        lastProductError,
    } =
      await supabaseAdmin
        .from("products")
        .select(
          "product_id"
        )
        .order(
          "id",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (
      lastProductError
    ) {
      console.error(
        "GET LAST PRODUCT ERROR:",
        lastProductError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            lastProductError.message,
        },
        {
          status: 500,
        }
      );
    }

    const lastProductNumber =
      Number(
        lastProduct?.product_id ||
          0
      );

    const nextProductId =
      String(
        lastProductNumber +
          1
      );

    /*
    ========================================
    CREATE PRODUCT
    ========================================
    */

    const {
      data: createdProduct,
      error:
        productError,
    } =
      await supabaseAdmin
        .from("products")
        .insert({
          product_id:
            nextProductId,

          product_name:
            productName,

          real_stock:
            finalRealStock,

          display_stock:
            finalDisplayStock,

          status:
            body.status ===
            "Inactive"
              ? "Inactive"
              : "Active",

          price,

          regular_price:
            regularPrice,

          slug,

          description:
            normalizeString(
              body.description
            ),

          image:
            normalizeString(
              body.image
            ),

          gallery_image_1:
            normalizeString(
              body.galleryImage1
            ),

          gallery_image_2:
            normalizeString(
              body.galleryImage2
            ),

          gallery_image_3:
            normalizeString(
              body.galleryImage3
            ),

          gallery_image_4:
            normalizeString(
              body.galleryImage4
            ),

          featured:
            body.featured ===
            true,

          best_seller:
            body.bestSeller ===
            true,

          new_arrival:
            body.newArrival ===
            true,
        })
        .select(
          "id, product_id, product_name"
        )
        .single();

    if (
      productError
    ) {
      console.error(
        "CREATE PRODUCT DB ERROR:",
        productError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            productError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    ========================================
    CREATE VARIANTS
    ========================================
    */

    if (
      variants.length >
      0
    ) {
      const variantRows =
        variants.map(
          (variant) => ({
            product_id:
              nextProductId,

            variant_name:
              variant.variantName,

            sku:
              variant.sku,

            price:
              variant.price,

            real_stock:
              variant.realStock,

            display_stock:
              variant.displayStock,

            image:
              variant.image,

            status:
              variant.status,

            sort_order:
              variant.sortOrder,
          })
        );

      const {
        error:
          variantsError,
      } =
        await supabaseAdmin
          .from(
            "product_variants"
          )
          .insert(
            variantRows
          );

      /*
      ======================================
      ROLLBACK PRODUCT IF VARIANT INSERT
      FAILS
      ======================================
      */

      if (
        variantsError
      ) {
        console.error(
          "CREATE VARIANTS ERROR:",
          variantsError
        );

        await supabaseAdmin
          .from("products")
          .delete()
          .eq(
            "product_id",
            nextProductId
          );

        return NextResponse.json(
          {
            success: false,
            message:
              `Product was not created because variant creation failed: ${variantsError.message}`,
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
    ========================================
    AUDIT LOG
    ========================================

    Log the completed product creation only after
    the product and all requested variants exist.

    Audit logging is best-effort and must not turn a
    successful product creation into a failed request.
    ========================================
    */

    const auditLogged =
      await writeAuditLog({
        request: req,
        action: "create",
        module: "products",
        targetType: "product",
        targetId: nextProductId,
        description:
          `Created product ${productName} (${nextProductId})${variants.length > 0 ? ` with ${variants.length} variant(s)` : ""}.`,
        metadata: {
          product_id: nextProductId,
          product_name: productName,
          slug,
          price,
          regular_price: regularPrice,
          status:
            body.status === "Inactive"
              ? "Inactive"
              : "Active",
          real_stock: finalRealStock,
          display_stock: finalDisplayStock,
          variant_count: variants.length,
          variants: variants.map(
            (variant) => ({
              variant_name:
                variant.variantName,
              sku: variant.sku,
              price: variant.price,
              real_stock:
                variant.realStock,
              display_stock:
                variant.displayStock,
              status: variant.status,
              sort_order:
                variant.sortOrder,
            })
          ),
          featured:
            body.featured === true,
          best_seller:
            body.bestSeller === true,
          new_arrival:
            body.newArrival === true,
        },
      });

    /*
    ========================================
    SUCCESS
    ========================================
    */

    return NextResponse.json(
      {
        success: true,

        message:
          variants.length >
          0
            ? "Product and variants created successfully."
            : "Product created successfully.",

        product: {
          id:
            createdProduct.id,

          productId:
            createdProduct.product_id,

          productName:
            createdProduct.product_name,
        },

        variantCount:
          variants.length,
        auditLogged,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
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