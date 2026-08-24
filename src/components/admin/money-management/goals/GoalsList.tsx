"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  PauseCircle,
  Pencil,
  Plus,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";

import { useState } from "react";

interface Contribution {
  id: number;
  goal_id: number;
  account_id?: number | null;
  account_name?: string | null;
  amount: number;
  contribution_date: string;
  note?: string | null;
  transaction_id?: number | null;
}

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

  contributed?: number;
  remaining?: number;
  percentage?: number;
  contribution_count?: number;

  contributions?: Contribution[];
}

function money(value: number) {
  return `৳${Number(
    value || 0
  ).toLocaleString("en-BD")}`;
}

function ownershipLabel(
  ownership: string
) {
  return ownership === "business"
    ? "Business"
    : "Personal";
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completed";

    case "paused":
      return "Paused";

    case "cancelled":
      return "Cancelled";

    default:
      return "Active";
  }
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-BD",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default function GoalsList({
  goals,
  onEdit,
  onDelete,
  onContribute,
  onEditContribution,
  onDeleteContribution,
}: {
  goals: Goal[];

  onEdit: (goal: Goal) => void;

  onDelete: (goal: Goal) => void;

  onContribute: (goal: Goal) => void;

  onEditContribution: (
    contribution: Contribution
  ) => void;

  onDeleteContribution: (
    contribution: Contribution
  ) => void;
}) {
  /*
   * Stores which goal's contribution
   * history is currently visible.
   *
   * Default = hidden.
   */
  const [
    expandedGoals,
    setExpandedGoals,
  ] = useState<
    Record<number, boolean>
  >({});

  function toggleHistory(
    goalId: number
  ) {
    setExpandedGoals(
      (previous) => ({
        ...previous,
        [goalId]:
          !previous[goalId],
      })
    );
  }

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <Target
          size={42}
          className="mx-auto text-gray-300"
        />

        <h2 className="mt-4 text-lg font-black text-gray-900">
          No goals yet
        </h2>

        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          Create a financial goal and start
          tracking how much you are putting
          toward it.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => {
        const targetAmount =
          Number(
            goal.target_amount || 0
          );

        const contributed =
          Number(
            goal.contributed || 0
          );

        const remaining =
          Math.max(
            0,
            Number(
              goal.remaining ??
                targetAmount -
                  contributed
            )
          );

        const percentage =
          Math.min(
            100,
            Math.max(
              0,
              Number(
                goal.percentage ??
                  (targetAmount > 0
                    ? (contributed /
                        targetAmount) *
                      100
                    : 0)
              )
            )
          );

        const isCompleted =
          goal.status ===
          "completed";

        const isPaused =
          goal.status === "paused";

        const isCancelled =
          goal.status ===
          "cancelled";

        const contributions =
          Array.isArray(
            goal.contributions
          )
            ? [...goal.contributions]
                .sort(
                  (
                    a,
                    b
                  ) =>
                    new Date(
                      b.contribution_date
                    ).getTime() -
                    new Date(
                      a.contribution_date
                    ).getTime()
                )
            : [];

        /*
         * Check whether this goal's
         * contribution history is open.
         */
        const isHistoryOpen =
          Boolean(
            expandedGoals[
              goal.id
            ]
          );

        /*
         * Keep very small percentages
         * visible.
         */
        const percentageText =
          percentage > 0 &&
          percentage < 0.01
            ? percentage.toFixed(3)
            : percentage.toFixed(2);

        const contributionCount =
          contributions.length ||
          Number(
            goal.contribution_count ||
              0
          );

        return (
          <div
            key={goal.id}
            className={`rounded-2xl border bg-white p-5 shadow-sm ${
              isCancelled
                ? "border-gray-100 opacity-70"
                : "border-gray-200"
            }`}
          >
            {/* ====================================================== */}
            {/* HEADER */}
            {/* ====================================================== */}

            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    goal.ownership_type ===
                    "business"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Target size={21} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-black text-gray-900">
                    {goal.name}
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {ownershipLabel(
                      goal.ownership_type
                    )}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  isCompleted
                    ? "bg-emerald-50 text-emerald-600"
                    : isPaused
                    ? "bg-amber-50 text-amber-600"
                    : isCancelled
                    ? "bg-gray-100 text-gray-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={13} />
                ) : isPaused ? (
                  <PauseCircle size={13} />
                ) : isCancelled ? (
                  <XCircle size={13} />
                ) : (
                  <Target size={13} />
                )}

                {statusLabel(
                  goal.status
                )}
              </span>
            </div>

            {/* ====================================================== */}
            {/* DESCRIPTION */}
            {/* ====================================================== */}

            {goal.description && (
              <p className="mt-4 line-clamp-2 text-sm text-gray-500">
                {goal.description}
              </p>
            )}

            {/* ====================================================== */}
            {/* AMOUNT */}
            {/* ====================================================== */}

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Saved
                </p>

                <p className="mt-1 text-2xl font-black text-gray-900">
                  {money(
                    contributed
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Target
                </p>

                <p className="mt-1 text-sm font-black text-gray-700">
                  {money(
                    targetAmount
                  )}
                </p>
              </div>
            </div>

            {/* ====================================================== */}
            {/* PROGRESS */}
            {/* ====================================================== */}

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-500">
                  Progress
                </span>

                <span className="font-black text-blue-600">
                  {percentageText}%
                </span>
              </div>

              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted
                      ? "bg-emerald-500"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        percentage
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* ====================================================== */}
            {/* DETAILS */}
            {/* ====================================================== */}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] font-semibold text-gray-400">
                  Remaining
                </p>

                <p className="mt-1 text-sm font-black text-gray-800">
                  {money(
                    remaining
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] font-semibold text-gray-400">
                  Monthly
                </p>

                <p className="mt-1 text-sm font-black text-gray-800">
                  {money(
                    Number(
                      goal.monthly_target ||
                        0
                    )
                  )}
                </p>
              </div>
            </div>

            {/* ====================================================== */}
            {/* TARGET DATE */}
            {/* ====================================================== */}

            {goal.target_date && (
              <div className="mt-3 text-xs text-gray-500">
                Target date:{" "}
                <span className="font-semibold text-gray-700">
                  {formatDate(
                    goal.target_date
                  )}
                </span>
              </div>
            )}

            {/* ====================================================== */}
            {/* CONTRIBUTION HISTORY */}
            {/* ====================================================== */}

            <div className="mt-5 border-t border-gray-100 pt-4">

              {/* SHOW / HIDE HEADER */}

              <button
                type="button"
                onClick={() =>
                  toggleHistory(
                    goal.id
                  )
                }
                className={`flex w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-left transition ${
                  isHistoryOpen
                    ? "ring-1 ring-blue-200"
                    : "hover:bg-gray-100"
                }`}
                aria-expanded={
                  isHistoryOpen
                }
              >
                <div>
                  <p className="text-sm font-black text-gray-900">
                    Contribution History
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {contributionCount}{" "}
                    contribution
                    {contributionCount !==
                    1
                      ? "s"
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                  <span>
                    {isHistoryOpen
                      ? "Hide"
                      : "Show"}
                  </span>

                  {isHistoryOpen ? (
                    <ChevronUp
                      size={18}
                    />
                  ) : (
                    <ChevronDown
                      size={18}
                    />
                  )}
                </div>
              </button>

              {/* HISTORY CONTENT */}

              {isHistoryOpen && (
                <div className="mt-3 space-y-2">
                  {contributions.length ===
                  0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-gray-500">
                        No contributions
                        yet.
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Add money to this
                        goal to see the
                        history here.
                      </p>
                    </div>
                  ) : (
                    contributions.map(
                      (
                        contribution
                      ) => (
                        <div
                          key={
                            contribution.id
                          }
                          className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-gray-900">
                                {money(
                                  contribution.amount
                                )}
                              </p>

                              <p className="mt-1 text-[11px] font-medium text-gray-500">
                                {formatDate(
                                  contribution.contribution_date
                                )}
                              </p>

                              {contribution.account_name && (
                                <p className="mt-1 text-[11px] font-semibold text-blue-600">
                                  Account:{" "}
                                  {
                                    contribution.account_name
                                  }
                                </p>
                              )}

                              {contribution.note && (
                                <p className="mt-1 break-words text-[11px] text-gray-500">
                                  Note:{" "}
                                  {
                                    contribution.note
                                  }
                                </p>
                              )}

                              {contribution.transaction_id && (
                                <p className="mt-1 text-[10px] text-gray-400">
                                  Transaction #
                                  {
                                    contribution.transaction_id
                                  }
                                </p>
                              )}
                            </div>

                            {/* CONTRIBUTION ACTIONS */}

                            <div className="flex shrink-0 gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onEditContribution(
                                    contribution
                                  )
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                                title="Edit contribution"
                                aria-label="Edit contribution"
                              >
                                <Pencil
                                  size={14}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  onDeleteContribution(
                                    contribution
                                  )
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50"
                                title="Delete contribution"
                                aria-label="Delete contribution"
                              >
                                <Trash2
                                  size={14}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              )}
            </div>

            {/* ====================================================== */}
            {/* MAIN ACTIONS */}
            {/* ====================================================== */}

            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onContribute(
                      goal
                    )
                  }
                  disabled={
                    isCompleted ||
                    isCancelled
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                  Add Money
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onEdit(goal)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  <Edit3 size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onDelete(goal)
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-red-100 px-3 py-2.5 text-red-600 transition hover:bg-red-50"
                  aria-label="Delete goal"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}