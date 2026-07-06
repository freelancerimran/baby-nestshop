"use client";

import { useState } from "react";

export default function SyncAllCourierButton() {
  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleSync = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/admin/sync-all-courier-status",
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (data.success) {
        setMessage(
          `✅ ${data.updatedCount} orders updated`
        );

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setMessage(
          data.message ||
            "Sync failed"
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Sync failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 flex items-center gap-4">
      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {loading
          ? "Syncing..."
          : "🔄 Sync All Courier Status"}
      </button>

      {message && (
        <span className="text-sm font-medium">
          {message}
        </span>
      )}
    </div>
  );
}