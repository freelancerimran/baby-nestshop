"use client";

import { useEffect, useState } from "react";

export default function FacebookPixelPage() {
  const [pixelId, setPixelId] =
    useState("");

  const [accessToken, setAccessToken] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch(
        "/api/admin/facebook-pixel"
      );

      const data =
        await response.json();

      setPixelId(
        data.facebook_pixel_id || ""
      );

      setAccessToken(
        data.facebook_access_token || ""
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);

      const response = await fetch(
        "/api/admin/facebook-pixel",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            facebook_pixel_id:
              pixelId,
            facebook_access_token:
              accessToken,
          }),
        }
      );

      const result =
        await response.json();

      if (result.success) {
        alert(
          "Facebook Pixel Saved Successfully"
        );
      } else {
        alert(
          "Failed to Save Settings"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">
        Facebook Pixel
      </h1>

      <p className="mb-8 text-gray-500">
        Configure Meta Pixel &
        Conversion API
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Facebook Pixel ID
            </label>

            <input
              type="text"
              value={pixelId}
              onChange={(e) =>
                setPixelId(
                  e.target.value
                )
              }
              placeholder="123456789012345"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Conversion API Access Token
            </label>

            <textarea
              value={accessToken}
              onChange={(e) =>
                setAccessToken(
                  e.target.value
                )
              }
              rows={6}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}