type Product = {
  productId: string;
  productName: string;

  realStock: number;
  displayStock: number;

  status: string;
  price: number;

  slug: string;
};

export default function InventoryTable({
  products,
}: {
  products: Product[];
}) {
  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (p) =>
        p.status ===
        "Active"
    ).length;

  const lowStockProducts =
    products.filter(
      (p) =>
        Number(
          p.realStock
        ) > 0 &&
        Number(
          p.realStock
        ) <= 10
    ).length;

  const outOfStockProducts =
    products.filter(
      (p) =>
        Number(
          p.realStock
        ) <= 0
    ).length;

  const getAlertBadge = (
    stock: number
  ) => {
    if (stock <= 0) {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
          Out Of Stock
        </span>
      );
    }

    if (stock <= 10) {
      return (
        <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
          Low Stock
        </span>
      );
    }

    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
        Healthy
      </span>
    );
  };

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Products
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalProducts}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Active Products
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {activeProducts}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Low Stock
          </p>

          <h2 className="mt-2 text-3xl font-bold text-orange-600">
            {lowStockProducts}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Out Of Stock
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {outOfStockProducts}
          </h2>
        </div>

      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>

              <th className="p-3 text-left">
                Product
              </th>

              <th className="p-3 text-left">
                Real Stock
              </th>

              <th className="p-3 text-left">
                Display Stock
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-left">
                Inventory Alert
              </th>

            </tr>
          </thead>

          <tbody>

            {products.map(
              (product) => (
                <tr
                  key={
                    product.productId
                  }
                  className="border-t"
                >
                  <td className="p-3 font-medium">
                    {
                      product.productName
                    }
                  </td>

                  <td className="p-3">
                    {
                      product.realStock
                    }
                  </td>

                  <td className="p-3">
                    {
                      product.displayStock
                    }
                  </td>

                  <td className="p-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                      {
                        product.status
                      }
                    </span>
                  </td>

                  <td className="p-3">
                    {getAlertBadge(
                      Number(
                        product.realStock
                      )
                    )}
                  </td>

                </tr>
              )
            )}

          </tbody>
        </table>
      </div>
    </>
  );
}