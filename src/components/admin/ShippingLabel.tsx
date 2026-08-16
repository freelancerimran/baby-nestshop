"use client";

import React from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";

interface ProductItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface ShippingLabelProps {
  orderId: string;
  date: string;
  customerName: string;
  phone: string;
  district: string;
  address: string;
  deliveryArea?: string;
  deliveryCharge?: number;
  total?: number;
  paidAmount?: number;
  dueAmount?: number;
  consignmentId?: string;
  products: ProductItem[];
}

function formatDate(date: string) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

export default function ShippingLabel({
  orderId,
  date,
  customerName,
  phone,
  district,
  address,
  deliveryArea,
  deliveryCharge = 0,
  total = 0,
  paidAmount = 0,
  dueAmount,
  consignmentId,
  products,
}: ShippingLabelProps) {
  const trackingId = consignmentId?.trim() || orderId;

  const calculatedProductTotal = products.reduce(
    (sum, product) => sum + Number(product.lineTotal || 0),
    0
  );

  const finalTotal =
    Number(total || 0) ||
    calculatedProductTotal + Number(deliveryCharge || 0);

  const finalDue =
    dueAmount !== undefined
      ? Number(dueAmount || 0)
      : Math.max(0, finalTotal - Number(paidAmount || 0));

  const qrValue =
    `https://www.baby-nestshop.com/track-order?order=${encodeURIComponent(
      orderId
    )}`;

  return (
    <div className="shipping-label relative box-border h-[150mm] w-[100mm] overflow-hidden bg-white text-black font-sans">
      <div className="flex h-full w-full flex-col px-[5mm] py-[3.5mm]">

        {/* =========================================================
            HEADER
        ========================================================== */}
        <div className="flex items-start justify-between border-b-[0.6px] border-black pb-[2mm]">

          {/* BRAND */}
          <div>
            <div className="text-[23px] font-black leading-none tracking-[-0.9px]">
              BABY NEST
            </div>

            <div className="mt-[1.2mm] text-[8.5px] font-bold uppercase tracking-[1.6px]">
              Baby Books & Toys
            </div>
          </div>

          {/* QR + ORDER INFO */}
          <div className="flex items-start gap-[2.2mm]">

            {/* QR CODE */}
            <QRCodeSVG
              value={qrValue}
              size={76}
              level="M"
              includeMargin={false}
            />

            {/* ORDER INFO */}
            <div className="text-right">

              <div className="inline-block border-[1px] border-black px-[2.5mm] py-[1.2mm] text-[9.5px] font-black uppercase leading-none">
                Parcel
              </div>

              {/* ORDER ID */}
              <div className="mt-[1.5mm]">
                <div className="text-[7px] font-black uppercase tracking-[0.9px]">
                  Order ID
                </div>

                <div className="mt-[0.6mm] max-w-[31mm] break-all text-[9px] font-black leading-tight">
                  {orderId}
                </div>
              </div>

              {/* DATE */}
              <div className="mt-[1.2mm]">
                <div className="text-[7px] font-black uppercase tracking-[0.9px]">
                  Date
                </div>

                <div className="mt-[0.5mm] text-[8.5px] font-bold">
                  {formatDate(date)}
                </div>
              </div>

            </div>
          </div>
        </div>


        {/* =========================================================
            FROM / TO
        ========================================================== */}
        <div className="mt-[2.5mm] grid grid-cols-[0.8fr_1.2fr] gap-[3mm]">

          {/* FROM */}
          <div>
            <div className="mb-[0.8mm] text-[7.5px] font-black uppercase tracking-[1.1px]">
              From
            </div>

            <div className="text-[11px] font-black leading-tight">
              Baby Nest
            </div>

            <div className="mt-[0.6mm] text-[8.5px] leading-tight">
              Bangladesh
            </div>
          </div>


          {/* TO */}
          <div className="border-l-[0.6px] border-black pl-[3mm]">

            <div className="mb-[0.8mm] text-[7.5px] font-black uppercase tracking-[1.1px]">
              To
            </div>

            <div className="text-[14px] font-black leading-tight">
              {customerName}
            </div>

            <div className="mt-[0.6mm] text-[10px] font-bold">
              {phone}
            </div>

            <div className="mt-[0.6mm] text-[8.5px] leading-tight">
              {address}
            </div>

            <div className="mt-[0.6mm] text-[8.5px] font-bold">
              {district}
              {deliveryArea ? ` • ${deliveryArea}` : ""}
            </div>

          </div>
        </div>


        {/* =========================================================
            PRODUCTS
        ========================================================== */}
        <div className="mt-[2.5mm] border-y-[0.6px] border-black py-[1.8mm]">

          <div className="mb-[1.2mm] text-[7.5px] font-black uppercase tracking-[1.1px]">
            Products
          </div>

          {/* PRODUCT HEADER */}
          <div className="grid grid-cols-[1fr_9mm_17mm_19mm] gap-[1mm] border-b-[0.6px] border-black pb-[0.8mm] text-[7.5px] font-black uppercase">

            <div>
              Product
            </div>

            <div className="text-center">
              Qty
            </div>

            <div className="text-right">
              Unit
            </div>

            <div className="text-right">
              Total
            </div>

          </div>


          {/* PRODUCTS */}
          <div className="mt-[1mm] space-y-[1.2mm]">

            {products.map((product, index) => (
              <div
                key={`${product.productName}-${index}`}
                className="grid grid-cols-[1fr_9mm_17mm_19mm] gap-[1mm] text-[8.5px] leading-tight"
              >

                <div className="pr-[1mm] font-bold">
                  {product.productName}
                </div>

                <div className="text-center font-bold">
                  {product.quantity}
                </div>

                <div className="text-right font-bold">
                  {money(product.unitPrice)}
                </div>

                <div className="text-right font-black">
                  {money(product.lineTotal)}
                </div>

              </div>
            ))}

          </div>
        </div>


        {/* =========================================================
            TOTAL
        ========================================================== */}
        <div className="mt-[2mm]">

          {/* PRODUCT TOTAL */}
          <div className="flex items-center justify-between text-[8.5px]">

            <span className="font-bold">
              Product Total
            </span>

            <span className="font-black">
              {money(calculatedProductTotal)}
            </span>

          </div>


          {/* DELIVERY CHARGE */}
          {Number(deliveryCharge || 0) > 0 && (
            <div className="mt-[0.8mm] flex items-center justify-between text-[8.5px]">

              <span className="font-bold">
                Delivery Charge
              </span>

              <span className="font-black">
                {money(deliveryCharge)}
              </span>

            </div>
          )}


          {/* COD AMOUNT */}
          <div className="mt-[1.2mm] flex items-center justify-between border-t-[0.6px] border-black pt-[1.2mm]">

            <span className="text-[10.5px] font-black uppercase">
              COD Amount
            </span>

            <span className="text-[18px] font-black leading-none">
              {money(finalDue)}
            </span>

          </div>

        </div>


        {/* =========================================================
            CONSIGNMENT
        ========================================================== */}
        <div className="mt-[2mm] border-t-[0.6px] border-black pt-[1.5mm] text-center">

          {/* TITLE */}
          <div className="text-[7.5px] font-black uppercase tracking-[1.5px]">
            Consignment ID
          </div>

          {/* ID */}
          <div className="mt-[0.5mm] text-[16px] font-black tracking-[0.8px]">
            {trackingId}
          </div>

          {/* BARCODE */}
          <div className="mt-[0.7mm] flex justify-center overflow-hidden">

            <Barcode
              value={trackingId}
              width={2.2}
              height={45}
              format="CODE128"
              displayValue={false}
              margin={0}
              background="#ffffff"
            />

          </div>

        </div>


        {/* =========================================================
            THANK YOU
        ========================================================== */}
        <div className="mt-auto overflow-hidden rounded-[2mm] bg-black px-[4mm] py-[2.8mm] text-center text-white">

          <div className="text-[15px] font-black uppercase tracking-[1px]">
            THANK YOU
          </div>

          <div className="mt-[0.8mm] text-[7px] font-medium uppercase tracking-[1.5px]">
            For Shopping With Baby Nest
          </div>

          <div className="mt-[0.8mm] text-[6.5px] font-medium uppercase tracking-[1.1px]">
            We Appreciate Your Trust & Support
          </div>

        </div>

      </div>


      {/* =========================================================
          PRINT CSS
      ========================================================== */}
      <style jsx>{`
        @page {
          size: 100mm 150mm;
          margin: 0;
        }

        :global(html),
        :global(body) {
          margin: 0 !important;
          padding: 0 !important;
        }

        /*
         * Every ShippingLabel is treated as a separate
         * physical print page.
         */
        .shipping-label {
          width: 100mm;
          height: 150mm;
          min-width: 100mm;
          max-width: 100mm;
          min-height: 150mm;
          max-height: 150mm;

          page-break-after: always;
          page-break-inside: avoid;

          break-after: page;
          break-inside: avoid;
        }

        /*
         * The first label should start immediately.
         */
        .shipping-label:first-child {
          page-break-before: auto;
          break-before: auto;
        }

        /*
         * Every label after the first one starts
         * on a completely fresh physical page.
         */
        .shipping-label:not(:first-child) {
          page-break-before: always;
          break-before: page;
        }

        /*
         * Last label should not create an extra blank page.
         */
        .shipping-label:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        @media print {
          :global(html),
          :global(body) {
            width: 100mm !important;
            min-width: 100mm !important;
            max-width: 100mm !important;

            height: auto !important;

            margin: 0 !important;
            padding: 0 !important;
          }

          .shipping-label {
            width: 100mm !important;
            height: 150mm !important;

            min-width: 100mm !important;
            max-width: 100mm !important;

            min-height: 150mm !important;
            max-height: 150mm !important;

            margin: 0 !important;
            padding: 0 !important;

            overflow: hidden !important;

            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .shipping-label:not(:first-child) {
            page-break-before: always !important;
            break-before: page !important;
          }

          .shipping-label:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}