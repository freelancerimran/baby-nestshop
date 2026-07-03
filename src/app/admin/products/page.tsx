import { AdminProduct } from "@/types/admin-product";
import ProductsPageClient from "@/components/admin/ProductsPageClient";

async function getProducts(): Promise<AdminProduct[]> {
  try {
    console.log("STEP 1");

    const response = await fetch(
      "http://localhost:3000/api/admin/products",
      {
        cache: "no-store",
      }
    );

    console.log("STEP 2");

    const data = await response.json();

    console.log("STEP 3", data);

    return data.products || [];
  } catch (error) {
    console.error(
      "Failed to load products:",
      error
    );

    return [];
  }
}

export default async function ProductsPage() {
  const products =
    await getProducts();

  return (
    <ProductsPageClient
      products={products}
    />
  );
}