"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Account {
  id: number;
  name: string;
  account_type: string;
  ownership_type: string;
  business_name?: string | null;
  opening_balance: number;
  current_balance?: number;
  is_active: boolean;
  notes?: string | null;
}

export default function AccountFormModal({
  open,
  account,
  onClose,
  onSaved,
}: {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [accountType, setAccountType] =
    useState("bank");
  const [ownershipType, setOwnershipType] =
    useState("personal");
  const [businessName, setBusinessName] =
    useState("");
  const [openingBalance, setOpeningBalance] =
    useState("0");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (account) {
      setName(account.name || "");
      setAccountType(
        account.account_type || "bank"
      );
      setOwnershipType(
        account.ownership_type || "personal"
      );
      setBusinessName(
        account.business_name || ""
      );
      setOpeningBalance(
        String(account.opening_balance || 0)
      );
      setNotes(account.notes || "");
      setIsActive(account.is_active);
    } else {
      setName("");
      setAccountType("bank");
      setOwnershipType("personal");
      setBusinessName("");
      setOpeningBalance("0");
      setNotes("");
      setIsActive(true);
    }
  }, [open, account]);

  if (!open) return null;

  async function submit() {
    if (!name.trim()) {
      alert("Account name is required.");
      return;
    }

    if (
      ownershipType === "business" &&
      !businessName.trim()
    ) {
      alert("Business name is required.");
      return;
    }

    setSaving(true);

    try {
      const url = account
        ? `/api/admin/money-management/accounts/${account.id}`
        : "/api/admin/money-management/accounts";

      const response = await fetch(url, {
        method: account ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          account_type: accountType,
          ownership_type: ownershipType,
          business_name:
            ownershipType === "business"
              ? businessName
              : null,
          opening_balance: Number(
            openingBalance || 0
          ),
          notes,
          is_active: isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.error ||
            "Failed to save account."
        );
        return;
      }

      await onSaved();
      onClose();
    } catch (error) {
      console.error("ACCOUNT SAVE ERROR:", error);
      alert("Failed to save account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {account
                ? "Edit Account"
                : "Add Account"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your money account.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Account Name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. City Bank"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Account Type
              </label>

              <select
                value={accountType}
                onChange={(e) =>
                  setAccountType(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="bank">
                  Bank
                </option>
                <option value="cash">
                  Cash
                </option>
                <option value="wallet">
                  Mobile Wallet
                </option>
                <option value="card">
                  Card
                </option>
                <option value="other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Ownership
              </label>

              <select
                value={ownershipType}
                onChange={(e) =>
                  setOwnershipType(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="personal">
                  Personal
                </option>
                <option value="business">
                  Business
                </option>
              </select>
            </div>

          </div>

          {ownershipType === "business" && (
            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Business Name
              </label>

              <input
                value={businessName}
                onChange={(e) =>
                  setBusinessName(e.target.value)
                }
                placeholder="e.g. Baby Nest"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Opening Balance
            </label>

            <input
              type="number"
              value={openingBalance}
              onChange={(e) =>
                setOpeningBalance(e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {account && (
            <label className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) =>
                  setIsActive(e.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-semibold text-gray-700">
                Account is active
              </span>
            </label>
          )}

        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
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
              : account
              ? "Save Changes"
              : "Create Account"}
          </button>
        </div>

      </div>
    </div>
  );
}
