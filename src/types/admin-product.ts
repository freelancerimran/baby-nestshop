export interface AdminProduct {
  productId: string;

  productName: string;

  realStock: number;

  displayStock: number;

  status: string;

  price: number;

  regularPrice: number;

  slug: string;

  description: string;

  image: string;

  galleryImage1?: string;

  galleryImage2?: string;

  galleryImage3?: string;

  galleryImage4?: string;

  featured?: boolean;

  bestSeller?: boolean;

  newArrival?: boolean;
}


/* ========================================
   ADMIN PRODUCT VARIANT
======================================== */

export interface AdminProductVariant {
  id: number;

  productId: string;

  variantName: string;

  sku: string | null;

  price: number | null;

  realStock: number;

  displayStock: number;

  image: string | null;

  status: string;

  sortOrder: number;

  createdAt: string;

  updatedAt: string;
}


/* ========================================
   PRODUCT VARIANT FORM
======================================== */

export interface ProductVariantForm {
  variantName: string;

  sku: string;

  price: number | null;

  realStock: number;

  displayStock: number;

  image: string;

  status: string;

  sortOrder: number;
}