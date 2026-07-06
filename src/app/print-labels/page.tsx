import ShippingLabel from "@/components/admin/ShippingLabel";

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

export default async function PrintLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ids?: string;
  }>;
}) {
  const params = await searchParams;

  const ids = params.ids?.split(",") || [];

  const orders = await getOrders();

  const selectedOrders = orders.filter(
    (order: any) => ids.includes(order.orderId)
  );

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          `,
        }}
      />

      <div
        style={{
          width: "100mm",
          margin: "0 auto",
          padding: 0,
          background: "#fff",
        }}
      >
        {selectedOrders.map((order: any) => (
          <ShippingLabel
            key={order.orderId}
            order={order}
          />
        ))}
      </div>
    </>
  );
}