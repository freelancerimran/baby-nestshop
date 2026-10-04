"use client";

import { useEffect } from "react";

type Props = {
  productId: number;
  productName: string;
  price: number;
};

type FacebookPixelFunction = (
  command: string,
  eventName: string,
  params?: Record<string, unknown>
) => void;

export default function ViewContentPixel({
  productId,
  productName,
  price,
}: Props) {
  useEffect(() => {
    const timer = setInterval(() => {
      const fbq = (
        window as unknown as {
          fbq?: FacebookPixelFunction;
        }
      ).fbq;

      if (typeof fbq === "function") {
        fbq("track", "ViewContent", {
          content_ids: [String(productId)],
          content_name: productName,
          content_type: "product",
          value: price,
          currency: "BDT",
        });

        clearInterval(timer);
      }
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, [
    productId,
    productName,
    price,
  ]);

  return null;
}