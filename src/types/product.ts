export interface Product {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;

  costPrice: number;
  sellingPrice: number;

  deliveryInsideDhaka: number;
  deliveryOutsideDhaka: number;

  stock: number;

  image: string;

  status: "active" | "inactive";
}