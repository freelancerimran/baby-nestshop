"use client";

import { useState } from "react";

interface Props {
  selectedOrders: string[];
  orders: {
    orderId: string;
    consignmentId?: string;
  }[];
  onClose: () => void;
}

export default function BulkCourierModal({
  selectedOrders,
  orders,
  onClose,
}: Props) {
  const [processing, setProcessing] =
    useState(false);

  const [completed, setCompleted] =
    useState(0);

  const [successCount, setSuccessCount] =
    useState(0);

  const [failedCount, setFailedCount] =
    useState(0);

  const [failedOrders, setFailedOrders] =
    useState<string[]>([]);

  const handleStart = async () => {
    setProcessing(true);

    let success = 0;
    let failed = 0;

    const failedList: string[] = [];

    for (
      let i = 0;
      i < selectedOrders.length;
      i++
    ) {
      const orderId =
        selectedOrders[i];

      const order = orders.find(
        (o) =>
          o.orderId === orderId
      );

      if (order?.consignmentId) {
        failed++;
        failedList.push(
          `${orderId} (Already Sent)`
        );

        setCompleted(i + 1);
        continue;
      }

      try {
        const response =
          await fetch(
            "/api/admin/send-to-courier",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                orderId,
              }),
            }
          );

        const data =
          await response.json();

        if (data.success) {
          success++;
        } else {
          failed++;
          failedList.push(
            `${orderId} (${
              data.message ||
              "Failed"
            })`
          );
        }
      } catch {
        failed++;
        failedList.push(
          `${orderId} (Network Error)`
        );
      }

      setCompleted(i + 1);
    }

    setSuccessCount(success);
    setFailedCount(failed);
    setFailedOrders(failedList);

    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg rounded-xl bg-white p-6">

        <div className="mb-4 flex items-center justify-between">

          <h2 className="text-xl font-bold">
            Bulk Courier Send
          </h2>

          <button
            onClick={onClose}
            className="rounded bg-gray-200 px-3 py-1"
          >
            ✕
          </button>

        </div>

        <div className="space-y-4">

          <div>
            Total Selected:
            {" "}
            {selectedOrders.length}
          </div>

          <div>
            Progress:
            {" "}
            {completed}
            {" / "}
            {selectedOrders.length}
          </div>

          <div>
            Success:
            {" "}
            {successCount}
          </div>

          <div>
            Failed:
            {" "}
            {failedCount}
          </div>

          {!processing &&
            completed === 0 && (
              <button
                onClick={handleStart}
                className="w-full rounded-lg bg-green-600 px-4 py-3 text-white"
              >
                Start Sending
              </button>
            )}

          {processing && (
            <div className="rounded bg-blue-50 p-4">

              <div className="mb-2">
                Sending Orders...
              </div>

              <div className="h-3 overflow-hidden rounded bg-gray-200">

                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width: `${
                      selectedOrders.length
                        ? (
                            (completed /
                              selectedOrders.length) *
                            100
                          ).toFixed(0)
                        : 0
                    }%`,
                  }}
                />

              </div>

            </div>
          )}

          {!processing &&
            completed > 0 && (
              <>
                <div className="rounded bg-green-50 p-4">

                  <div>
                    Success:
                    {" "}
                    {successCount}
                  </div>

                  <div>
                    Failed:
                    {" "}
                    {failedCount}
                  </div>

                </div>

                {failedOrders.length >
                  0 && (
                  <div>

                    <div className="mb-2 font-semibold">
                      Failed Orders
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded border p-3 text-sm">

                      {failedOrders.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={index}
                          >
                            {item}
                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

                <button
                  onClick={() =>
                    window.location.reload()
                  }
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white"
                >
                  Refresh Orders
                </button>

              </>
            )}

        </div>

      </div>

    </div>
  );
}