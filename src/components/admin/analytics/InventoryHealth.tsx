interface Props {
  products: any[];
}

export default function InventoryHealth({
  products,
}: Props) {

  const totalProducts =
    products.length;

  const lowStock =
    products.filter(
      (p) =>
        Number(p.realStock) <= 10
    ).length;

  const outOfStock =
    products.filter(
      (p) =>
        Number(p.realStock) <= 0
    ).length;

  const inventoryValue =
    products.reduce(
      (sum, product) =>
        sum +
        Number(product.price || 0) *
          Number(
            product.realStock || 0
          ),
      0
    );

  return (
    <div className="bg-white rounded-3xl border p-6 shadow-sm">

      <h2 className="text-xl font-semibold mb-6">
        Inventory Health
      </h2>

      <div className="space-y-4">

        <Row
          label="Products"
          value={totalProducts}
        />

        <Row
          label="Low Stock"
          value={lowStock}
        />

        <Row
          label="Out Of Stock"
          value={outOfStock}
        />

        <Row
          label="Inventory Value"
          value={`৳${inventoryValue.toLocaleString()}`}
        />

      </div>

    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}