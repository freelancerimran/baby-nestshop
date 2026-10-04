export type LandingPageStatus =
  | "draft"
  | "published";

export type LandingPageDeliveryMode =
  | "free"
  | "paid";

export interface LandingPageVariant {
  id: number;
  productId: string;
  variantName: string;
  sku: string | null;
  price: number | null;
  image: string | null;
  status: string;
  sortOrder: number;
}

export interface LandingPage {
  id: number;

  productId: string | null;
  isManual: boolean;

  slug: string | null;
  status: LandingPageStatus;

  pageTitle: string | null;
  shortDescription: string | null;
  description: string | null;

  regularPrice: number | null;
  offerPrice: number | null;

  images: string[];
  variants: LandingPageVariant[];

  benefits: string[];
  features: string[];
  reviews: unknown[];

  facebookPixelId: string | null;

  /*
  ============================================================
  DELIVERY
  ============================================================
  */

  deliveryMode: LandingPageDeliveryMode;

  deliveryInsideDhaka: number;

  deliveryOutsideDhaka: number;

  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageProduct {
  productId: string;
  productName: string;

  price: number;
  regularPrice: number;

  slug: string;

  description: string;

  image: string;
  galleryImage1?: string;
  galleryImage2?: string;
  galleryImage3?: string;
  galleryImage4?: string;

  hasVariants?: boolean;
  variants?: LandingPageVariant[];
}