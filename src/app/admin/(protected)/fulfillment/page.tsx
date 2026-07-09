"use client";

import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import SummaryCards from "@/components/admin/fulfillment/SummaryCards";

export default function FulfillmentPage() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingPacking: 0,
    packed: 0,
    dispatched: 0,
    delivered: 0,
    totalQty: 0,
    todayCod: 0,
  });
  const [queue, setQueue] = useState<any[]>([]);
const loadStats = async () => {
  try {
    const res = await fetch("/api/admin/fulfillment/stats");
    const data = await res.json();

    setStats({
      todayOrders: data.todayOrders || 0,
      pendingPacking: data.pendingPacking || 0,
      packed: data.packed || 0,
      dispatched: data.dispatched || 0,
      delivered: data.delivered || 0,
      totalQty: data.totalQty || 0,
      todayCod: data.todayCod || 0,
    });
  } catch (error) {
    console.error(
      "Failed to load fulfillment stats:",
      error
    );
  }
};
const loadQueue = async () => {
  try {
    const res = await fetch(
      "/api/admin/fulfillment/queue"
    );

    const data = await res.json();

    if (data.success) {
      setQueue(data.data);
    }
  } catch (error) {
    console.error(error);
  }
};
useEffect(() => {
  loadStats();
  loadQueue();
}, []);

const [scanInput, setScanInput] = useState("");
const [scanMessage, setScanMessage] = useState("");
const [scanLoading, setScanLoading] = useState(false);
const [cameraOpen, setCameraOpen] = useState(false);
const [scannerRunning, setScannerRunning] = useState(false);

const handleScan = async () => {
  if (!scanInput.trim()) return;

  try {
    setScanLoading(true);
    setScanMessage("");

    const res = await fetch(
      "/api/admin/fulfillment/scan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consignmentId: scanInput,
        }),
      }
    );

    const data = await res.json();

if (data.success) {
  setScanMessage("✅ Added To Queue");
  setScanInput("");

  await loadQueue();
  await loadStats();
} else {
      setScanMessage(
        `❌ ${data.message || "Scan Failed"}`
      );
    }
  } catch (error: any) {
  console.error("CAMERA ERROR:", error);

  setScanMessage(
    `❌ ${error?.message || "Camera Access Failed"}`
  );

  setCameraOpen(false);
  setScannerRunning(false);
} finally {
    setScanLoading(false);
  }
};
const handleDelete = async (id: number) => {
  const confirmed = window.confirm(
    "Remove this item from queue?"
  );

  if (!confirmed) return;

  try {
    const res = await fetch(
      "/api/admin/fulfillment/delete",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      loadQueue();
      loadStats();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
    alert("Delete Failed");
  }
};

const startCameraScanner = async () => {
  if (scannerRunning) return;

  try {
    setScanMessage("");
    setScannerRunning(true);
    setCameraOpen(true);

    const html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      {
        facingMode: "environment",
      },
      {
        fps: 10,
        qrbox: 250,
      },
      async (decodedText) => {
        try {
          const res = await fetch(
            "/api/admin/fulfillment/scan",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                consignmentId: decodedText,
              }),
            }
          );

          const data = await res.json();

          if (data.success) {
            setScanMessage("✅ Added To Queue");
            setScanInput("");

            await loadQueue();
            await loadStats();
          } else {
            setScanMessage(
              `❌ ${data.message || "Already Scanned"}`
            );
          }

          await html5QrCode.stop();
          await html5QrCode.clear();

          setCameraOpen(false);
          setScannerRunning(false);
        } catch (error: any) {
          console.error(
            "SCAN PROCESS ERROR:",
            error
          );

          setScanMessage(
            `❌ ${
              error?.message ||
              "Scan Failed"
            }`
          );

          setCameraOpen(false);
          setScannerRunning(false);
        }
      },
      () => {}
    );
  } catch (error: any) {
    console.error(
      "CAMERA ERROR:",
      error
    );

    setScanMessage(
      `❌ ${
        error?.message ||
        JSON.stringify(error)
      }`
    );

    setCameraOpen(false);
    setScannerRunning(false);
  }
};

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
<div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-green-100 blur-3xl" />

  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <div className="mb-3 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
        📦 Fulfillment Center
      </div>

      <h1 className="text-4xl font-bold text-gray-900">
        Warehouse Operations
      </h1>

      <p className="mt-2 text-gray-500">
        Manage packing, scanning, dispatch and courier workflow
        from one place.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Today's Orders</p>
       <h3 className="text-2xl font-bold">
  {stats.todayOrders}
</h3>
      </div>

      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Today's COD</p>
        <h3 className="text-2xl font-bold">
  ৳{stats.todayCod.toLocaleString()}
</h3>
      </div>
    </div>
  </div>
</div>

      {/* Summary Cards */}
<SummaryCards stats={stats} />

      {/* Row 1 */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Date Filter */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Date Filter
          </h2>

          <div className="grid gap-3">
            <button className="rounded-xl border p-3 text-left hover:bg-gray-50">
              Today
            </button>

            <button className="rounded-xl border p-3 text-left hover:bg-gray-50">
              Yesterday
            </button>

            <button className="rounded-xl border p-3 text-left hover:bg-gray-50">
              Last 7 Days
            </button>

            <button className="rounded-xl border p-3 text-left hover:bg-gray-50">
              Custom Range
            </button>
          </div>
        </div>

 {/* Product Summary */}
<div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-lg font-semibold">
      Product Summary
    </h2>

    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
      Today
    </span>
  </div>

  <div className="space-y-5">
    {[
      { name: "Busy Book", qty: 15, width: "100%" },
      { name: "Water Book", qty: 8, width: "55%" },
      { name: "Puzzle Book", qty: 5, width: "35%" },
      { name: "Magnetic Book", qty: 10, width: "70%" },
    ].map((item) => (
      <div key={item.name}>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium text-gray-700">
            {item.name}
          </span>

          <span className="font-semibold">
            {item.qty}
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
            style={{ width: item.width }}
          />
        </div>
      </div>
    ))}
  </div>
</div>

{/* Quick Actions */}
<div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
  <h2 className="mb-5 text-lg font-semibold">
    Quick Actions
  </h2>

  <div className="grid gap-4">
    <button className="group rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 text-left transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-xl text-white">
          📋
        </div>

        <div>
          <p className="font-semibold text-gray-900">
            Pick List
          </p>

          <p className="text-sm text-gray-500">
            Generate today's packing list
          </p>
        </div>
      </div>
    </button>

    <button className="group rounded-2xl border border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-left transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-xl text-white">
          🚚
        </div>

        <div>
          <p className="font-semibold text-gray-900">
            Dispatch Sheet
          </p>

          <p className="text-sm text-gray-500">
            Print courier handover sheet
          </p>
        </div>
      </div>
    </button>

    <button className="group rounded-2xl border border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50 p-4 text-left transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-xl text-white">
          📊
        </div>

        <div>
          <p className="font-semibold text-gray-900">
            Daily Report
          </p>

          <p className="text-sm text-gray-500">
            Export today's fulfillment report
          </p>
        </div>
      </div>
    </button>
  </div>
</div>
      </div>

{/* Premium Scan Station */}
<div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-green-100 blur-3xl" />

  <div className="relative">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          Scanner Ready
        </div>

        <h2 className="text-2xl font-bold text-gray-900">
          Scan Station
        </h2>

        <p className="mt-1 text-gray-500">
          Scan barcode or enter consignment ID manually
        </p>
      </div>

      <div className="hidden md:flex gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          USB Scanner
        </span>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          Mobile Camera
        </span>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          Manual Entry
        </span>
      </div>
    </div>

    <div className="rounded-2xl border-2 border-dashed border-green-200 bg-green-50/50 p-6">

<div className="flex flex-col gap-3 md:flex-row">
  <input
    type="text"
    value={scanInput}
    onChange={(e) =>
      setScanInput(e.target.value)
    }
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        handleScan();
      }
    }}
    placeholder={
      scanLoading
        ? "Scanning..."
        : "Scan / Enter Consignment ID"
    }
    className="h-16 flex-1 rounded-2xl border border-gray-300 bg-white px-5 text-lg outline-none focus:border-green-500"
  />

  <button
    onClick={handleScan}
    disabled={scanLoading}
    className="h-16 rounded-2xl bg-blue-600 px-6 text-white hover:bg-blue-700"
  >
    Enter
  </button>

  <button
    onClick={startCameraScanner}
    className="h-16 rounded-2xl bg-green-600 px-6 text-white hover:bg-green-700"
  >
    📷 Camera
  </button>
</div>
{cameraOpen && (
  <div className="mt-4">
<div
  id="reader"
  className="overflow-hidden rounded-2xl"
/>
  </div>
)}

{scanMessage && (
  <div className="mt-4 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium">
    {scanMessage}
  </div>
)}
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
        <span>⚡ Instant Scan Detection</span>
        <span>📦 Auto Queue Add</span>
        <span>🚚 Dispatch Ready Workflow</span>
      </div>
    </div>
  </div>
</div>

      {/* Verification Queue */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Verification Queue
          </h2>

<span className="rounded-full bg-yellow-50 px-3 py-1 text-sm text-yellow-700">
  {queue.length} Orders
</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3">Order</th>
                <th className="pb-3">Consignment ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>

<tbody>
  {queue.map((item) => (
    <tr
      key={item.id}
      className="border-b last:border-0"
    >
      <td className="py-4">
        {item.order_id}
      </td>
<td>
  {item.consignment_id}
</td>
      <td>
        {item.customer_name}
      </td>

      <td>
        {item.phone}
      </td>

      <td>
        {item.quantity}
      </td>

      <td>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            item.fulfillment_status === "packed"
              ? "bg-green-100 text-green-700"
              : item.fulfillment_status === "packing"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {item.fulfillment_status}
        </span>
      </td>
<td>
  <button
    onClick={() => handleDelete(item.id)}
    className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
  >
    Remove
  </button>
</td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Queue */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Dispatch Queue
          </h2>

<button className="rounded-2xl bg-green-600 px-5 py-3 font-medium text-white shadow-lg transition hover:bg-green-700">
  🚚 Handed To Courier
</button>
        </div>

        <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
          Packed Orders Will Appear Here
        </div>
      </div>
    </div>
  );
}