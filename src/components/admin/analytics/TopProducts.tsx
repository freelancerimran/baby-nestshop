interface Props {
  orders: any[];
}

export default function TopProducts({
  orders,
}: Props) {

  const counts: Record<
    string,
    number
  > = {};

  orders.forEach((order) => {

    const product =
      order.productName ||
      "Unknown";

    counts[product] =
      (counts[product] || 0) + 1;

  });

  const topProducts =
    Object.entries(counts)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 5);

  return (
    <div className="bg-white rounded-3xl border p-6 shadow-sm">

      <h2 className="text-xl font-semibold mb-6">
        Top Products
      </h2>

      <div className="space-y-4">

        {topProducts.map(
          ([name, count]) => (
            <div
              key={name}
              className="flex items-center justify-between"
            >
              <span>
                {name}
              </span>

              <span className="font-semibold">
                {count}
              </span>
            </div>
          )
        )}

      </div>

    </div>
  );
}