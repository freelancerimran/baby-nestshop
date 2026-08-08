import RevenueChart from "@/components/admin/RevenueChart";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
========================================
GET DASHBOARD DATA DIRECTLY FROM DATABASE
========================================
*/

async function getDashboardData() {
  try {
    /*
    ======================================
    FETCH ORDERS + PRODUCTS
    ======================================
    */

    const [
      { data: orders, error: ordersError },
      { data: products, error: productsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabaseAdmin
        .from("products")
        .select("*")
        .order("id", {
          ascending: true,
        }),
    ]);

    /*
    ======================================
    DATABASE ERROR
    ======================================
    */

    if (ordersError) {
      console.error(
        "DASHBOARD ORDERS ERROR:",
        ordersError
      );
    }

    if (productsError) {
      console.error(
        "DASHBOARD PRODUCTS ERROR:",
        productsError
      );
    }

    /*
    ======================================
    SAFE ARRAYS
    ======================================
    */

    const safeOrders = orders || [];
    const safeProducts = products || [];

    /*
    ======================================
    MAP ORDERS
    ======================================
    */

    const mappedOrders = safeOrders.map(
      (order: any) => ({
        orderId:
          order.order_id,

        date:
          order.order_date ||
          order.created_at,

        customerName:
          order.customer_name ||
          "",

        phone:
          order.phone ||
          "",

        productName:
          order.product_name ||
          "",

        productId:
          order.product_id,

        quantity:
          Number(
            order.quantity ?? 0
          ),

        total:
          Number(
            order.total ?? 0
          ),

        status:
          order.status ||
          "Pending",

        paymentStatus:
          order.payment_status ||
          "Unpaid",

        paidAmount:
          Number(
            order.paid_amount ?? 0
          ),

        dueAmount:
          order.due_amount !== null &&
          order.due_amount !== undefined
            ? Number(
                order.due_amount
              )
            : Math.max(
                0,
                Number(
                  order.total ?? 0
                ) -
                  Number(
                    order.paid_amount ?? 0
                  )
              ),
      })
    );

    /*
    ======================================
    MAP PRODUCTS
    ======================================
    */

    const mappedProducts =
      safeProducts.map(
        (product: any) => ({
          productId:
            product.product_id,

          productName:
            product.product_name,

          realStock:
            Number(
              product.real_stock ?? 0
            ),

          displayStock:
            Number(
              product.display_stock ?? 0
            ),

          status:
            product.status,

          price:
            Number(
              product.price ?? 0
            ),
        })
      );

    /*
    ======================================
    CANCELLED ORDERS
    ======================================

    Cancelled orders:

    ✓ Remain in total order count
    ✓ Remain in recent order history
    ✓ Remain visible in order history

    But:

    ✗ Do NOT count as revenue
    ✗ Do NOT count as sales
    ✗ Do NOT count in top products
    ✗ Do NOT count in revenue chart
    ======================================
    */

    const salesOrders =
      mappedOrders.filter(
        (order: any) =>
          String(
            order.status || ""
          ).toLowerCase() !==
          "cancelled"
      );

    /*
    ======================================
    TOTAL ORDERS
    ======================================
    */

    const totalOrders =
      mappedOrders.length;

    /*
    ======================================
    PENDING ORDERS
    ======================================
    */

    const pendingOrders =
      mappedOrders.filter(
        (order: any) =>
          String(
            order.status || ""
          ).toLowerCase() ===
          "pending"
      ).length;

    /*
    ======================================
    PROCESSING ORDERS
    ======================================
    */

    const processingOrders =
      mappedOrders.filter(
        (order: any) =>
          String(
            order.status || ""
          ).toLowerCase() ===
          "processing"
      ).length;

    /*
    ======================================
    DELIVERED ORDERS
    ======================================
    */

    const deliveredOrders =
      mappedOrders.filter(
        (order: any) =>
          String(
            order.status || ""
          ).toLowerCase() ===
          "delivered"
      ).length;

    /*
    ======================================
    TOTAL REVENUE
    ======================================

    Cancelled orders excluded.
    ======================================
    */

    const totalRevenue =
      salesOrders.reduce(
        (
          sum: number,
          order: any
        ) =>
          sum +
          Number(
            order.total ?? 0
          ),
        0
      );

    /*
    ======================================
    AVERAGE ORDER VALUE
    ======================================
    */

    const averageOrderValue =
      salesOrders.length > 0
        ? totalRevenue /
          salesOrders.length
        : 0;

    /*
    ======================================
    TOTAL PRODUCTS
    ======================================
    */

    const totalProducts =
      mappedProducts.length;

    /*
    ======================================
    LOW STOCK PRODUCTS
    ======================================

    Low stock threshold = 10
    ======================================
    */

    const lowStockProducts =
      mappedProducts
        .filter(
          (product: any) =>
            product.realStock <= 10
        )
        .sort(
          (
            a: any,
            b: any
          ) =>
            a.realStock -
            b.realStock
        )
        .slice(0, 5);

    /*
    ======================================
    TOP SELLING PRODUCTS
    ======================================

    Cancelled orders excluded.

    "Multiple Products" is ignored here
    because the parent order does not
    contain individual product quantities.
    ======================================
    */

    const productSales: Record<
      string,
      number
    > = {};

    salesOrders.forEach(
      (order: any) => {
        const productName =
          String(
            order.productName ||
              ""
          ).trim();

        /*
        Ignore empty product names
        */

        if (!productName) {
          return;
        }

        /*
        Ignore parent-level
        "Multiple Products" records.
        */

        if (
          productName.toLowerCase() ===
          "multiple products"
        ) {
          return;
        }

        const quantity =
          Number(
            order.quantity ?? 0
          );

        if (
          quantity <= 0
        ) {
          return;
        }

        productSales[
          productName
        ] =
          (
            productSales[
              productName
            ] || 0
          ) + quantity;
      }
    );

    const topProducts =
      Object.entries(
        productSales
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(0, 5);

    /*
    ======================================
    RECENT ORDERS
    ======================================
    */

    const recentOrders =
      mappedOrders.slice(0, 5);

    /*
    ======================================
    RETURN EVERYTHING
    ======================================
    */

    return {
      totalOrders,

      pendingOrders,

      processingOrders,

      deliveredOrders,

      totalRevenue,

      averageOrderValue,

      totalProducts,

      orders:
        mappedOrders,

      salesOrders,

      recentOrders,

      topProducts,

      lowStockProducts,
    };
  } catch (error) {
    console.error(
      "DASHBOARD DATA ERROR:",
      error
    );

    /*
    ======================================
    SAFE FALLBACK
    ======================================
    */

    return {
      totalOrders: 0,

      pendingOrders: 0,

      processingOrders: 0,

      deliveredOrders: 0,

      totalRevenue: 0,

      averageOrderValue: 0,

      totalProducts: 0,

      orders: [],

      salesOrders: [],

      recentOrders: [],

      topProducts: [],

      lowStockProducts: [],
    };
  }
}

/*
========================================
DASHBOARD PAGE
========================================
*/

export default async function AdminPage() {
  const data =
    await getDashboardData();

  /*
  ======================================
  TODAY
  ======================================
  */

  const today =
    new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    );

  return (
    <div className="space-y-8 p-8">

      {/* =================================
          HERO HEADER
      ================================= */}

      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">

        <h1 className="text-4xl font-bold">
          Baby Nest ERP
        </h1>

        <p className="mt-2 text-blue-100">
          {today}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">

          {/* Revenue */}

          <div>
            <p className="text-sm text-blue-100">
              Revenue
            </p>

            <h2 className="text-3xl font-bold">
              ৳
              {data.totalRevenue.toLocaleString()}
            </h2>
          </div>

          {/* Orders */}

          <div>
            <p className="text-sm text-blue-100">
              Orders
            </p>

            <h2 className="text-3xl font-bold">
              {data.totalOrders}
            </h2>
          </div>

          {/* Pending */}

          <div>
            <p className="text-sm text-blue-100">
              Pending
            </p>

            <h2 className="text-3xl font-bold">
              {data.pendingOrders}
            </h2>
          </div>

          {/* Products */}

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

      {/* =================================
          REVENUE ANALYTICS
      ================================= */}

      <RevenueChart
        orders={
          data.salesOrders
        }
      />

      {/* =================================
          SUMMARY CARDS
      ================================= */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

        {/* Pending */}

        <div className="rounded-3xl border border-yellow-100 bg-yellow-50 p-6">

          <p className="text-sm text-yellow-700">
            Pending Orders
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {data.pendingOrders}
          </h2>

        </div>

        {/* Processing */}

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">

          <p className="text-sm text-blue-700">
            Processing
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {data.processingOrders}
          </h2>

        </div>

        {/* Revenue */}

        <div className="rounded-3xl border border-green-100 bg-green-50 p-6">

          <p className="text-sm text-green-700">
            Revenue
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ৳
            {data.totalRevenue.toLocaleString()}
          </h2>

        </div>

        {/* Products */}

        <div className="rounded-3xl border border-purple-100 bg-purple-50 p-6">

          <p className="text-sm text-purple-700">
            Products
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {data.totalProducts}
          </h2>

        </div>

      </div>

      {/* =================================
          RECENT ORDERS
      ================================= */}

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

              {data.recentOrders.length ===
              0 ? (

                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-slate-500"
                  >
                    No orders found.
                  </td>
                </tr>

              ) : (

                data.recentOrders.map(
                  (
                    order: any
                  ) => (

                    <tr
                      key={
                        order.orderId
                      }
                      className="border-b"
                    >

                      <td className="py-3 font-medium">
                        {
                          order.orderId
                        }
                      </td>

                      <td className="py-3">
                        {
                          order.customerName
                        }
                      </td>

                      <td className="py-3">

                        <span
                          className={`
                            inline-flex
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-medium
                            ${
                              String(
                                order.status ||
                                  ""
                              ).toLowerCase() ===
                              "cancelled"
                                ? "bg-red-100 text-red-700"
                                : String(
                                    order.status ||
                                      ""
                                  ).toLowerCase() ===
                                  "delivered"
                                ? "bg-green-100 text-green-700"
                                : String(
                                    order.status ||
                                      ""
                                  ).toLowerCase() ===
                                  "processing"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          `}
                        >
                          {
                            order.status
                          }
                        </span>

                      </td>

                      <td className="py-3 font-semibold">
                        ৳{" "}
                        {Number(
                          order.total ||
                            0
                        ).toLocaleString()}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================
          TOP PRODUCTS + LOW STOCK
      ================================= */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* =================================
            TOP SELLING PRODUCTS
        ================================= */}

        <div className="rounded-3xl bg-white p-6 shadow-md">

          <h2 className="mb-4 text-xl font-bold">
            🏆 Top Selling Products
          </h2>

          <div className="space-y-4">

            {data.topProducts.length ===
            0 ? (

              <p className="text-slate-500">
                No sales yet.
              </p>

            ) : (

              data.topProducts.map(
                (
                  item: [
                    string,
                    number
                  ],
                  index: number
                ) => (

                  <div
                    key={
                      item[0]
                    }
                    className="flex items-center justify-between gap-4"
                  >

                    <span className="min-w-0 truncate">
                      #{index + 1}{" "}
                      {item[0]}
                    </span>

                    <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                      {item[1]} Sold
                    </span>

                  </div>

                )
              )

            )}

          </div>

        </div>

        {/* =================================
            LOW STOCK
        ================================= */}

        <div className="rounded-3xl bg-white p-6 shadow-md">

          <h2 className="mb-4 text-xl font-bold">
            ⚠ Low Stock Alerts
          </h2>

          <div className="space-y-4">

            {data.lowStockProducts.length ===
            0 ? (

              <p className="text-green-600">
                All products have healthy stock.
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
                    className="flex items-center justify-between gap-4"
                  >

                    <span className="min-w-0 truncate">
                      {
                        product.productName
                      }
                    </span>

                    <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
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

      </div>

      {/* =================================
          QUICK ACTIONS
      ================================= */}

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
  );
}