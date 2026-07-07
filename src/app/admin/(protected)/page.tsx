async function getDashboardData() {
  const [ordersResponse, productsResponse] =
    await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/orders`,
        {
          cache: "no-store",
        }
      ),

      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/products`,
        {
          cache: "no-store",
        }
      ),
    ]);

  const ordersData =
    await ordersResponse.json();

  const productsData =
    await productsResponse.json();

  const orders =
    ordersData.orders || [];

  const products =
    productsData.products || [];

  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order: any) =>
        order.status ===
        "Pending"
    ).length;

  const totalRevenue =
    orders.reduce(
      (
        sum: number,
        order: any
      ) =>
        sum +
        Number(
          order.total || 0
        ),
      0
    );

  const totalProducts =
    products.length;

  return {
    totalOrders,
    pendingOrders,
    totalRevenue,
    totalProducts,
  };
}

export default async function AdminPage() {
  const data =
    await getDashboardData();

  const cards = [
    {
      title: "Total Orders",
      value: data.totalOrders,
    },
    {
      title: "Pending Orders",
      value: data.pendingOrders,
    },
    {
      title: "Revenue",
      value: `৳ ${data.totalRevenue.toLocaleString()}`,
    },
    {
      title: "Products",
      value: data.totalProducts,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">
        Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-gray-500">
              {card.title}
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              {card.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}