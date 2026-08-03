import ShippingLabel from "@/components/admin/ShippingLabel";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==========================================
GET SELECTED ORDERS DIRECTLY FROM DATABASE
==========================================
*/

async function getOrders(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("orders")
    .select("*")
    .in("order_id", ids);

  if (error) {
    console.error(
      "PRINT LABEL ORDERS ERROR:",
      error
    );

    return [];
  }

  /*
  ========================================
  MAP DATABASE → SHIPPING LABEL
  ========================================
  */

  return (data || []).map(
    (order) => {
      const total = Number(
        order.total ?? 0
      );

      const paidAmount = Number(
        order.paid_amount ?? 0
      );

      /*
      ======================================
      IMPORTANT

      due_amount = 0 is a valid value.

      Never use:

      order.due_amount || order.total

      because 0 would incorrectly become
      the full order total.
      ======================================
      */

      const dueAmount =
        order.due_amount !== null &&
        order.due_amount !== undefined
          ? Math.max(
              0,
              Number(order.due_amount)
            )
          : Math.max(
              0,
              total - paidAmount
            );

      /*
      ======================================
      PAYMENT STATUS FALLBACK
      ======================================
      */

      let paymentStatus =
        order.payment_status;

      if (!paymentStatus) {
        if (
          total > 0 &&
          dueAmount <= 0
        ) {
          paymentStatus = "Paid";
        } else if (
          paidAmount > 0 &&
          dueAmount > 0
        ) {
          paymentStatus =
            "Partially Paid";
        } else {
          paymentStatus = "Unpaid";
        }
      }

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
          order.address,

        productName:
          order.product_name,

        quantity:
          Number(
            order.quantity ?? 1
          ),

        /*
        ====================================
        PAYMENT
        ====================================
        */

        total,

        paidAmount,

        dueAmount,

        paymentStatus,

        /*
        ====================================
        COURIER
        ====================================
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
==========================================
PRINT LABELS PAGE
==========================================
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
  ========================================
  ORDER IDS
  ========================================
  */

  const ids =
    params.ids
      ?.split(",")
      .map((id) =>
        id.trim()
      )
      .filter(Boolean) || [];

  /*
  ========================================
  GET LATEST DATABASE DATA
  ========================================
  */

  const orders =
    await getOrders(ids);

  /*
  ========================================
  KEEP SAME ORDER AS SELECTED IDS
  ========================================

  Supabase .in() does not guarantee that
  rows come back in the same order as the
  selected IDs.
  ========================================
  */

  const selectedOrders =
    ids
      .map((id) =>
        orders.find(
          (order) =>
            order.orderId === id
        )
      )
      .filter(
        (
          order
        ): order is NonNullable<
          typeof order
        > => Boolean(order)
      );

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
                order.orderId
              }
              order={order}
            />
          )
        )}
      </div>
    </>
  );
}