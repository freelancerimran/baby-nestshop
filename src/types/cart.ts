export interface CartVariant {
  id: number;

  productId: number;

  variantName: string;

  /**
   * SKU may be empty/null because the database
   * allows variants without a SKU.
   */
  sku: string | null;

  price: number | null;

  realStock: number;

  displayStock: number;

  image: string | null;

  status: string;

  sortOrder: number;
}


export interface CartItem {
  productId: number;

  productName: string;

  slug: string;

  image: string;

  unitPrice: number;

  quantity: number;

  maxStock: number;

  deliveryInsideDhaka: number;

  deliveryOutsideDhaka: number;

  /**
   * Variant products keep all available variants
   * inside the cart.
   *
   * The customer selects the actual variants later
   * on the Quick Order page.
   */
  variants?: CartVariant[];
}