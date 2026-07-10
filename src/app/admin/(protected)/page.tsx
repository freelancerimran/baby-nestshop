import RevenueChart from "@/components/admin/RevenueChart";

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
const processingOrders =
  orders.filter(
    (order: any) =>
      order.status ===
      "Processing"
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

  // Top Selling Products

  const productSales: Record<
    string,
    number
  > = {};

  orders.forEach((order: any) => {
    const product =
      order.productName;

    const qty =
      Number(
        order.quantity || 1
      );

    if (!product) return;

    productSales[product] =
      (productSales[
        product
      ] || 0) + qty;
  });

  const topProducts =
    Object.entries(
      productSales
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 5);

  // Low Stock Products

  const lowStockProducts =
    products
      .filter(
        (product: any) =>
          Number(
            product.realStock
          ) <= 10
      )
      .slice(0, 5);

  return {
 totalOrders,
  pendingOrders,
  processingOrders,
  totalRevenue,
  totalProducts,

  orders,

  recentOrders:
    orders.slice(0, 5),

  topProducts,

  lowStockProducts,
  };
}

export default async function AdminPage() {
  const data =
    await getDashboardData();

  const today = new Date().toLocaleDateString(
  "en-US",
  {
    weekday: "long",
    month: "long",
    day: "numeric",
  }
);


return (
  <div className="space-y-8 p-8">
    {/* Header */}

    <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">
<h1 className="text-4xl font-bold">
  Baby Nest ERP
</h1>

      <p className="mt-2 text-blue-100">
        {today}
      </p>

<div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
  <div>
    <p className="text-sm text-blue-100">
      Revenue
    </p>

    <h2 className="text-3xl font-bold">
      ৳
      {data.totalRevenue.toLocaleString()}
    </h2>
  </div>

  <div>
    <p className="text-sm text-blue-100">
      Orders
    </p>

    <h2 className="text-3xl font-bold">
      {data.totalOrders}
    </h2>
  </div>

  <div>
    <p className="text-sm text-blue-100">
      Pending
    </p>

    <h2 className="text-3xl font-bold">
      {data.pendingOrders}
    </h2>
  </div>

  <div>
    <p className="text-sm text-blue-100">
      Products
    </p>

    <h2 className="text-3xl font-bold">
      {data.totalProducts}
    </h2>
  </div>
</div>
    </div>

<RevenueChart
  orders={data.orders}
/>

<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

  <div className="rounded-3xl bg-yellow-50 p-6 border border-yellow-100">
    <p className="text-sm text-yellow-700">
      Pending Orders
    </p>

    <h2 className="mt-2 text-3xl font-bold">
      {data.pendingOrders}
    </h2>
  </div>

  <div className="rounded-3xl bg-blue-50 p-6 border border-blue-100">
    <p className="text-sm text-blue-700">
      Processing
    </p>

    <h2 className="mt-2 text-3xl font-bold">
      {data.processingOrders}
    </h2>
  </div>

  <div className="rounded-3xl bg-green-50 p-6 border border-green-100">
    <p className="text-sm text-green-700">
      Revenue
    </p>

    <h2 className="mt-2 text-3xl font-bold">
      ৳
      {data.totalRevenue.toLocaleString()}
    </h2>
  </div>

  <div className="rounded-3xl bg-purple-50 p-6 border border-purple-100">
    <p className="text-sm text-purple-700">
      Products
    </p>

    <h2 className="mt-2 text-3xl font-bold">
      {data.totalProducts}
    </h2>
  </div>

</div>


    {/* Recent Orders */}

    <div className="rounded-3xl bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Recent Orders
        </h2>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600">
          Last 5 Orders
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-3 text-left">
                Order ID
              </th>

              <th className="py-3 text-left">
                Customer
              </th>

              <th className="py-3 text-left">
                Status
              </th>

              <th className="py-3 text-left">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {data.recentOrders.map(
              (order: any) => (
<tr
  key={order.orderId}
  className="border-b"
>
<td className="py-3 font-medium">
  {order.orderId}
</td>

<td className="py-3">
  {order.customerName}
</td>

                  <td className="py-3">
                    {order.status}
                  </td>

                  <td className="py-3 font-semibold">
                    ৳ {order.total}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>

  <div className="grid gap-6 lg:grid-cols-2">
  {/* Top Products */}

  <div className="rounded-3xl bg-white p-6 shadow-md">
    <h2 className="mb-4 text-xl font-bold">
      🏆 Top Selling Products
    </h2>

    <div className="space-y-4">
      {data.topProducts.map(
        (
          item: any,
          index: number
        ) => (
          <div
            key={item[0]}
            className="flex items-center justify-between"
          >
            <span>
              #{index + 1}{" "}
              {item[0]}
            </span>

            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              {item[1]} Sold
            </span>
          </div>
        )
      )}
    </div>
  </div>

  {/* Low Stock */}

  <div className="rounded-3xl bg-white p-6 shadow-md">
    <h2 className="mb-4 text-xl font-bold">
      ⚠ Low Stock Alerts
    </h2>

    <div className="space-y-4">
      {data.lowStockProducts
        .length === 0 ? (
        <p className="text-green-600">
          All products have
          healthy stock.
        </p>
      ) : (
        data.lowStockProducts.map(
          (
            product: any
          ) => (
            <div
              key={
                product.productId
              }
              className="flex items-center justify-between"
            >
              <span>
                {
                  product.productName
                }
              </span>

              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                {
                  product.realStock
                }{" "}
                Left
              </span>
            </div>
          )
        )
      )}
    </div>
  </div>

<div className="rounded-3xl bg-white p-6 shadow-md">

  <h2 className="mb-6 text-xl font-bold">
    ⚡ Quick Actions
  </h2>

  <div className="grid gap-4 md:grid-cols-4">

    <a
      href="/admin/orders"
      className="rounded-2xl bg-blue-50 p-5 text-center font-medium transition hover:bg-blue-100"
    >
      📦 Orders
    </a>

    <a
      href="/admin/products"
      className="rounded-2xl bg-green-50 p-5 text-center font-medium transition hover:bg-green-100"
    >
      🛍 Products
    </a>

    <a
      href="/admin/inventory"
      className="rounded-2xl bg-orange-50 p-5 text-center font-medium transition hover:bg-orange-100"
    >
      📊 Inventory
    </a>

    <a
      href="/admin/fulfillment"
      className="rounded-2xl bg-purple-50 p-5 text-center font-medium transition hover:bg-purple-100"
    >
      🚚 Fulfillment
    </a>

  </div>

</div>

</div>

  </div>
);
}