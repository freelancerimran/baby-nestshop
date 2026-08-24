"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, X } from "lucide-react";

interface Account {
  id: number;
  name: string;
  ownership_type: string;
  current_balance?: number;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  category_type: string;
  ownership_type: string;
  is_active: boolean;
}

interface Transaction {
  id: number;
  account_id: number;
  transaction_type: string;
  ownership_type: string;
  category_id?: number | null;
  amount: number;
  transaction_date: string;
  description?: string | null;
  reference?: string | null;
  related_account_id?: number | null;
}

export default function TransactionFormModal({
  open,
  transaction,
  accounts,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [accountId, setAccountId] =
    useState("");

  const [transactionType, setTransactionType] =
    useState("expense");

  const [ownershipType, setOwnershipType] =
    useState("personal");

  const [categoryId, setCategoryId] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [transactionDate, setTransactionDate] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [reference, setReference] =
    useState("");

  const [relatedAccountId, setRelatedAccountId] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    if (transaction) {
      setAccountId(
        String(
          transaction.account_id || ""
        )
      );

      setTransactionType(
        transaction.transaction_type ||
          "expense"
      );

      setOwnershipType(
        transaction.ownership_type ||
          "personal"
      );

      setCategoryId(
        transaction.category_id
          ? String(
              transaction.category_id
            )
          : ""
      );

      setAmount(
        String(
          transaction.amount || 0
        )
      );

      setTransactionDate(
        transaction.transaction_date
          ? transaction.transaction_date.slice(
              0,
              10
            )
          : new Date()
              .toISOString()
              .slice(0, 10)
      );

      setDescription(
        transaction.description || ""
      );

      setReference(
        transaction.reference || ""
      );

      setRelatedAccountId(
        transaction.related_account_id
          ? String(
              transaction.related_account_id
            )
          : ""
      );
    } else {
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

      setTransactionType(
        "expense"
      );

      setOwnershipType(
        "personal"
      );

      setCategoryId("");

      setAmount("");

      setTransactionDate(
        new Date()
          .toISOString()
          .slice(0, 10)
      );

      setDescription("");

      setReference("");

      setRelatedAccountId("");
    }
  }, [
    open,
    transaction,
    accounts,
  ]);

  if (!open) {
    return null;
  }

  const filteredCategories =
    categories.filter(
      (category) => {
        if (!category.is_active) {
          return false;
        }

        if (
          category.ownership_type !==
          ownershipType
        ) {
          return false;
        }

        if (
          transactionType ===
            "income" &&
          category.category_type !==
            "income"
        ) {
          return false;
        }

        if (
          transactionType ===
            "expense" &&
          category.category_type !==
            "expense"
        ) {
          return false;
        }

        return true;
      }
    );

  async function submit() {
    if (!accountId) {
      alert(
        "Please select an account."
      );
      return;
    }

    const numericAmount =
      Number(amount || 0);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      alert(
        "Amount must be greater than zero."
      );
      return;
    }

    if (!transactionDate) {
      alert(
        "Transaction date is required."
      );
      return;
    }

    if (
      transactionType ===
        "transfer" &&
      !relatedAccountId
    ) {
      alert(
        "Please select the destination account."
      );
      return;
    }

    if (
      transactionType ===
        "transfer" &&
      relatedAccountId ===
        accountId
    ) {
      alert(
        "Source and destination accounts must be different."
      );
      return;
    }

    setSaving(true);

    try {
      const url = transaction
        ? `/api/admin/money-management/transactions/${transaction.id}`
        : "/api/admin/money-management/transactions";

      const response =
        await fetch(url, {
          method: transaction
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            account_id:
              Number(accountId),

            transaction_type:
              transactionType,

            ownership_type:
              ownershipType,

            category_id:
              categoryId
                ? Number(
                    categoryId
                  )
                : null,

            amount:
              numericAmount,

            transaction_date:
              transactionDate,

            description:
              description.trim() ||
              null,

            reference:
              reference.trim() ||
              null,

            related_account_id:
              relatedAccountId
                ? Number(
                    relatedAccountId
                  )
                : null,
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
            "Failed to save transaction."
        );
        return;
      }

      await onSaved();

      onClose();
    } catch (error) {
      console.error(
        "TRANSACTION SAVE ERROR:",
        error
      );

      alert(
        "Failed to save transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ArrowRightLeft
                size={19}
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-gray-900">
                {transaction
                  ? "Edit Transaction"
                  : "Add Transaction"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Record an income, expense
                or account transfer.
              </p>
            </div>

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


        {/* FORM */}

        <div className="space-y-5 p-6">

          {/* TYPE + OWNERSHIP */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Transaction Type
              </label>

              <select
                value={
                  transactionType
                }
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setTransactionType(
                    value
                  );

                  setCategoryId("");

                  if (
                    value ===
                    "transfer"
                  ) {
                    setCategoryId("");
                  }
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>

                <option value="transfer">
                  Transfer
                </option>
              </select>
            </div>


            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Ownership
              </label>

              <select
                value={
                  ownershipType
                }
                onChange={(event) => {
                  setOwnershipType(
                    event.target.value
                  );

                  setCategoryId("");
                }}
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

          </div>


          {/* ACCOUNT */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Account
            </label>

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

              {accounts
                .filter(
                  (account) =>
                    account.is_active
                )
                .map(
                  (account) => (
                    <option
                      key={
                        account.id
                      }
                      value={
                        account.id
                      }
                    >
                      {account.name}
                    </option>
                  )
                )}
            </select>
          </div>


          {/* TRANSFER DESTINATION */}

          {transactionType ===
            "transfer" && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <label className="mb-1.5 block text-sm font-bold text-blue-900">
                Destination Account
              </label>

              <select
                value={
                  relatedAccountId
                }
                onChange={(event) =>
                  setRelatedAccountId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select destination
                </option>

                {accounts
                  .filter(
                    (account) =>
                      account.is_active &&
                      String(
                        account.id
                      ) !==
                        accountId
                  )
                  .map(
                    (account) => (
                      <option
                        key={
                          account.id
                        }
                        value={
                          account.id
                        }
                      >
                        {account.name}
                      </option>
                    )
                  )}
              </select>

              <p className="mt-2 text-xs text-blue-700">
                Money will move from the
                selected account to this
                account.
              </p>

            </div>
          )}


          {/* AMOUNT */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Amount
            </label>

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                ৳
              </span>

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
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
              />

            </div>
          </div>


          {/* CATEGORY */}

          {transactionType !==
            "transfer" && (
            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Category
              </label>

              <select
                value={
                  categoryId
                }
                onChange={(event) =>
                  setCategoryId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select category
                </option>

                {filteredCategories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>

              {filteredCategories.length ===
                0 && (
                <p className="mt-1.5 text-xs text-gray-400">
                  No matching categories
                  available.
                </p>
              )}
            </div>
          )}


          {/* DATE */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Transaction Date
            </label>

            <input
              type="date"
              value={
                transactionDate
              }
              onChange={(event) =>
                setTransactionDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>


          {/* DESCRIPTION */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Description
            </label>

            <input
              value={
                description
              }
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="e.g. Monthly internet bill"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>


          {/* REFERENCE */}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-700">
              Reference
              <span className="ml-1 font-normal text-gray-400">
                Optional
              </span>
            </label>

            <input
              value={
                reference
              }
              onChange={(event) =>
                setReference(
                  event.target.value
                )
              }
              placeholder="Invoice, receipt or reference number"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
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
              accounts.filter(
                (account) =>
                  account.is_active
              ).length === 0
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : transaction
              ? "Save Changes"
              : "Create Transaction"}
          </button>

        </div>

      </div>

    </div>
  );
}