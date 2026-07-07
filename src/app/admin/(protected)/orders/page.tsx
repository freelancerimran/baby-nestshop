import OrdersTable from "@/components/admin/OrdersTable";
import SyncAllCourierButton from "@/components/admin/SyncAllCourierButton";

async function getOrders() {
  const response = await fetch(
  `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/orders`,
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
<h1 className="mb-4 text-3xl font-bold">
  Orders
</h1>

<SyncAllCourierButton />

<OrdersTable orders={orders} />
    </div>
  );
}