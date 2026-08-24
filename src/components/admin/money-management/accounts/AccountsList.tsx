"use client";

import {
  Building2,
  CreditCard,
  Edit3,
  Trash2,
  Wallet,
} from "lucide-react";

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

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

export default function AccountsList({
  accounts,
  onEdit,
  onDelete,
}: {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <Wallet
          size={40}
          className="mx-auto text-gray-300"
        />

        <h2 className="mt-4 text-lg font-bold text-gray-900">
          No accounts yet
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add your first bank, cash or wallet account.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => {
        const balance = Number(
          account.current_balance || 0
        );

        return (
          <div
            key={account.id}
            className={`rounded-2xl border bg-white p-5 shadow-sm ${
              account.is_active
                ? "border-gray-200"
                : "border-gray-100 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  {account.account_type
                    .toLowerCase()
                    .includes("bank") ? (
                    <Building2 size={21} />
                  ) : account.account_type
                      .toLowerCase()
                      .includes("card") ? (
                    <CreditCard size={21} />
                  ) : (
                    <Wallet size={21} />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-bold text-gray-900">
                    {account.name}
                  </h3>

                  <p className="mt-0.5 text-xs capitalize text-gray-500">
                    {account.account_type} •{" "}
                    {account.ownership_type}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  account.is_active
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {account.is_active
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-400">
                CURRENT BALANCE
              </p>

              <p
                className={`mt-1 text-2xl font-black ${
                  balance >= 0
                    ? "text-gray-900"
                    : "text-red-600"
                }`}
              >
                {money(balance)}
              </p>
            </div>

            {account.ownership_type === "business" &&
              account.business_name && (
                <p className="mt-3 text-xs text-gray-500">
                  Business:{" "}
                  <span className="font-semibold text-gray-700">
                    {account.business_name}
                  </span>
                </p>
              )}

            <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => onEdit(account)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <Edit3 size={15} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(account)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
