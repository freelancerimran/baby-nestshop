"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

export default function FacebookPixel() {
  useEffect(() => {
    initializePixel();
  }, []);

  async function initializePixel() {
    try {
      const response = await fetch(
        "/api/admin/facebook-pixel"
      );

      const settings =
        await response.json();

      const pixelId =
        settings.facebook_pixel_id;

      if (!pixelId) return;

      if (window.fbq) {
        window.fbq(
          "track",
          "PageView"
        );
        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.async = true;

      script.src =
        "https://connect.facebook.net/en_US/fbevents.js";

      document.head.appendChild(
        script
      );

      window.fbq = function (
        ...args: any[]
      ) {
        (
          window.fbq as any
        ).queue.push(args);
      };

      (
        window.fbq as any
      ).queue = [];

      (
        window.fbq as any
      ).loaded = true;

      (
        window.fbq as any
      ).version = "2.0";

      window.fbq(
        "init",
        pixelId
      );

      window.fbq(
        "track",
        "PageView"
      );
    } catch (error) {
      console.error(
        "Facebook Pixel Error:",
        error
      );
    }
  }

  return null;
}