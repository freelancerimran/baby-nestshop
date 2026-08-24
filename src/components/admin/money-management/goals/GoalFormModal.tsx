"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Goal {
  id: number;
  name: string;
  description?: string | null;
  ownership_type: string;
  target_amount: number;
  monthly_target: number;
  start_date?: string | null;
  target_date?: string | null;
  status: string;
  notes?: string | null;
}

export default function GoalFormModal({
  open,
  goal,
  onClose,
  onSaved,
}: {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [ownershipType, setOwnershipType] =
    useState("personal");

  const [targetAmount, setTargetAmount] =
    useState("");

  const [monthlyTarget, setMonthlyTarget] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [targetDate, setTargetDate] =
    useState("");

  const [status, setStatus] =
    useState("active");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    if (goal) {
      setName(goal.name || "");

      setDescription(
        goal.description || ""
      );

      setOwnershipType(
        goal.ownership_type ||
          "personal"
      );

      setTargetAmount(
        String(
          goal.target_amount || ""
        )
      );

      setMonthlyTarget(
        String(
          goal.monthly_target || ""
        )
      );

      setStartDate(
        goal.start_date || ""
      );

      setTargetDate(
        goal.target_date || ""
      );

      setStatus(
        goal.status || "active"
      );

      setNotes(
        goal.notes || ""
      );
    } else {
      setName("");
      setDescription("");
      setOwnershipType("personal");
      setTargetAmount("");
      setMonthlyTarget("");
      setStartDate("");
      setTargetDate("");
      setStatus("active");
      setNotes("");
    }
  }, [open, goal]);

  if (!open) {
    return null;
  }

  async function submit() {
    if (!name.trim()) {
      alert("Goal name is required.");
      return;
    }

    const target = Number(
      targetAmount || 0
    );

    if (!Number.isFinite(target) || target <= 0) {
      alert(
        "Target amount must be greater than zero."
      );
      return;
    }

    const monthly = Number(
      monthlyTarget || 0
    );

    if (
      !Number.isFinite(monthly) ||
      monthly < 0
    ) {
      alert(
        "Monthly target cannot be negative."
      );
      return;
    }

    setSaving(true);

    try {
      const url = goal
        ? `/api/admin/money-management/goals/${goal.id}`
        : "/api/admin/money-management/goals";

      const response = await fetch(url, {
        method: goal ? "PATCH" : "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description:
            description.trim() || null,
          ownership_type:
            ownershipType,
          target_amount: target,
          monthly_target: monthly,
          start_date:
            startDate || null,
          target_date:
            targetDate || null,
          status,
          notes:
            notes.trim() || null,
        }),
      });

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            "Failed to save goal."
        );
        return;
      }

      await onSaved();

      onClose();
    } catch (error) {
      console.error(
        "GOAL SAVE ERROR:",
        error
      );

      alert(
        "Failed to save goal."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

          <div>
            <h2 className="text-xl font-black text-gray-900">
              {goal
                ? "Edit Goal"
                : "Create Goal"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Set a financial target and
              track your progress.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>

        </div>


        {/* FORM */}

        <div className="space-y-4 p-6">

          {/* NAME */}

          <div>

            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Goal Name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="e.g. Buy a New Car"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

          </div>


          {/* OWNERSHIP */}

          <div>

            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Goal Type
            </label>

            <select
              value={ownershipType}
              onChange={(event) =>
                setOwnershipType(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="personal">
                Personal
              </option>

              <option value="business">
                Business
              </option>
            </select>

          </div>


          {/* AMOUNTS */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Target Amount
              </label>

              <input
                type="number"
                min="0"
                value={targetAmount}
                onChange={(event) =>
                  setTargetAmount(
                    event.target.value
                  )
                }
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

            </div>


            <div>

              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Monthly Target
              </label>

              <input
                type="number"
                min="0"
                value={monthlyTarget}
                onChange={(event) =>
                  setMonthlyTarget(
                    event.target.value
                  )
                }
                placeholder="Optional"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

            </div>

          </div>


          {/* DATES */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

            </div>


            <div>

              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Target Date
              </label>

              <input
                type="date"
                value={targetDate}
                onChange={(event) =>
                  setTargetDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

            </div>

          </div>


          {/* STATUS */}

          {goal && (
            <div>

              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="active">
                  Active
                </option>

                <option value="paused">
                  Paused
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>

            </div>
          )}


          {/* DESCRIPTION */}

          <div>

            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={3}
              placeholder="What are you saving for?"
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

          </div>


          {/* NOTES */}

          <div>

            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              rows={2}
              placeholder="Optional notes..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

          </div>

        </div>


        {/* FOOTER */}

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : goal
              ? "Save Changes"
              : "Create Goal"}
          </button>

        </div>

      </div>

    </div>
  );
}