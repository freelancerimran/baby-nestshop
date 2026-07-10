import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePickList = (
  products: any[]
) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");

  doc.text(
    "BABY NEST",
    105,
    20,
    { align: "center" }
  );

  doc.setFontSize(14);

  doc.text(
    "TODAY'S PICK LIST",
    105,
    30,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    14,
    42
  );

  let totalQty = 0;

  autoTable(doc, {
    startY: 50,

    head: [
      [
        "SL",
        "Product Name",
        "Qty",
        "Picked",
        "Checked",
      ],
    ],

    body: products.map(
      (
        item: any,
        index: number
      ) => {
        totalQty += Number(
          item.qty || 0
        );

        return [
          index + 1,
          item.name,
          item.qty,
"[ ]",
"[ ]",
        ];
      }
    ),

    styles: {
      fontSize: 10,
      cellPadding: 3,
    },

    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },

    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 100 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
    },
  });

  const finalY =
    (doc as any).lastAutoTable
      ?.finalY || 120;

  doc.setFontSize(11);
  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    `Total Products: ${products.length}`,
    14,
    finalY + 15
  );

  doc.text(
    `Total Quantity: ${totalQty}`,
    14,
    finalY + 25
  );

  doc.text(
    "Prepared By:",
    14,
    finalY + 45
  );

  doc.line(
    40,
    finalY + 45,
    90,
    finalY + 45
  );

  doc.text(
    "Checked By:",
    110,
    finalY + 45
  );

  doc.line(
    140,
    finalY + 45,
    190,
    finalY + 45
  );

  doc.save(
    `pick-list-${Date.now()}.pdf`
  );
};