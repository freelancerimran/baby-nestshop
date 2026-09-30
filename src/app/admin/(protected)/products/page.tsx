export const dynamic = "force-dynamic";

import { headers } from "next/headers";

import { AdminProduct } from "@/types/admin-product";
import ProductsPageClient from "@/components/admin/ProductsPageClient";

async function getProducts(): Promise<AdminProduct[]> {
  try {
    console.log("STEP 1: Loading products...");

    const requestHeaders = await headers();

    const host = requestHeaders.get("host");

    const forwardedProto =
      requestHeaders.get("x-forwarded-proto") ||
      (process.env.NODE_ENV === "development" ? "http" : "https");

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (host ? `${forwardedProto}://${host}` : null);

    if (!baseUrl) {
      console.error("Products API URL could not be determined.");
      return [];
    }

    const cookie = requestHeaders.get("cookie");

    const response = await fetch(
      `${baseUrl}/api/admin/products`,
      {
        method: "GET",
        headers: {
          ...(cookie ? { cookie } : {}),
        },
        cache: "no-store",
      }
    );

    console.log(
      "STEP 2: Products API response:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Products API failed:",
        response.status,
        errorText
      );

      return [];
    }

    const data = await response.json();

    console.log("STEP 3: Products API data:", data);

    if (!data || !Array.isArray(data.products)) {
      console.error(
        "Products API returned invalid products data:",
        data
      );

      return [];
    }

    console.log(
      "STEP 4: Products loaded:",
      data.products.length
    );

    return data.products as AdminProduct[];
  } catch (error) {
    console.error(
      "Failed to load products:",
      error
    );

    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  console.log(
    "ProductsPage: total products =",
    products.length
  );

  return (
    <ProductsPageClient
      products={products}
    />
  );
}