import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

interface RouteContext {
  params: Promise<{
    productId: string;
  }>;
}

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const allowed = await hasPermission(
      "products",
      "manage_variants"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage product variants.",
        },
        { status: 403 }
      );
    }

    const { productId } =
      await context.params;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select(
        "product_id, product_name"
      )
      .eq(
        "product_id",
        productId
      )
      .maybeSingle();

    if (productError) {
      console.error(
        "PRODUCT LOOKUP ERROR:",
        productError
      );

      return NextResponse.json(
        {
          success: false,
          message: productError.message,
        },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Parent product not found.",
        },
        { status: 404 }
      );
    }

    const {
      data: variants,
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
      .eq(
        "product_id",
        productId
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
      console.error(
        "GET PRODUCT VARIANTS ERROR:",
        variantsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            variantsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      product: {
        productId:
          product.product_id,

        productName:
          product.product_name,
      },

      variants:
        variants ?? [],
    });
  } catch (error) {
    console.error(
      "GET PRODUCT VARIANTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}


/*
==================================================
CREATE VARIANT
==================================================
*/

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
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
        { status: 403 }
      );
    }

    const { productId } =
      await context.params;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select(
        "product_id, product_name"
      )
      .eq(
        "product_id",
        productId
      )
      .maybeSingle();

    if (productError) {
      return NextResponse.json(
        {
          success: false,
          message:
            productError.message,
        },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Parent product not found.",
        },
        { status: 404 }
      );
    }

    const body =
      await req.json();

    const variantName =
      typeof body.variantName ===
      "string"
        ? body.variantName.trim()
        : "";

    if (!variantName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Variant name is required.",
        },
        { status: 400 }
      );
    }

    const sku =
      typeof body.sku ===
      "string"
        ? body.sku.trim()
        : "";

    /*
    ==============================================
    STOCK
    ==============================================
    */

    const realStock =
      body.realStock ===
        undefined ||
      body.realStock ===
        null ||
      body.realStock === ""
        ? 0
        : Number(
            body.realStock
          );

    const displayStock =
      body.displayStock ===
        undefined ||
      body.displayStock ===
        null ||
      body.displayStock === ""
        ? 0
        : Number(
            body.displayStock
          );

    if (
      !Number.isInteger(
        realStock
      ) ||
      realStock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Real stock must be a non-negative integer.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(
        displayStock
      ) ||
      displayStock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Display stock must be a non-negative integer.",
        },
        { status: 400 }
      );
    }

    const canManageStock =
      await hasPermission(
        "products",
        "manage_stock"
      );

    if (
      !canManageStock &&
      (
        realStock !== 0 ||
        displayStock !== 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage product stock.",
        },
        { status: 403 }
      );
    }

    /*
    ==============================================
    PRICE
    ==============================================
    */

    let price:
      | number
      | null = null;

    if (
      body.price !==
        undefined &&
      body.price !==
        null &&
      body.price !== ""
    ) {
      price =
        Number(body.price);

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Price must be a valid non-negative number.",
          },
          { status: 400 }
        );
      }
    }

    /*
    ==============================================
    SORT ORDER
    ==============================================
    */

    const sortOrder =
      body.sortOrder ===
        undefined ||
      body.sortOrder ===
        null ||
      body.sortOrder === ""
        ? 0
        : Number(
            body.sortOrder
          );

    if (
      !Number.isInteger(
        sortOrder
      ) ||
      sortOrder < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sort order must be a non-negative integer.",
        },
        { status: 400 }
      );
    }

    /*
    ==============================================
    STATUS
    ==============================================
    */

    const status =
      body.status ===
      "Inactive"
        ? "Inactive"
        : "Active";

    /*
    ==============================================
    IMAGE
    ==============================================
    */

    const image =
      typeof body.image ===
        "string" &&
      body.image.trim()
        ? body.image.trim()
        : null;

    /*
    ==============================================
    DUPLICATE SKU
    ==============================================
    */

    if (sku) {
      const {
        data: existingSku,
        error: skuError,
      } = await supabaseAdmin
        .from(
          "product_variants"
        )
        .select("id")
        .eq("sku", sku)
        .maybeSingle();

      if (skuError) {
        return NextResponse.json(
          {
            success: false,
            message:
              skuError.message,
          },
          { status: 500 }
        );
      }

      if (existingSku) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This SKU is already in use.",
          },
          { status: 409 }
        );
      }
    }

    /*
    ==============================================
    INSERT
    ==============================================
    */

    const {
      data: variant,
      error,
    } = await supabaseAdmin
      .from(
        "product_variants"
      )
      .insert({
        product_id:
          product.product_id,

        variant_name:
          variantName,

        sku:
          sku || null,

        price,

        real_stock:
          realStock,

        display_stock:
          displayStock,

        image,

        status,

        sort_order:
          sortOrder,
      })
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
      .single();

    if (error) {
      console.error(
        "CREATE VARIANT ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        { status: 500 }
      );
    }

    const auditLogged =
      await writeAuditLog({
        request: req,
        action: "create",
        module: "products",
        targetType: "product_variant",
        targetId: String(variant.id),
        description:
          `Created product variant "${variant.variant_name}" for product "${product.product_name}".`,
        metadata: {
          product_id: product.product_id,
          product_name: product.product_name,
          variant_id: variant.id,
          variant_name: variant.variant_name,
          sku: variant.sku,
          price: variant.price,
          real_stock: variant.real_stock,
          display_stock: variant.display_stock,
          image: variant.image,
          status: variant.status,
          sort_order: variant.sort_order,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Product variant created successfully.",
        variant,
        auditLogged,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE VARIANT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}