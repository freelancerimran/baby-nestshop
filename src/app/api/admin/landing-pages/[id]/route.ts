import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { hasPermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

/*
============================================================
GET SINGLE LANDING PAGE
============================================================
*/

export async function GET(
  _request: NextRequest,
  context: RouteContext
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
            "You do not have permission to view landing pages.",
        },
        { status: 403 }
      );
    }

    const { id } =
      await context.params;

    const landingPageId =
      Number(id);

    if (
      !Number.isInteger(
        landingPageId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid landing page ID.",
        },
        { status: 400 }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .select("*")
        .eq(
          "id",
          landingPageId
        )
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Landing page not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      landingPage:
        data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load landing page.",
      },
      { status: 500 }
    );
  }
}

/*
============================================================
UPDATE LANDING PAGE
============================================================
*/

export async function PATCH(
  request: NextRequest,
  context: RouteContext
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
            "You do not have permission to edit landing pages.",
        },
        { status: 403 }
      );
    }

    const { id } =
      await context.params;

    const landingPageId =
      Number(id);

    if (
      !Number.isInteger(
        landingPageId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid landing page ID.",
        },
        { status: 400 }
      );
    }

    const body =
      await request.json();

    const {
      data: existing,
      error:
        existingError,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .select("*")
        .eq(
          "id",
          landingPageId
        )
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingError.message,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Landing page not found.",
        },
        { status: 404 }
      );
    }

    const pageTitle =
      nullableText(
        body.pageTitle
      );

    if (!pageTitle) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Page title is required.",
        },
        { status: 400 }
      );
    }

    const slugInput =
      cleanText(
        body.slug
      );

    const slug =
      slugInput
        ? slugify(
            slugInput
          )
        : existing.slug;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid slug is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: duplicateSlug,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .select("id")
        .eq(
          "slug",
          slug
        )
        .neq(
          "id",
          landingPageId
        )
        .maybeSingle();

    if (duplicateSlug) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This slug is already being used.",
        },
        { status: 409 }
      );
    }

    const status =
      cleanText(
        body.status
      ) === "published"
        ? "published"
        : "draft";

    /*
    ========================================================
    DELIVERY
    ========================================================
    */

    const deliveryMode =
      normalizeDeliveryMode(
        body.deliveryMode ??
          body.delivery_mode ??
          existing.delivery_mode
      );

    const deliveryInsideDhaka =
      deliveryMode === "paid"
        ? nonNegativeNumber(
            body.deliveryInsideDhaka ??
              body.delivery_inside_dhaka ??
              existing.delivery_inside_dhaka
          )
        : 0;

    const deliveryOutsideDhaka =
      deliveryMode === "paid"
        ? nonNegativeNumber(
            body.deliveryOutsideDhaka ??
              body.delivery_outside_dhaka ??
              existing.delivery_outside_dhaka
          )
        : 0;

    const updateData: Record<
      string,
      unknown
    > = {
      page_title:
        pageTitle,

      short_description:
        nullableText(
          body.shortDescription
        ),

      description:
        nullableText(
          body.description
        ),

      regular_price:
        numberOrNull(
          body.regularPrice
        ),

      offer_price:
        numberOrNull(
          body.offerPrice
        ),

      images:
        stringArray(
          body.images
        ),

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

      slug,

      status,

      /*
      ======================================================
      DELIVERY SAVE
      ======================================================
      */

      delivery_mode:
        deliveryMode,

      delivery_inside_dhaka:
        deliveryInsideDhaka,

      delivery_outside_dhaka:
        deliveryOutsideDhaka,

      updated_at:
        new Date().toISOString(),
    };

    if (
      status ===
      "published"
    ) {
      updateData.published_at =
        existing.published_at ||
        new Date().toISOString();
    } else {
      updateData.published_at =
        null;
    }

    /*
    ========================================================
    PRODUCT-BASED PAGE
    VARIANTS REMAIN LOCKED
    ========================================================
    */

    if (
      !existing.is_manual
    ) {
      updateData.product_id =
        existing.product_id;

      updateData.is_manual =
        false;

      updateData.variants =
        existing.variants;
    } else {
      updateData.product_id =
        null;

      updateData.is_manual =
        true;

      if (
        Array.isArray(
          body.variants
        )
      ) {
        updateData.variants =
          body.variants;
      }
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .update(
          updateData
        )
        .eq(
          "id",
          landingPageId
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "LANDING PAGE UPDATE ERROR:",
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
      landingPage:
        data,
    });
  } catch (error) {
    console.error(
      "LANDING PAGE UPDATE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update landing page.",
      },
      { status: 500 }
    );
  }
}

/*
============================================================
DELETE LANDING PAGE
============================================================
*/

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
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
            "You do not have permission to delete landing pages.",
        },
        { status: 403 }
      );
    }

    const { id } =
      await context.params;

    const landingPageId =
      Number(id);

    if (
      !Number.isInteger(
        landingPageId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid landing page ID.",
        },
        { status: 400 }
      );
    }

    const {
      data: existing,
      error:
        existingError,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .select("id")
        .eq(
          "id",
          landingPageId
        )
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingError.message,
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Landing page not found.",
        },
        { status: 404 }
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from("landing_pages")
        .delete()
        .eq(
          "id",
          landingPageId
        );

    if (error) {
      console.error(
        "LANDING PAGE DELETE ERROR:",
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
      message:
        "Landing page deleted successfully.",
    });
  } catch (error) {
    console.error(
      "LANDING PAGE DELETE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete landing page.",
      },
      { status: 500 }
    );
  }
}