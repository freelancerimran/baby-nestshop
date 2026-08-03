import OrdersTable from "@/components/admin/OrdersTable";
import SyncAllCourierButton from "@/components/admin/SyncAllCourierButton";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
==========================================
GET ORDERS DIRECTLY FROM DATABASE
==========================================
*/

async function getOrders() {
  try {
    const { data, error } =
      await supabaseAdmin
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "ORDERS PAGE SUPABASE ERROR:",
        error
      );

      return [];
    }

    return (data || []).map(
      (order) => {
        /*
        ====================================
        PAYMENT VALUES
        ====================================
        */

        const total =
          Number(order.total || 0);

        const paidAmount =
          Number(
            order.paid_amount || 0
          );

        /*
        IMPORTANT:
        due_amount = 0 is a valid value.

        Therefore we must NOT use:
        order.due_amount || total

        because 0 would incorrectly become
        the full order total.
        */

        const dueAmount =
          order.due_amount !== null &&
          order.due_amount !== undefined
            ? Number(
                order.due_amount
              )
            : Math.max(
                0,
                total - paidAmount
              );

        /*
        ====================================
        RETURN UI-SAFE ORDER
        ====================================
        */

        return {
          orderId:
            order.order_id,

          date:
            order.order_date,

          productId:
            order.product_id,

          productName:
            order.product_name,

          productSlug:
            order.product_slug,

          customerName:
            order.customer_name,

          phone:
            order.phone,

          district:
            order.district,

          deliveryArea:
            order.delivery_area,

          address:
            order.address,

          deliveryCharge:
            Number(
              order.delivery_charge || 0
            ),

          discount:
            Number(
              order.discount || 0
            ),

          couponCode:
            order.coupon_code || "",

          quantity:
            Number(
              order.quantity || 0
            ),

          productPrice:
            Number(
              order.product_price || 0
            ),

          total,

          /*
          ==================================
          PAYMENT INFORMATION
          ==================================
          */

          paidAmount,

          dueAmount,

          paymentStatus:
            order.payment_status ||
            "Unpaid",

          /*
          ==================================
          ORDER STATUS
          ==================================
          */

          status:
            order.status || "Pending",

          /*
          ==================================
          COURIER INFORMATION
          ==================================
          */

          trackingCode:
            order.tracking_code || "",

          consignmentId:
            order.consignment_id || "",

          courierStatus:
            order.courier_status || "",

          lastStatusSync:
            order.last_status_sync || null,
        };
      }
    );
  } catch (error) {
    console.error(
      "ORDERS PAGE ERROR:",
      error
    );

    return [];
  }
}

/*
==========================================
ORDERS PAGE
==========================================
*/

export default async function OrdersPage() {
  const orders =
    await getOrders();

  return (
    <div className="p-6">
      <h1 className="mb-4 text-3xl font-bold">
        Orders
      </h1>

      <SyncAllCourierButton />

      <OrdersTable
        orders={orders}
      />
    </div>
  );
}