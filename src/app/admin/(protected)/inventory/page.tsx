import InventoryTable from "@/components/admin/InventoryTable";
import { headers } from "next/headers";

async function getInventory() {
  const requestHeaders = await headers();

  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host");

  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    "http";

  if (!host) {
    throw new Error(
      "Unable to determine application host."
    );
  }

  const baseUrl = `${protocol}://${host}`;

  const response = await fetch(
    `${baseUrl}/api/admin/inventory`,
    {
      cache: "no-store",
      headers: {
        Cookie:
          requestHeaders.get("cookie") || "",
      },
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "INVENTORY API ERROR:",
      errorText
    );

    throw new Error(
      `Failed to fetch inventory: ${response.status}`
    );
  }

  const data =
    await response.json();

  return data.products || [];
}

export default async function InventoryPage() {
  const products =
    await getInventory();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Inventory
      </h1>

      <InventoryTable
        products={products}
      />
    </div>
  );
}