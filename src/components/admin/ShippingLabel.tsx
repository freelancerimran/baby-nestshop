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
  consignmentId?: string;
}

export default function ShippingLabel({
  order,
}: {
  order: LabelOrder;
}) {
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
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          textAlign: "center",
          borderBottom: "2px solid #000",
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
            fontSize: "11px",
            marginTop: "4px",
            lineHeight: "1.35",
          }}
        >
        
           <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            marginTop: "2px",
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

      {/* COD */}

      <div
        style={{
          marginTop: "6px",
          border: "3px solid #000",
          textAlign: "center",
          padding: "8px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        COD ৳{order.total}
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
              value={order.consignmentId}
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
          borderTop: "1px solid #ddd",
          paddingTop: "4px",
        }}
      >
        THANK YOU FOR SHOPPING WITH BABY NEST
      </div>
    </div>
  );
}