"use client";

import ShippingLabel from "./ShippingLabel";

interface Order {
  orderId: string;

  customerName: string;
  phone: string;
  district: string;
  address: string;

  productName: string;
  quantity: number;

  total: number;

  consignmentId?: string;

  /*
  Optional fields.
  These may already exist in some order responses.
  */

  date?: string;

  deliveryArea?: string;

  deliveryCharge?: number;

  productPrice?: number;

  paidAmount?: number;

  dueAmount?: number;
}

interface Props {
  orders: Order[];
  onClose: () => void;
}

export default function PrintLabelsModal({
  orders,
  onClose,
}: Props) {
  /*
  ==================================================
  PRINT
  ==================================================
  */

  const handlePrint = () => {
    const labelsContainer =
      document.querySelector(".print-area");

    if (!labelsContainer) {
      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Baby Nest Labels</title>

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 100mm;
            }

            body {
              font-family: Arial, sans-serif;
              background: #ffffff;
            }

            @page {
              size: 100mm 150mm;
              margin: 0;
            }

            .shipping-label {
              width: 100mm !important;
              height: 148mm !important;

              min-width: 100mm !important;
              max-width: 100mm !important;

              min-height: 148mm !important;
              max-height: 148mm !important;

              overflow: hidden !important;

              page-break-after: always;
              break-after: page;
            }

            .shipping-label:last-child {
              page-break-after: auto;
              break-after: auto;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>

        <body>
          ${labelsContainer.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 700);
  };

  /*
  ==================================================
  RENDER
  ==================================================
  */

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-6">

      <div className="mx-auto max-w-6xl rounded-xl bg-white p-6">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold">
              Print Labels
            </h2>

            <p className="text-sm text-gray-500">
              Total Labels: {orders.length}
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-green-600 px-5 py-2 text-white transition hover:bg-green-700"
            >
              Print
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-600 px-5 py-2 text-white transition hover:bg-gray-700"
            >
              Close
            </button>

          </div>

        </div>

        {/* ==========================================
            LABEL PREVIEW
        ========================================== */}

        <div className="print-area flex flex-col">

          {orders.map((order) => {

            /*
            ========================================
            QUANTITY
            ========================================
            */

            const quantity =
              Number(
                order.quantity ?? 1
              );

            /*
            ========================================
            PRODUCT PRICE
            ========================================

            If productPrice is available,
            use it.

            Otherwise we use the order total
            as the legacy line total.
            ========================================
            */

            const productPrice =
              Number(
                order.productPrice ?? 0
              );

            /*
            ========================================
            PRODUCT LINE TOTAL
            ========================================
            */

            const lineTotal =
              productPrice > 0
                ? productPrice * quantity
                : Number(
                    order.total ?? 0
                  );

            /*
            ========================================
            PAYMENT
            ========================================
            */

            const total =
              Number(
                order.total ?? 0
              );

            const paidAmount =
              Number(
                order.paidAmount ?? 0
              );

            const dueAmount =
              order.dueAmount !==
                undefined
                ? Number(
                    order.dueAmount ?? 0
                  )
                : Math.max(
                    0,
                    total -
                      paidAmount
                  );

            /*
            ========================================
            DELIVERY CHARGE
            ========================================
            */

            const deliveryCharge =
              Number(
                order.deliveryCharge ?? 0
              );

            /*
            ========================================
            PRODUCTS
            ========================================
            */

            const products = [
              {
                productName:
                  order.productName ||
                  "Product",

                quantity,

                unitPrice:
                  productPrice,

                lineTotal,
              },
            ];

            return (
              <ShippingLabel
                key={order.orderId}

                /*
                ----------------------------------
                ORDER
                ----------------------------------
                */

                orderId={
                  order.orderId
                }

                date={
                  order.date || ""
                }

                /*
                ----------------------------------
                CUSTOMER
                ----------------------------------
                */

                customerName={
                  order.customerName ||
                  ""
                }

                phone={
                  order.phone || ""
                }

                district={
                  order.district || ""
                }

                address={
                  order.address || ""
                }

                /*
                ----------------------------------
                DELIVERY
                ----------------------------------
                */

                deliveryArea={
                  order.deliveryArea || ""
                }

                deliveryCharge={
                  deliveryCharge
                }

                /*
                ----------------------------------
                PAYMENT
                ----------------------------------
                */

                total={
                  total
                }

                paidAmount={
                  paidAmount
                }

                dueAmount={
                  dueAmount
                }

                /*
                ----------------------------------
                COURIER
                ----------------------------------
                */

                consignmentId={
                  order.consignmentId ||
                  ""
                }

                /*
                ----------------------------------
                PRODUCTS
                ----------------------------------
                */

                products={
                  products
                }
              />
            );
          })}

        </div>

      </div>

    </div>
  );
}