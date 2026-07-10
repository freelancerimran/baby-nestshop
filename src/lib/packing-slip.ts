import jsPDF from "jspdf";

export const generatePackingSlip = (
  order: any
) => {
  const doc = new jsPDF();

  // Header

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
    "PACKING SLIP",
    105,
    30,
    { align: "center" }
  );

  // Order Info

  doc.setFontSize(11);
  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    `Order ID: ${order.order_id || ""}`,
    14,
    50
  );

  doc.text(
    `Customer: ${order.customer_name || ""}`,
    14,
    60
  );

  doc.text(
    `Phone: ${order.phone || ""}`,
    14,
    70
  );

  doc.text(
    `Address: ${order.address || ""}`,
    14,
    80
  );

  // Product Section

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    "PRODUCT DETAILS",
    14,
    100
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    `Product: ${
      order.product_name || ""
    }`,
    14,
    112
  );

  doc.text(
    `Quantity: ${
      order.quantity || 1
    }`,
    14,
    122
  );

  // Checklist

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    "PACKING CHECKLIST",
    14,
    145
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    "☐ Product Checked",
    14,
    158
  );

  doc.text(
    "☐ Quantity Verified",
    14,
    168
  );

  doc.text(
    "☐ Packaging Completed",
    14,
    178
  );

  doc.text(
    "☐ Courier Label Attached",
    14,
    188
  );

  // Signature

  doc.text(
    "Packed By:",
    120,
    158
  );

  doc.line(
    145,
    158,
    190,
    158
  );

  doc.text(
    "Checked By:",
    120,
    178
  );

  doc.line(
    148,
    178,
    190,
    178
  );

  // Footer

  doc.setFontSize(9);

  doc.text(
    "Generated From: Baby Nest ERP",
    14,
    285
  );

  doc.save(
    `packing-slip-${order.order_id}.pdf`
  );
};