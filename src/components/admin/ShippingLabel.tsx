"use client";

import Barcode from "react-barcode";

interface LabelItem {
  id?: number | string | null;
  productId?: string | number | null;
  productName: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  matchedProductId?: string | number | null;
}

interface LabelOrder {
  orderId: string;

  customerName: string;
  phone: string;
  district: string;
  address: string;

  /*
  ========================================
  LEGACY PRODUCT INFORMATION
  ========================================

  Kept for backward compatibility.
  Multiple-product orders will use items.
  ========================================
  */

  productName: string;
  quantity: number;

  /*
  ========================================
  ACTUAL ORDER ITEMS
  ========================================
  */

  items?: LabelItem[];

  /*
  ========================================
  PAYMENT INFORMATION
  ========================================
  */

  total: number;

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

/*
========================================
HELPER
========================================
*/

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString(
    "en-US"
  );
}

/*
========================================
SHIPPING LABEL
========================================
*/

export default function ShippingLabel({
  order,
}: {
  order: LabelOrder;
}) {
  /*
  ======================================
  PAYMENT CALCULATION
  ======================================
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
  ======================================
  PAYMENT STATUS
  ======================================
  */

  const paymentStatus =
    order.paymentStatus ||
    (dueAmount <= 0 &&
    total > 0
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

  /*
  ======================================
  PRODUCT ITEMS
  ======================================

  If items exist, use the real products.

  Otherwise fall back to the old
  single-product structure.
  ======================================
  */

  const items =
    order.items &&
    order.items.length > 0
      ? order.items
      : [
          {
            productName:
              order.productName ||
              "Product",

            quantity:
              Number(
                order.quantity ?? 1
              ),
          },
        ];

  const isMultipleProducts =
    items.length > 1;

  /*
  ======================================
  TOTAL ITEM QUANTITY
  ======================================
  */

  const totalItemQuantity =
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  return (
    <div
      className="shipping-label"
      style={{
        width: "100mm",
        minHeight: "150mm",
        border: "1.5px solid #111",
        pageBreakAfter:
          "always",
        padding: "4mm",
        boxSizing: "border-box",
        background: "#fff",
        color: "#111",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        display: "flex",
        flexDirection:
          "column",
        overflow: "hidden",
      }}
    >
      {/* =================================
          HEADER
          ================================= */}

      <div
        style={{
          textAlign: "center",
          borderBottom:
            "1.5px solid #111",
          paddingBottom:
            "5px",
        }}
      >
        <div
          style={{
            fontSize: "21px",
            fontWeight: "800",
            letterSpacing:
              "1.2px",
            lineHeight: "1",
          }}
        >
          BABY NEST
        </div>

        <div
          style={{
            fontSize: "8px",
            fontWeight: "700",
            letterSpacing:
              "0.3px",
            marginTop: "4px",
          }}
        >
          BABY BOOKS & EDUCATIONAL TOYS
        </div>

        <div
          style={{
            fontSize: "8px",
            marginTop: "2px",
            fontWeight: "700",
            letterSpacing:
              "0.5px",
          }}
        >
          PLAY • LEARN • GROW
        </div>
      </div>

      {/* =================================
          ORDER ID
          ================================= */}

      <div
        style={{
          textAlign: "center",
          paddingTop: "5px",
          paddingBottom: "5px",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            fontWeight: "700",
            letterSpacing:
              "0.7px",
          }}
        >
          ORDER ID
        </div>

        <div
          style={{
            fontSize: "15px",
            fontWeight: "800",
            marginTop: "2px",
            letterSpacing:
              "0.4px",
          }}
        >
          {order.orderId}
        </div>
      </div>

      {/* =================================
          SHIP TO
          ================================= */}

      <div
        style={{
          border:
            "1px solid #333",
          borderRadius:
            "2px",
          padding: "6px",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            fontWeight: "800",
            letterSpacing:
              "0.7px",
            marginBottom:
              "4px",
          }}
        >
          SHIP TO
        </div>

        <div
          style={{
            fontSize: "16px",
            fontWeight: "800",
            lineHeight: "1.1",
          }}
        >
          {order.customerName}
        </div>

        <div
          style={{
            fontSize: "12px",
            fontWeight: "700",
            marginTop: "3px",
          }}
        >
          {order.phone}
        </div>

        <div
          style={{
            fontSize: "11px",
            fontWeight: "600",
            marginTop: "5px",
            lineHeight: "1.3",
          }}
        >
          {order.address}
        </div>

        {order.district && (
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              marginTop: "2px",
            }}
          >
            {order.district}
          </div>
        )}
      </div>

      {/* =================================
          PRODUCTS
          ================================= */}

      <div
        style={{
          border:
            "1px solid #333",
          borderRadius:
            "2px",
          marginTop: "6px",
          overflow: "hidden",
        }}
      >
        {/* PRODUCT HEADER */}

        <div
          style={{
            padding:
              "5px 6px",
            background:
              "#f4f4f4",
            borderBottom:
              "1px solid #333",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              fontWeight: "800",
              letterSpacing:
                "0.7px",
            }}
          >
            {isMultipleProducts
              ? "ORDER ITEMS"
              : "PRODUCT"}
          </div>

          <div
            style={{
              fontSize: "8px",
              fontWeight: "700",
            }}
          >
            {totalItemQuantity}{" "}
            {totalItemQuantity === 1
              ? "ITEM"
              : "ITEMS"}
          </div>
        </div>

        {/* PRODUCT ROWS */}

        <div>
          {items.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.id ??
                  `${item.productId}-${index}`
                }
                style={{
                  display:
                    "flex",
                  alignItems:
                    "flex-start",
                  justifyContent:
                    "space-between",
                  gap: "8px",
                  padding:
                    "5px 6px",
                  borderBottom:
                    index <
                    items.length -
                      1
                      ? "1px solid #ddd"
                      : "none",
                }}
              >
                {/* PRODUCT NAME */}

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize:
                      items.length >
                      3
                        ? "9px"
                        : "10px",
                    fontWeight:
                      "700",
                    lineHeight:
                      "1.25",
                  }}
                >
                  {item.productName}
                </div>

                {/* QUANTITY */}

                <div
                  style={{
                    flexShrink: 0,
                    minWidth:
                      "32px",
                    textAlign:
                      "right",
                    fontSize:
                      "10px",
                    fontWeight:
                      "800",
                  }}
                >
                  ×{" "}
                  {Number(
                    item.quantity ||
                      0
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* =================================
          PAYMENT / COD
          ================================= */}

      <div
        style={{
          marginTop: "6px",
          border:
            "2px solid #111",
          borderRadius:
            "2px",
          textAlign:
            "center",
          padding:
            "6px 5px",
        }}
      >
        <div
          style={{
            fontSize: "19px",
            fontWeight: "800",
            letterSpacing:
              "0.3px",
          }}
        >
          {isFullyPaid
            ? "PAID • COD ৳0"
            : `COD ৳${formatMoney(
                dueAmount
              )}`}
        </div>

        {isPartiallyPaid && (
          <div
            style={{
              marginTop:
                "3px",
              fontSize: "8px",
              fontWeight:
                "700",
            }}
          >
            PAID ৳
            {formatMoney(
              paidAmount
            )}
            {" • "}
            DUE ৳
            {formatMoney(
              dueAmount
            )}
          </div>
        )}

        <div
          style={{
            marginTop:
              "3px",
            fontSize: "8px",
            fontWeight:
              "600",
          }}
        >
          Order Total: ৳
          {formatMoney(
            total
          )}
          {" • "}
          Payment:{" "}
          {paymentStatus}
        </div>
      </div>

      {/* =================================
          BARCODE
          ================================= */}

      {order.consignmentId && (
        <div
          style={{
            marginTop:
              "7px",
            display:
              "flex",
            flexDirection:
              "column",
            alignItems:
              "center",
            justifyContent:
              "center",
          }}
        >
          <Barcode
            value={String(
              order.consignmentId
            )}
            width={2.1}
            height={70}
            displayValue={
              false
            }
            margin={0}
            background="#ffffff"
          />

          <div
            style={{
              marginTop:
                "4px",
              fontSize:
                "16px",
              fontWeight:
                "800",
              letterSpacing:
                "1px",
              lineHeight:
                "1",
            }}
          >
            {
              order.consignmentId
            }
          </div>
        </div>
      )}

      {/* =================================
          FOOTER
          ================================= */}

      <div
        style={{
          marginTop:
            "auto",
          paddingTop:
            "5px",
          borderTop:
            "1px solid #ddd",
          textAlign:
            "center",
          fontSize:
            "8px",
          fontWeight:
            "700",
          letterSpacing:
            "0.2px",
        }}
      >
        THANK YOU FOR SHOPPING WITH BABY NEST
      </div>
    </div>
  );
}