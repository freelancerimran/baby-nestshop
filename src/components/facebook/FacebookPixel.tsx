"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export default function FacebookPixel() {
  useEffect(() => {
    loadPixel();
  }, []);

  async function loadPixel() {
    try {
      const response = await fetch(
        "/api/admin/facebook-pixel"
      );

      const settings =
        await response.json();

      const pixelId =
        settings.facebook_pixel_id;

      if (!pixelId) return;

      if (
        document.getElementById(
          "facebook-pixel-script"
        )
      ) {
        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.id =
        "facebook-pixel-script";

      script.async = true;

      script.src =
        "https://connect.facebook.net/en_US/fbevents.js";

      script.onload = () => {
        if (
          typeof window.fbq ===
          "function"
        ) {
          window.fbq(
            "init",
            pixelId
          );

          window.fbq(
            "track",
            "PageView"
          );
        }
      };

      document.head.appendChild(
        script
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