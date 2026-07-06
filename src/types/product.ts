export interface Product {
  id: number;

  slug: string;

  name: string;

  shortDescription: string;

  description: string;

  regularPrice: number;

  sellingPrice: number;

  deliveryInsideDhaka: number;

  deliveryOutsideDhaka: number;

  image: string;

  status: string;

  displayStock?: number;
}