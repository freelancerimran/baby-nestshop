"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type Props = {
  productId: number;
  productName: string;
  price: number;
};

export default function ViewContentPixel({
  productId,
  productName,
  price,
}: Props) {
  useEffect(() => {
    const timer = setInterval(
      () => {
        if (
          typeof window.fbq ===
          "function"
        ) {
          window.fbq(
            "track",
            "ViewContent",
            {
              content_ids: [
                String(productId),
              ],
              content_name:
                productName,
              content_type:
                "product",
              value: price,
              currency: "BDT",
            }
          );

          clearInterval(timer);
        }
      },
      500
    );

    return () =>
      clearInterval(timer);
  }, [
    productId,
    productName,
    price,
  ]);

  return null;
}