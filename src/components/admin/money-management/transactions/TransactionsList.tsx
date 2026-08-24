"use client";

import {
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  Edit3,
  Receipt,
  Trash2,
} from "lucide-react";

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

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString(
    "en-BD"
  )}`;
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function typeLabel(value: string) {
  const type = value
    .toLowerCase()
    .trim();

  if (type === "income") {
    return "Income";
  }

  if (type === "transfer") {
    return "Transfer";
  }

  return "Expense";
}

export default function TransactionsList({
  transactions,
  accounts,
  categories,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onEdit: (
    transaction: Transaction
  ) => void;
  onDelete: (
    transaction: Transaction
  ) => void;
}) {
  const accountMap = new Map(
    accounts.map((account) => [
      account.id,
      account.name,
    ])
  );

  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ])
  );

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

        <Receipt
          size={42}
          className="mx-auto text-gray-300"
        />

        <h2 className="mt-4 text-lg font-black text-gray-900">
          No transactions found
        </h2>

        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          Your income, expenses and transfers
          will appear here.
        </p>

      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* DESKTOP TABLE */}

      <div className="hidden overflow-x-auto md:block">

        <table className="w-full min-w-[900px]">

          <thead className="border-b border-gray-100 bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-400">
                Transaction
              </th>

              <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-400">
                Account
              </th>

              <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-400">
                Category
              </th>

              <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-400">
                Date
              </th>

              <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-gray-400">
                Amount
              </th>

              <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-gray-400">
                Actions
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-100">

            {transactions.map(
              (transaction) => {
                const type =
                  transaction.transaction_type
                    .toLowerCase()
                    .trim();

                const isIncome =
                  type === "income";

                const isTransfer =
                  type === "transfer";

                const categoryName =
                  transaction.category_id
                    ? categoryMap.get(
                        transaction.category_id
                      )
                    : null;

                const accountName =
                  accountMap.get(
                    transaction.account_id
                  ) ||
                  "Unknown Account";

                return (
                  <tr
                    key={
                      transaction.id
                    }
                    className="transition hover:bg-gray-50"
                  >

                    {/* TRANSACTION */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-600"
                              : isTransfer
                              ? "bg-blue-50 text-blue-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight
                              size={18}
                            />
                          ) : isTransfer ? (
                            <ArrowRightLeft
                              size={18}
                            />
                          ) : (
                            <ArrowDownRight
                              size={18}
                            />
                          )}
                        </div>

                        <div className="min-w-0">

                          <p className="max-w-[280px] truncate text-sm font-bold text-gray-900">
                            {transaction.description ||
                              categoryName ||
                              typeLabel(
                                type
                              )}
                          </p>

                          <div className="mt-1 flex items-center gap-2">

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isIncome
                                  ? "bg-emerald-50 text-emerald-600"
                                  : isTransfer
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {typeLabel(
                                type
                              )}
                            </span>

                            <span className="text-[11px] capitalize text-gray-400">
                              {
                                transaction.ownership_type
                              }
                            </span>

                          </div>

                        </div>

                      </div>

                    </td>


                    {/* ACCOUNT */}

                    <td className="px-5 py-4">

                      <p className="text-sm font-semibold text-gray-800">
                        {accountName}
                      </p>

                      {isTransfer &&
                        transaction.related_account_id && (
                          <p className="mt-1 text-xs text-gray-400">
                            →{" "}
                            {accountMap.get(
                              transaction.related_account_id
                            ) ||
                              "Unknown Account"}
                          </p>
                        )}

                    </td>


                    {/* CATEGORY */}

                    <td className="px-5 py-4">

                      <p className="text-sm text-gray-600">
                        {categoryName ||
                          (isTransfer
                            ? "Account Transfer"
                            : "Uncategorized")}
                      </p>

                      {transaction.reference && (
                        <p className="mt-1 max-w-[180px] truncate text-xs text-gray-400">
                          Ref:{" "}
                          {
                            transaction.reference
                          }
                        </p>
                      )}

                    </td>


                    {/* DATE */}

                    <td className="px-5 py-4">

                      <p className="text-sm font-semibold text-gray-700">
                        {formatDate(
                          transaction.transaction_date
                        )}
                      </p>

                    </td>


                    {/* AMOUNT */}

                    <td className="px-5 py-4 text-right">

                      <p
                        className={`text-sm font-black ${
                          isIncome
                            ? "text-emerald-600"
                            : isTransfer
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {isIncome
                          ? "+"
                          : isTransfer
                          ? ""
                          : "-"}
                        {money(
                          transaction.amount
                        )}
                      </p>

                    </td>


                    {/* ACTIONS */}

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            onEdit(
                              transaction
                            )
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                          aria-label="Edit transaction"
                        >
                          <Edit3
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(
                              transaction
                            )
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                          aria-label="Delete transaction"
                        >
                          <Trash2
                            size={15}
                          />
                        </button>

                      </div>

                    </td>

                  </tr>
                );
              }
            )}

          </tbody>

        </table>

      </div>


      {/* MOBILE CARDS */}

      <div className="divide-y divide-gray-100 md:hidden">

        {transactions.map(
          (transaction) => {
            const type =
              transaction.transaction_type
                .toLowerCase()
                .trim();

            const isIncome =
              type === "income";

            const isTransfer =
              type === "transfer";

            const categoryName =
              transaction.category_id
                ? categoryMap.get(
                    transaction.category_id
                  )
                : null;

            const accountName =
              accountMap.get(
                transaction.account_id
              ) ||
              "Unknown Account";

            return (
              <div
                key={
                  transaction.id
                }
                className="p-4"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isIncome
                          ? "bg-emerald-50 text-emerald-600"
                          : isTransfer
                          ? "bg-blue-50 text-blue-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight
                          size={18}
                        />
                      ) : isTransfer ? (
                        <ArrowRightLeft
                          size={18}
                        />
                      ) : (
                        <ArrowDownRight
                          size={18}
                        />
                      )}
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold text-gray-900">
                        {transaction.description ||
                          categoryName ||
                          typeLabel(
                            type
                          )}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {accountName}
                        {" • "}
                        {formatDate(
                          transaction.transaction_date
                        )}
                      </p>

                    </div>

                  </div>

                  <p
                    className={`shrink-0 text-sm font-black ${
                      isIncome
                        ? "text-emerald-600"
                        : isTransfer
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {isIncome
                      ? "+"
                      : isTransfer
                      ? ""
                      : "-"}
                    {money(
                      transaction.amount
                    )}
                  </p>

                </div>


                <div className="mt-3 flex items-center justify-between gap-3">

                  <div className="flex min-w-0 flex-wrap items-center gap-2">

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                        isIncome
                          ? "bg-emerald-50 text-emerald-600"
                          : isTransfer
                          ? "bg-blue-50 text-blue-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {typeLabel(
                        type
                      )}
                    </span>

                    <span className="text-xs text-gray-500">
                      {categoryName ||
                        (isTransfer
                          ? "Account Transfer"
                          : "Uncategorized")}
                    </span>

                  </div>


                  <div className="flex shrink-0 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(
                          transaction
                        )
                      }
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                    >
                      <Edit3
                        size={14}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(
                          transaction
                        )
                      }
                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2
                        size={14}
                      />
                    </button>

                  </div>

                </div>


                {isTransfer &&
                  transaction.related_account_id && (
                    <p className="mt-2 text-xs text-blue-600">
                      Transfer to{" "}
                      <span className="font-bold">
                        {accountMap.get(
                          transaction.related_account_id
                        ) ||
                          "Unknown Account"}
                      </span>
                    </p>
                  )}

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}