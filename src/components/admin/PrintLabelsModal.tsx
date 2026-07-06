
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
}

interface Props {
  orders: Order[];
  onClose: () => void;
}

export default function PrintLabelsModal({
  orders,
  onClose,
}: Props) {
  const handlePrint = () => {
    const labelsContainer =
      document.querySelector(".print-area");

    if (!labelsContainer) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=800"
    );

    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Baby Nest Labels</title>

        <style>
          *{
            box-sizing:border-box;
          }

          body{
            margin:0;
            padding:0;
            font-family:Arial, sans-serif;
          }

          @page{
            size:100mm 150mm;
            margin:0;
          }

          .shipping-label{
            width:100mm;
            height:148mm;

            overflow:hidden;

            page-break-after:always;
            break-after:page;
          }

          .shipping-label:last-child{
            page-break-after:auto;
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-6">

      <div className="mx-auto max-w-6xl rounded-xl bg-white p-6">

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
              onClick={handlePrint}
              className="rounded-lg bg-green-600 px-5 py-2 text-white"
            >
              Print
            </button>

            <button
              onClick={onClose}
              className="rounded-lg bg-gray-600 px-5 py-2 text-white"
            >
              Close
            </button>

          </div>

        </div>

        <div className="print-area flex flex-col">

          {orders.map((order) => (
            <ShippingLabel
              key={order.orderId}
              order={order}
            />
          ))}

        </div>

      </div>

    </div>
  );
}