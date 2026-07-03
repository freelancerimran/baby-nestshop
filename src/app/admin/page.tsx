async function getDashboardData() {
  const response = await fetch(
    "http://localhost:3000/api/admin/dashboard",
    {
      cache: "no-store",
    }
  );

  return response.json();
}

export default async function AdminPage() {
  const data = await getDashboardData();

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
      value: `৳ ${data.totalRevenue}`,
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