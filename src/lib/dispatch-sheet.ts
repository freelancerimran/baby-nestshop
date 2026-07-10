import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateDispatchSheet = (
  orders: any[]
) => {
  const doc = new jsPDF({
    orientation: "landscape",
  });

  // ======================
  // Header
  // ======================

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");

  doc.text(
    "BABY NEST WAREHOUSE",
    148,
    18,
    { align: "center" }
  );

  doc.setFontSize(14);

  doc.text(
    "Courier Dispatch Sheet",
    148,
    28,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const now = new Date();

  doc.text(
    `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    14,
    38
  );

  // ======================
  // Table Data
  // ======================

  let totalQty = 0;

  const rows = orders.map(
    (item: any, index: number) => {
      const qty = Number(
        item.quantity || 1
      );

      totalQty += qty;

      return [
        index + 1,
        item.order_id || "",
        item.consignment_id || "",
        item.customer_name || "",
        item.phone || "",
        item.address || "",
        qty,
        (
          item.fulfillment_status ||
          "Dispatched"
        )
          .toString()
          .replace(
            /^./,
            (c: string) =>
              c.toUpperCase()
          ),
      ];
    }
  );

  // ======================
  // Table
  // ======================

  autoTable(doc, {
    startY: 45,

    head: [
      [
        "SL",
        "Order ID",
        "Consignment ID",
        "Customer",
        "Phone",
        "Address",
        "Qty",
        "Status",
      ],
    ],

    body: rows,

    styles: {
      fontSize: 9,
      cellPadding: 2,
      valign: "middle",
    },

    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: "bold",
    },

    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
      5: { cellWidth: 80 },
      6: { cellWidth: 15 },
      7: { cellWidth: 25 },
    },
  });

  const finalY =
    (doc as any).lastAutoTable
      ?.finalY || 120;

  // ======================
  // Summary
  // ======================

  doc.setFontSize(11);
  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    `Total Orders: ${orders.length}`,
    14,
    finalY + 12
  );

  doc.text(
    `Total Qty: ${totalQty}`,
    14,
    finalY + 20
  );

  // ======================
  // Courier Handover Box
  // ======================

  doc.roundedRect(
    14,
    finalY + 28,
    120,
    28,
    2,
    2
  );

  doc.setFontSize(10);
  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    "Courier Handover Information",
    18,
    finalY + 36
  );

  doc.text(
    "Courier Name: ___________________",
    18,
    finalY + 46
  );

  doc.text(
    "Received Time: __________________",
    18,
    finalY + 54
  );

  // ======================
  // Signature Section
  // ======================

  doc.text(
    "Prepared By:",
    170,
    finalY + 40
  );

  doc.line(
    195,
    finalY + 40,
    250,
    finalY + 40
  );

  doc.text(
    "Courier Received By:",
    170,
    finalY + 52
  );

  doc.line(
    215,
    finalY + 52,
    280,
    finalY + 52
  );

  doc.text(
    "Signature:",
    170,
    finalY + 64
  );

  doc.line(
    190,
    finalY + 64,
    250,
    finalY + 64
  );

  // ======================
  // Footer
  // ======================

  const pageHeight =
    doc.internal.pageSize.height;

  doc.setFontSize(9);

  doc.text(
    "Generated From: Baby Nest ERP",
    14,
    pageHeight - 10
  );

  doc.text(
    `Page 1 of 1`,
    255,
    pageHeight - 10
  );

  // ======================
  // Save PDF
  // ======================

  doc.save(
    `dispatch-sheet-${Date.now()}.pdf`
  );
};