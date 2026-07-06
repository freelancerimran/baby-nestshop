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