"use client";

import {
  useEffect,
  useState,
} from "react";

import { X } from "lucide-react";

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  contributed?: number;
  remaining?: number;
}

interface Account {
  id: number;
  name: string;
  ownership_type: string;
  current_balance?: number;
  is_active: boolean;
}

interface Contribution {
  id: number;
  goal_id: number;
  account_id?: number | null;
  amount: number;
  contribution_date: string;
  note?: string | null;
  transaction_id?: number | null;
}

export default function GoalContributionModal({
  open,
  goal,
  accounts,
  contribution,
  onClose,
  onSaved,
}: {
  open: boolean;
  goal: Goal | null;
  accounts: Account[];
  contribution?: Contribution | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const isEditMode =
    contribution !== null &&
    contribution !== undefined;

  const [amount, setAmount] =
    useState("");

  const [accountId, setAccountId] =
    useState("");

  const [
    contributionDate,
    setContributionDate,
  ] = useState("");

  const [note, setNote] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open || !goal) {
      return;
    }

    if (contribution) {
      setAmount(
        String(
          Number(
            contribution.amount || 0
          )
        )
      );

      setAccountId(
        contribution.account_id !==
          null &&
        contribution.account_id !==
          undefined
          ? String(
              contribution.account_id
            )
          : ""
      );

      setContributionDate(
        contribution.contribution_date
          ? contribution.contribution_date.slice(
              0,
              10
            )
          : new Date()
              .toISOString()
              .slice(0, 10)
      );

      setNote(
        contribution.note || ""
      );

      return;
    }

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    setAmount("");
    setContributionDate(today);
    setNote("");

    const activeAccounts =
      accounts.filter(
        (account) =>
          account.is_active
      );

    setAccountId(
      activeAccounts.length > 0
        ? String(
            activeAccounts[0].id
          )
        : ""
    );
  }, [
    open,
    goal,
    contribution,
    accounts,
  ]);

  if (!open || !goal) {
    return null;
  }

  const targetAmount =
    Number(
      goal.target_amount || 0
    );

  const currentContributed =
    Number(
      goal.contributed || 0
    );

  const oldContributionAmount =
    isEditMode
      ? Number(
          contribution?.amount || 0
        )
      : 0;

  const baseContributed =
    Math.max(
      0,
      currentContributed -
        oldContributionAmount
    );

  const enteredAmount =
    Number(amount || 0);

  const previewContributed =
    isEditMode
      ? baseContributed +
        enteredAmount
      : currentContributed +
        enteredAmount;

  const previewRemaining =
    Math.max(
      0,
      targetAmount -
        previewContributed
    );

  const previewPercentage =
    targetAmount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (previewContributed /
              targetAmount) *
              100
          )
        )
      : 0;

  const displayPercentage =
    previewPercentage > 0 &&
    previewPercentage < 0.01
      ? previewPercentage.toFixed(3)
      : previewPercentage.toFixed(2);

  const selectedAccount =
    accounts.find(
      (account) =>
        String(account.id) ===
        accountId
    );

  const activeAccounts =
    accounts.filter(
      (account) =>
        account.is_active
    );

  async function submit() {
    if (!amount.trim()) {
      alert(
        "Contribution amount is required."
      );

      return;
    }

    if (
      !Number.isFinite(
        enteredAmount
      ) ||
      enteredAmount <= 0
    ) {
      alert(
        "Contribution amount must be greater than zero."
      );

      return;
    }

    if (!accountId) {
      alert(
        "Please select an account."
      );

      return;
    }

    if (!contributionDate) {
      alert(
        "Contribution date is required."
      );

      return;
    }

    if (!goal) {
      alert(
        "Goal not found."
      );

      return;
    }

    if (
      isEditMode &&
      !contribution
    ) {
      alert(
        "Contribution not found."
      );

      return;
    }

    /*
     * Account balance warning.
     *
     * When editing the same account,
     * add the old contribution back
     * before checking available balance.
     */

    if (selectedAccount) {
      const accountBalance =
        Number(
          selectedAccount.current_balance ||
            0
        );

      const sameAccount =
        isEditMode &&
        contribution?.account_id ===
          selectedAccount.id;

      const availableBalance =
        sameAccount
          ? accountBalance +
            oldContributionAmount
          : accountBalance;

      if (
        availableBalance <
        enteredAmount
      ) {
        const proceed =
          window.confirm(
            "The contribution is greater than the current account balance. Do you want to continue?"
          );

        if (!proceed) {
          return;
        }
      }
    }

    setSaving(true);

    try {
      const payload = {
        goal_id: goal.id,

        account_id:
          Number(accountId),

        amount:
          enteredAmount,

        contribution_date:
          contributionDate,

        note:
          note.trim() || null,
      };

      let response: Response;

      if (isEditMode) {
        response =
          await fetch(
            "/api/admin/money-management/goals/contributions",
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                id:
                  contribution!.id,

                ...payload,
              }),
            }
          );
      } else {
        response =
          await fetch(
            "/api/admin/money-management/goals/contributions",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload
              ),
            }
          );
      }

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            (isEditMode
              ? "Failed to update contribution."
              : "Failed to add contribution.")
        );

        return;
      }

      await onSaved();

      onClose();
    } catch (error) {
      console.error(
        isEditMode
          ? "GOAL CONTRIBUTION UPDATE ERROR:"
          : "GOAL CONTRIBUTION CREATE ERROR:",
        error
      );

      alert(
        isEditMode
          ? "Failed to update contribution."
          : "Failed to add contribution."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-gray-900">
              {isEditMode
                ? "Edit Contribution"
                : "Add Contribution"}
            </h2>

            <p className="mt-1 truncate text-sm text-gray-500">
              {goal.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* SUMMARY */}

        <div className="mx-6 mt-5 rounded-2xl bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-600">
                {isEditMode
                  ? "AFTER UPDATE"
                  : "AFTER ADD"}
              </p>

              <p className="mt-1 text-lg font-black text-gray-900">
                ৳
                {previewContributed.toLocaleString(
                  "en-BD"
                )}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-blue-600">
                TARGET
              </p>

              <p className="mt-1 text-lg font-black text-gray-900">
                ৳
                {targetAmount.toLocaleString(
                  "en-BD"
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${previewPercentage}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-blue-700">
              {displayPercentage}%
            </p>

            <p className="text-xs text-blue-700">
              Remaining ৳
              {previewRemaining.toLocaleString(
                "en-BD"
              )}
            </p>
          </div>
        </div>

        {/* FORM */}

        <div className="space-y-4 p-6">

          {/* ACCOUNT */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Account / Source
            </label>

            {activeAccounts.length ===
            0 ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                No active account
                available. Create an
                account first.
              </div>
            ) : (
              <select
                value={accountId}
                onChange={(event) =>
                  setAccountId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select account
                </option>

                {activeAccounts.map(
                  (account) => (
                    <option
                      key={account.id}
                      value={
                        account.id
                      }
                    >
                      {account.name} — ৳
                      {Number(
                        account.current_balance ||
                          0
                      ).toLocaleString(
                        "en-BD"
                      )}
                    </option>
                  )
                )}
              </select>
            )}
          </div>

          {/* AMOUNT */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Contribution Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                )
              }
              placeholder="e.g. 10000"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            {enteredAmount >
              0 &&
              targetAmount >
                0 &&
              previewContributed >
                targetAmount && (
                <p className="mt-1.5 text-xs font-semibold text-amber-600">
                  This contribution will
                  exceed the remaining
                  target amount.
                </p>
              )}
          </div>

          {/* DATE */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Contribution Date
            </label>

            <input
              type="date"
              value={
                contributionDate
              }
              onChange={(event) =>
                setContributionDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* NOTE */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Note
            </label>

            <textarea
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Optional note..."
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
            disabled={
              saving ||
              activeAccounts.length ===
                0
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEditMode
              ? "Update Contribution"
              : "Add Contribution"}
          </button>
        </div>
      </div>
    </div>
  );
}