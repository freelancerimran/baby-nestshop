type ProductVariant = {
  id: number;
  productId: string;
  variantName: string;
  sku: string | null;
  price: number | null;
  realStock: number;
  displayStock: number;
  image: string | null;
  status: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  productId: string;
  productName: string;

  realStock: number;
  displayStock: number;

  status: string;
  price: number;

  slug: string;

  image?: string;

  hasVariants: boolean;
  variants: ProductVariant[];
};

export default function InventoryTable({
  products,
}: {
  products: Product[];
}) {
  /*
   * ========================================
   * EXISTING SUMMARY LOGIC
   * DO NOT CHANGE
   * ========================================
   */

  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (p) =>
        p.status === "Active"
    ).length;

  const lowStockProducts =
    products.filter(
      (p) =>
        Number(p.realStock) > 0 &&
        Number(p.realStock) <= 10
    ).length;

  const outOfStockProducts =
    products.filter(
      (p) =>
        Number(p.realStock) <= 0
    ).length;

  /*
   * ========================================
   * EXISTING ALERT LOGIC
   * DO NOT CHANGE
   * ========================================
   */

  const getAlertBadge = (
    stock: number
  ) => {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-100">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Out Of Stock
        </span>
      );
    }

    if (stock <= 10) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 ring-1 ring-inset ring-orange-100">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          Low Stock
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Healthy
      </span>
    );
  };

  /*
   * ========================================
   * STATUS BADGE
   * ========================================
   */

  const getStatusBadge = (
    status: string
  ) => {
    const isActive =
      status === "Active";

    return (
      <span
        className={
          isActive
            ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-100"
            : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200"
        }
      >
        <span
          className={
            isActive
              ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
              : "h-1.5 w-1.5 rounded-full bg-slate-400"
          }
        />

        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">

      {/* ========================================
          HEADER
          ======================================== */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventory Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor product stock and variant inventory
            from one place.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-blue-500" />

          {totalProducts} Products
        </div>
      </div>

      {/* ========================================
          SUMMARY CARDS
          EXISTING NUMBERS / FORMULAS PRESERVED
          ======================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Products */}

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Products
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {totalProducts}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Products in inventory
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect
                  x="3"
                  y="3"
                  width="7"
                  height="7"
                  rx="1"
                />
                <rect
                  x="14"
                  y="3"
                  width="7"
                  height="7"
                  rx="1"
                />
                <rect
                  x="3"
                  y="14"
                  width="7"
                  height="7"
                  rx="1"
                />
                <rect
                  x="14"
                  y="14"
                  width="7"
                  height="7"
                  rx="1"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Products */}

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Products
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">
                {activeProducts}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Currently active
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M20 6 9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Low Stock */}

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Low Stock
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-orange-500">
                {lowStockProducts}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Needs attention
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M12 9v4"
                  strokeLinecap="round"
                />
                <path
                  d="M12 17h.01"
                  strokeLinecap="round"
                />
                <path
                  d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Out Of Stock */}

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Out Of Stock
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-red-500">
                {outOfStockProducts}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Currently unavailable
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />
                <path
                  d="m9 9 6 6M15 9l-6 6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          INVENTORY TABLE
          ======================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Table Header */}

        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Product Inventory
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Product-level stock with variant breakdown
              </p>
            </div>

            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live inventory
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">

            <thead>
              <tr className="border-b border-slate-200 bg-white text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 text-left font-semibold">
                  Product
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Real Stock
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Display Stock
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Status
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Inventory Alert
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {products.map(
                (product) => (
                  <ProductInventoryRow
                    key={
                      product.productId
                    }
                    product={product}
                    getAlertBadge={
                      getAlertBadge
                    }
                    getStatusBadge={
                      getStatusBadge
                    }
                  />
                )
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/*
 * ========================================
 * PRODUCT ROW
 * ========================================
 */

function ProductInventoryRow({
  product,
  getAlertBadge,
  getStatusBadge,
}: {
  product: Product;
  getAlertBadge: (
    stock: number
  ) => React.ReactNode;
  getStatusBadge: (
    status: string
  ) => React.ReactNode;
}) {
  const hasVariants =
    product.hasVariants &&
    product.variants.length > 0;

  return (
    <>
      <tr className="group transition-colors hover:bg-slate-50/70">

        {/* Product */}

        <td className="px-5 py-4">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {product.image ? (
                <img
                  src={product.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="text-slate-400"
                >
                  <path d="m21 8-9-5-9 5 9 5 9-5Z" />
                  <path d="m3 8 9 5 9-5" />
                  <path d="M3 8v8l9 5 9-5V8" />
                </svg>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-800">
                {product.productName}
              </div>

              {hasVariants ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    Aggregate stock
                  </span>

                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                    {product.variants.length}{" "}
                    Variants
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-400">
                  Standard product
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Real Stock */}

        <td className="px-5 py-4">
          <span className="font-semibold text-slate-800">
            {product.realStock}
          </span>
        </td>

        {/* Display Stock */}

        <td className="px-5 py-4">
          <span className="font-semibold text-slate-700">
            {product.displayStock}
          </span>
        </td>

        {/* Status */}

        <td className="px-5 py-4">
          {getStatusBadge(
            product.status
          )}
        </td>

        {/* Alert */}

        <td className="px-5 py-4">
          {getAlertBadge(
            Number(
              product.realStock
            )
          )}
        </td>
      </tr>

      {/* ========================================
          VARIANTS
          ======================================== */}

      {hasVariants && (
        <tr className="bg-slate-50/40">
          <td
            colSpan={5}
            className="px-5 pb-4 pt-0"
          >
            <details className="group/details">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50/30">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 transition-transform group-open/details:rotate-90">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="m9 18 6-6-6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <span>
                  View{" "}
                  {
                    product.variants
                      .length
                  }{" "}
                  variants
                </span>

                <span className="ml-auto text-slate-400">
                  Click to expand
                </span>
              </summary>

              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">

                <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <div className="col-span-5">
                    Variant
                  </div>

                  <div className="col-span-2">
                    Real Stock
                  </div>

                  <div className="col-span-2">
                    Display
                  </div>

                  <div className="col-span-3">
                    Status
                  </div>
                </div>

                {product.variants.map(
                  (variant) => (
                    <div
                      key={
                        variant.id
                      }
                      className="grid grid-cols-12 items-center border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="col-span-5 flex items-center gap-3">
<div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
  {variant.image ? (
    <img
      src={variant.image}
      alt={variant.variantName}
      className="h-full w-full object-cover"
    />
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="text-slate-400"
    >
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M3 8v8l9 5 9-5V8" />
    </svg>
  )}
</div>

                        <div>
                          <div className="font-medium text-slate-700">
                            {
                              variant.variantName
                            }
                          </div>

                          {variant.sku && (
                            <div className="mt-0.5 text-[11px] text-slate-400">
                              SKU:{" "}
                              {
                                variant.sku
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 font-semibold text-slate-700">
                        {
                          variant.realStock
                        }
                      </div>

                      <div className="col-span-2 font-semibold text-slate-600">
                        {
                          variant.displayStock
                        }
                      </div>

                      <div className="col-span-3">
                        <div className="flex flex-col items-start gap-1.5">
                          {getStatusBadge(
                            variant.status
                          )}

                          {getAlertBadge(
                            Number(
                              variant.realStock
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </details>
          </td>
        </tr>
      )}
    </>
  );
}