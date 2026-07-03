import OrdersTable from "@/components/admin/OrdersTable";

async function getOrders() {
  const response = await fetch(
  "http://localhost:3000/api/admin/orders",
  {
    cache: "no-store",
  }
);

  const data = await response.json();

  return data.orders || [];
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Orders
      </h1>

      <OrdersTable orders={orders} />
    </div>
  );
}