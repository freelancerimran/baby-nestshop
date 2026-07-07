import InventoryTable from "@/components/admin/InventoryTable";

async function getProducts() {
  const response = await fetch(
  `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/products`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  return data.products || [];
}

export default async function InventoryPage() {
  const products =
    await getProducts();

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