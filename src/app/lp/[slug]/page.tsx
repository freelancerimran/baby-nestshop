import { notFound } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase-admin";

import LandingPageClient from "@/components/landing/LandingPageClient";

import type {
  LandingPage,
  LandingPageStatus,
  LandingPageDeliveryMode,
} from "@/types/landing-page";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic =
  "force-dynamic";

export default async function LandingPage({
  params,
}: Props) {
  const { slug } =
    await params;

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("landing_pages")
      .select("*")
      .eq(
        "slug",
        slug
      )
      .eq(
        "status",
        "published"
      )
      .maybeSingle();

  if (
    error ||
    !data
  ) {
    notFound();
  }

  const status: LandingPageStatus =
    data.status ===
    "published"
      ? "published"
      : "draft";

  const deliveryMode: LandingPageDeliveryMode =
    data.delivery_mode ===
    "paid"
      ? "paid"
      : "free";

  const landingPage: LandingPage =
    {
      id: data.id,

      productId:
        data.product_id ??
        null,

      isManual:
        Boolean(
          data.is_manual
        ),

      slug:
        data.slug ??
        null,

      status,

      pageTitle:
        data.page_title ??
        null,

      shortDescription:
        data.short_description ??
        null,

      description:
        data.description ??
        null,

      regularPrice:
        data.regular_price !==
          null &&
        data.regular_price !==
          undefined
          ? Number(
              data.regular_price
            )
          : null,

      offerPrice:
        data.offer_price !==
          null &&
        data.offer_price !==
          undefined
          ? Number(
              data.offer_price
            )
          : null,

      images:
        Array.isArray(
          data.images
        )
          ? data.images
          : [],

      variants:
        Array.isArray(
          data.variants
        )
          ? data.variants
          : [],

      benefits:
        Array.isArray(
          data.benefits
        )
          ? data.benefits
          : [],

      features:
        Array.isArray(
          data.features
        )
          ? data.features
          : [],

      reviews:
        Array.isArray(
          data.reviews
        )
          ? data.reviews
          : [],

      facebookPixelId:
        data.facebook_pixel_id ??
        null,

      /*
      ======================================================
      DELIVERY
      ======================================================
      */

      deliveryMode,

      deliveryInsideDhaka:
        Number(
          data.delivery_inside_dhaka ??
            0
        ),

      deliveryOutsideDhaka:
        Number(
          data.delivery_outside_dhaka ??
            0
        ),

      publishedAt:
        data.published_at ??
        null,

      createdAt:
        data.created_at,

      updatedAt:
        data.updated_at,
    };

  return (
    <LandingPageClient
      landingPage={
        landingPage
      }
    />
  );
}