"use client";

import Barcode from "react-barcode";

interface LabelOrder {
  orderId: string;

  customerName: string;
  phone: string;
  district: string;
  address: string;

  productName: string;
  quantity: number;

  total: number;

  /*
  ========================================
  PAYMENT INFORMATION
  ========================================
  */

  paidAmount?: number;
  dueAmount?: number;
  paymentStatus?: string;

  /*
  ========================================
  COURIER INFORMATION
  ========================================
  */

  consignmentId?: string;
}

export default function ShippingLabel({
  order,
}: {
  order: LabelOrder;
}) {
  /*
  ========================================
  PAYMENT CALCULATION
  ========================================

  IMPORTANT:

  dueAmount = 0 must remain 0.

  We must NOT use:

  order.dueAmount || order.total

  because 0 is falsy and would incorrectly
  fall back to the full order total.

  ========================================
  */

  const total = Number(
    order.total ?? 0
  );

  const paidAmount = Number(
    order.paidAmount ?? 0
  );

  const dueAmount =
    order.dueAmount !== undefined &&
    order.dueAmount !== null
      ? Math.max(
          0,
          Number(order.dueAmount)
        )
      : Math.max(
          0,
          total - paidAmount
        );

  /*
  ========================================
  PAYMENT STATUS
  ========================================
  */

  const paymentStatus =
    order.paymentStatus ||
    (dueAmount <= 0 && total > 0
      ? "Paid"
      : paidAmount > 0
        ? "Partially Paid"
        : "Unpaid");

  const isFullyPaid =
    dueAmount <= 0 &&
    total > 0;

  const isPartiallyPaid =
    paidAmount > 0 &&
    dueAmount > 0;

  return (
    <div
      className="shipping-label"
      style={{
        width: "100mm",
        height: "150mm",
        border: "2px solid #000",
        pageBreakAfter: "always",
        padding: "4mm",
        boxSizing: "border-box",
        background: "#fff",
        fontFamily:
          "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          textAlign: "center",
          borderBottom:
            "2px solid #000",
          paddingBottom: "6px",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          BABY NEST
        </div>

        <div
          style={{
            fontSize: "9px",
            fontWeight: "bold",
          }}
        >
          BABY BOOKS & EDUCATIONAL TOYS
        </div>

        <div
          style={{
            fontSize: "9px",
            marginTop: "2px",
            fontWeight: "bold",
          }}
        >
          PLAY • LEARN • GROW
        </div>
      </div>

      {/* ORDER ID */}

      <div
        style={{
          textAlign: "center",
          marginTop: "6px",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            fontWeight: "bold",
          }}
        >
          ORDER ID
        </div>

        <div
          style={{
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          {order.orderId}
        </div>
      </div>

      {/* CUSTOMER */}

      <div
        style={{
          border: "1px solid #000",
          padding: "6px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            marginBottom: "4px",
          }}
        >
          SHIP TO
        </div>

        <div
          style={{
            fontSize: "18px",
            fontWeight: "700",
            lineHeight: "1.15",
          }}
        >
          {order.customerName}
        </div>

        <div
          style={{
            fontSize: "14px",
            fontWeight: "700",
            marginTop: "2px",
          }}
        >
          {order.phone}
        </div>

        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            marginTop: "6px",
            lineHeight: "1.35",
          }}
        >
          {order.address}
        </div>

        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            marginTop: "2px",
          }}
        >
          {order.district}
        </div>
      </div>

      {/* PRODUCT */}

      <div
        style={{
          border: "1px solid #000",
          marginTop: "6px",
          padding: "6px",
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: "bold",
            marginBottom: "4px",
          }}
        >
          {order.productName}
        </div>

        <div
          style={{
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          Qty: {order.quantity || 1}
        </div>
      </div>

      {/* PAYMENT / COD */}

      <div
        style={{
          marginTop: "6px",
          border: "3px solid #000",
          textAlign: "center",
          padding: "7px",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          {isFullyPaid
            ? "PAID • COD ৳0"
            : `COD ৳${dueAmount.toLocaleString()}`}
        </div>

        {isPartiallyPaid && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "10px",
              fontWeight: "bold",
            }}
          >
            PARTIAL PAYMENT RECEIVED: ৳
            {paidAmount.toLocaleString()}
          </div>
        )}

        <div
          style={{
            marginTop: "3px",
            fontSize: "9px",
            fontWeight: "600",
          }}
        >
          Order Total: ৳
          {total.toLocaleString()}
          {" • "}
          Payment: {paymentStatus}
        </div>
      </div>

      {/* BARCODE */}

      <div
        style={{
          marginTop: "8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {order.consignmentId && (
          <>
            <Barcode
              value={
                order.consignmentId
              }
              width={1.8}
              height={70}
              displayValue={false}
              margin={0}
            />

            <div
              style={{
                marginTop: "6px",
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "1px",
              }}
            >
              {order.consignmentId}
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}

      <div
        style={{
          marginTop: "auto",
          textAlign: "center",
          fontSize: "9px",
          fontWeight: "bold",
          borderTop:
            "1px solid #ddd",
          paddingTop: "4px",
        }}
      >
        THANK YOU FOR SHOPPING WITH BABY NEST
      </div>
    </div>
  );
}