import ShippingLabel from "@/components/admin/ShippingLabel";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==================================================
GET SELECTED ORDERS + ACTUAL ORDER ITEMS
==================================================
*/

async function getOrders(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  /*
  ================================================
  GET MASTER ORDERS
  ================================================
  */

  const {
    data: ordersData,
    error: ordersError,
  } = await supabaseAdmin
    .from("orders")
    .select("*")
    .in("order_id", ids);

  if (ordersError) {
    console.error(
      "PRINT LABEL ORDERS ERROR:",
      ordersError
    );

    return [];
  }

  const orders = ordersData || [];

  /*
  ================================================
  GET ACTUAL ORDER ITEMS
  ================================================
  
  Multi-product orders are stored here.
  */

  const {
    data: itemsData,
    error: itemsError,
  } = await supabaseAdmin
    .from("order_items")
    .select(
      `
        id,
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        line_total
      `
    )
    .in("order_id", ids);

  if (itemsError) {
    console.error(
      "PRINT LABEL ORDER ITEMS ERROR:",
      itemsError
    );

    return [];
  }

  const orderItems = itemsData || [];

  /*
  ================================================
  GROUP ITEMS BY ORDER ID
  ================================================
  */

  const itemsByOrderId =
    new Map<string, any[]>();

  for (const item of orderItems) {
    const existing =
      itemsByOrderId.get(
        item.order_id
      ) || [];

    existing.push({
      id: item.id,

      productId:
        item.product_id,

      productName:
        item.product_name ||
        "Product",

      quantity:
        Number(
          item.quantity ?? 1
        ),

      unitPrice:
        Number(
          item.unit_price ?? 0
        ),

      lineTotal:
        Number(
          item.line_total ?? 0
        ),
    });

    itemsByOrderId.set(
      item.order_id,
      existing
    );
  }

  /*
  ================================================
  MAP DATABASE → SHIPPING LABEL
  ================================================
  */

  return orders.map(
    (order) => {
      /*
      ============================================
      PAYMENT
      ============================================
      */

      const total =
        Number(
          order.total ?? 0
        );

      const paidAmount =
        Number(
          order.paid_amount ?? 0
        );

      /*
      IMPORTANT:
      due_amount = 0 is valid.
      */

      const dueAmount =
        order.due_amount !== null &&
        order.due_amount !== undefined
          ? Math.max(
              0,
              Number(
                order.due_amount
              )
            )
          : Math.max(
              0,
              total -
                paidAmount
            );

      /*
      ============================================
      PAYMENT STATUS
      ============================================
      */

      let paymentStatus =
        order.payment_status;

      if (!paymentStatus) {
        if (
          total > 0 &&
          dueAmount <= 0
        ) {
          paymentStatus =
            "Paid";
        } else if (
          paidAmount > 0 &&
          dueAmount > 0
        ) {
          paymentStatus =
            "Partially Paid";
        } else {
          paymentStatus =
            "Unpaid";
        }
      }

      /*
      ============================================
      ACTUAL PRODUCTS
      ============================================
      */

      const items =
        itemsByOrderId.get(
          order.order_id
        ) || [];

      /*
      ============================================
      LEGACY FALLBACK
      ============================================
      
      If an old order has no order_items,
      use the master order product.
      */

      const finalItems =
        items.length > 0
          ? items
          : [
              {
                productName:
                  order.product_name ||
                  "Product",

                quantity:
                  Number(
                    order.quantity ??
                      1
                  ),

                productId:
                  order.product_id,

                unitPrice:
                  Number(
                    order.product_price ??
                      0
                  ),

                lineTotal:
                  Number(
                    order.total ?? 0
                  ),
              },
            ];

      /*
      ============================================
      RETURN
      ============================================
      */

      return {
        orderId:
          order.order_id,

        customerName:
          order.customer_name,

        phone:
          order.phone,

        district:
          order.district || "",

        address:
          order.address || "",

        /*
        LEGACY PRODUCT
        */

        productName:
          order.product_name ||
          "Product",

        quantity:
          Number(
            order.quantity ?? 1
          ),

        /*
        ACTUAL ORDER ITEMS
        */

        items:
          finalItems,

        /*
        PAYMENT
        */

        total,

        paidAmount,

        dueAmount,

        paymentStatus,

        /*
        COURIER
        */

        consignmentId:
          order.consignment_id
            ? String(
                order.consignment_id
              )
            : "",
      };
    }
  );
}

/*
==================================================
PRINT LABELS PAGE
==================================================
*/

export default async function PrintLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ids?: string;
  }>;
}) {
  const params =
    await searchParams;

  /*
  ================================================
  ORDER IDS
  ================================================
  */

  const ids =
    params.ids
      ?.split(",")
      .map((id) =>
        id.trim()
      )
      .filter(Boolean) || [];

  /*
  ================================================
  GET LATEST DATABASE DATA
  ================================================
  */

  const orders =
    await getOrders(ids);

  /*
  ================================================
  KEEP SAME ORDER AS SELECTED IDS
  ================================================
  */

  const selectedOrders =
    ids
      .map((id) =>
        orders.find(
          (order) =>
            order.orderId ===
            id
        )
      )
      .filter(Boolean);

  return (
    <>
      {/* AUTO PRINT */}

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

      {/* LABELS */}

      <div
        style={{
          width: "100mm",
          margin: "0 auto",
          padding: 0,
          background: "#fff",
        }}
      >
        {selectedOrders.map(
          (order) => (
            <ShippingLabel
              key={
                order!.orderId
              }
              order={order!}
            />
          )
        )}
      </div>
    </>
  );
}