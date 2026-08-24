"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  WalletCards,
} from "lucide-react";

import TransactionFilters, {
  TransactionFilterState,
} from "@/components/admin/money-management/transactions/TransactionFilters";

import TransactionFormModal from "@/components/admin/money-management/transactions/TransactionFormModal";

import TransactionsList from "@/components/admin/money-management/transactions/TransactionsList";

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
  goal_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface Account {
  id: number;
  name: string;
  account_type?: string;
  ownership_type: string;
  business_name?: string | null;
  opening_balance?: number;
  current_balance?: number;
  is_active: boolean;
  notes?: string | null;
}

interface Category {
  id: number;
  name: string;
  category_type: string;
  ownership_type: string;
  is_active: boolean;
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString(
    "en-BD"
  )}`;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [filters, setFilters] =
    useState<TransactionFilterState>({
      search: "",
      transactionType: "",
      ownershipType: "",
      categoryId: "",
      accountId: "",
      dateFrom: "",
      dateTo: "",
    });


  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        transactionsResponse,
        accountsResponse,
      ] = await Promise.all([
        fetch(
          "/api/admin/money-management/transactions",
          {
            cache: "no-store",
          }
        ),

        fetch(
          "/api/admin/money-management/accounts",
          {
            cache: "no-store",
          }
        ),
      ]);

      const transactionsResult =
        await transactionsResponse.json();

      const accountsResult =
        await accountsResponse.json();

      if (
        !transactionsResponse.ok ||
        !transactionsResult.success
      ) {
        throw new Error(
          transactionsResult.error ||
            "Failed to load transactions."
        );
      }

      if (
        !accountsResponse.ok ||
        !accountsResult.success
      ) {
        throw new Error(
          accountsResult.error ||
            "Failed to load accounts."
        );
      }

      const incomingTransactions =
        Array.isArray(
          transactionsResult.transactions
        )
          ? transactionsResult.transactions
          : [];

      const incomingAccounts =
        Array.isArray(
          accountsResult.accounts
        )
          ? accountsResult.accounts
          : [];

      const incomingCategories =
        Array.isArray(
          transactionsResult.categories
        )
          ? transactionsResult.categories
          : [];

      setTransactions(
        incomingTransactions
      );

      setAccounts(
        incomingAccounts
      );

      setCategories(
        incomingCategories
      );
    } catch (err) {
      console.error(
        "TRANSACTIONS PAGE LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load transactions."
      );
    } finally {
      setLoading(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadData();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | FILTER TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const filteredTransactions =
    transactions.filter(
      (transaction) => {
        const query =
          filters.search
            .trim()
            .toLowerCase();

        const type =
          String(
            transaction.transaction_type ||
              ""
          )
            .toLowerCase()
            .trim();

        const ownership =
          String(
            transaction.ownership_type ||
              ""
          )
            .toLowerCase()
            .trim();

        const description =
          String(
            transaction.description ||
              ""
          ).toLowerCase();

        const reference =
          String(
            transaction.reference ||
              ""
          ).toLowerCase();

        const account =
          accounts.find(
            (item) =>
              item.id ===
              transaction.account_id
          );

        const accountName =
          String(
            account?.name || ""
          ).toLowerCase();

        /*
         * Search
         */

        const matchesSearch =
          !query ||
          description.includes(
            query
          ) ||
          reference.includes(
            query
          ) ||
          accountName.includes(
            query
          ) ||
          type.includes(
            query
          );

        /*
         * Transaction type
         */

        const matchesType =
          !filters.transactionType ||
          type ===
            filters.transactionType;

        /*
         * Ownership
         */

        const matchesOwnership =
          !filters.ownershipType ||
          ownership ===
            filters.ownershipType;

        /*
         * Category
         */

        const matchesCategory =
          !filters.categoryId ||
          String(
            transaction.category_id ||
              ""
          ) ===
            filters.categoryId;

        /*
         * Account
         */

        const matchesAccount =
          !filters.accountId ||
          String(
            transaction.account_id
          ) ===
            filters.accountId;

        /*
         * Date From
         */

        const transactionDate =
          transaction.transaction_date
            ? transaction.transaction_date.slice(
                0,
                10
              )
            : "";

        const matchesDateFrom =
          !filters.dateFrom ||
          transactionDate >=
            filters.dateFrom;

        /*
         * Date To
         */

        const matchesDateTo =
          !filters.dateTo ||
          transactionDate <=
            filters.dateTo;

        return (
          matchesSearch &&
          matchesType &&
          matchesOwnership &&
          matchesCategory &&
          matchesAccount &&
          matchesDateFrom &&
          matchesDateTo
        );
      }
    );


  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  let income = 0;
  let expense = 0;

  transactions.forEach(
    (transaction) => {
      const type =
        String(
          transaction.transaction_type ||
            ""
        )
          .toLowerCase()
          .trim();

      const amount =
        Number(
          transaction.amount || 0
        );

      if (type === "income") {
        income += amount;
      }

      if (type === "expense") {
        expense += amount;
      }
    }
  );

  const net = income - expense;


  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  function handleCreate() {
    setEditingTransaction(null);
    setModalOpen(true);
  }


  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  function handleEdit(
    transaction: Transaction
  ) {
    setEditingTransaction(
      transaction
    );

    setModalOpen(true);
  }


  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  async function handleDelete(
    transaction: Transaction
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this transaction?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/admin/money-management/transactions/${transaction.id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            "Failed to delete transaction."
        );

        return;
      }

      await loadData();
    } catch (err) {
      console.error(
        "TRANSACTION DELETE ERROR:",
        err
      );

      alert(
        "Failed to delete transaction."
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | SAVED
  |--------------------------------------------------------------------------
  */

  async function handleSaved() {
    await loadData();
  }


  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  function resetFilters() {
    setFilters({
      search: "",
      transactionType: "",
      ownershipType: "",
      categoryId: "",
      accountId: "",
      dateFrom: "",
      dateTo: "",
    });
  }


  return (
    <main className="min-h-screen bg-gray-50 p-6">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

          <div>

            <Link
              href="/admin/money-management"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Money Management
            </Link>

            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              Transactions
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your personal and
              business money movements.
            </p>

          </div>


          <button
            type="button"
            onClick={
              handleCreate
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Transaction
          </button>

        </div>


        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                loadData
              }
              className="font-bold underline"
            >
              Retry
            </button>

          </div>
        )}


        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 md:grid-cols-3">

          {/* INCOME */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowUpRight
                  size={19}
                />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Total Income
                </p>

                <p className="mt-1 text-xl font-black text-gray-900">
                  {money(income)}
                </p>

              </div>

            </div>

          </div>


          {/* EXPENSE */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <ArrowDownRight
                  size={19}
                />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Total Expense
                </p>

                <p className="mt-1 text-xl font-black text-gray-900">
                  {money(expense)}
                </p>

              </div>

            </div>

          </div>


          {/* NET */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <WalletCards
                  size={19}
                />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Net Movement
                </p>

                <p
                  className={`mt-1 text-xl font-black ${
                    net >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {money(net)}
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* FILTERS */}

        <div className="mb-5">

          <TransactionFilters
            filters={
              filters
            }
            categories={
              categories
            }
            accounts={
              accounts
            }
            onChange={
              setFilters
            }
            onReset={
              resetFilters
            }
          />

        </div>


        {/* RESULT COUNT */}

        {!loading && (
          <div className="mb-3 flex items-center justify-between px-1">

            <p className="text-sm font-semibold text-gray-500">
              Showing{" "}
              <span className="font-black text-gray-800">
                {
                  filteredTransactions.length
                }
              </span>{" "}
              of{" "}
              <span className="font-black text-gray-800">
                {
                  transactions.length
                }
              </span>{" "}
              transactions
            </p>

          </div>
        )}


        {/* TRANSACTIONS */}

        {loading ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-semibold text-gray-600">
              Loading transactions...
            </p>

          </div>

        ) : (

          <TransactionsList
            transactions={
              filteredTransactions
            }
            accounts={
              accounts
            }
            categories={
              categories
            }
            onEdit={
              handleEdit
            }
            onDelete={
              handleDelete
            }
          />

        )}


        {/* TRANSACTION MODAL */}

        <TransactionFormModal
          open={modalOpen}
          transaction={
            editingTransaction
          }
          accounts={
            accounts
          }
          categories={
            categories
          }
          onClose={() =>
            setModalOpen(false)
          }
          onSaved={
            handleSaved
          }
        />

      </div>

    </main>
  );
}