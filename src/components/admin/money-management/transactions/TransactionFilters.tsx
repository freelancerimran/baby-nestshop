"use client";

import {
  Filter,
  RotateCcw,
} from "lucide-react";

export interface TransactionFilterState {
  search: string;
  transactionType: string;
  ownershipType: string;
  categoryId: string;
  accountId: string;
  dateFrom: string;
  dateTo: string;
}

interface Category {
  id: number;
  name: string;
  category_type: string;
  ownership_type: string;
  is_active: boolean;
}

interface Account {
  id: number;
  name: string;
  ownership_type: string;
  is_active: boolean;
}

export default function TransactionFilters({
  filters,
  categories,
  accounts,
  onChange,
  onReset,
}: {
  filters: TransactionFilterState;
  categories: Category[];
  accounts: Account[];
  onChange: (
    filters: TransactionFilterState
  ) => void;
  onReset: () => void;
}) {
  function update(
    key: keyof TransactionFilterState,
    value: string
  ) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="mb-4 flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Filter size={17} />
          </div>

          <div>
            <h2 className="text-sm font-black text-gray-900">
              Filters
            </h2>

            <p className="text-xs text-gray-500">
              Narrow down your transactions.
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
        >
          <RotateCcw size={13} />
          Reset
        </button>

      </div>


      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {/* SEARCH */}

        <div className="lg:col-span-2 xl:col-span-1">

          <label className="mb-1.5 block text-xs font-bold text-gray-600">
            Search
          </label>

          <input
            value={filters.search}
            onChange={(event) =>
              update(
                "search",
                event.target.value
              )
            }
            placeholder="Description or reference..."
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
          />

        </div>


        {/* TYPE */}

        <div>

          <label className="mb-1.5 block text-xs font-bold text-gray-600">
            Type
          </label>

          <select
            value={
              filters.transactionType
            }
            onChange={(event) =>
              update(
                "transactionType",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">
              All Types
            </option>

            <option value="income">
              Income
            </option>

            <option value="expense">
              Expense
            </option>

            <option value="transfer">
              Transfer
            </option>
          </select>

        </div>


        {/* OWNERSHIP */}

        <div>

          <label className="mb-1.5 block text-xs font-bold text-gray-600">
            Ownership
          </label>

          <select
            value={
              filters.ownershipType
            }
            onChange={(event) =>
              update(
                "ownershipType",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">
              All
            </option>

            <option value="personal">
              Personal
            </option>

            <option value="business">
              Business
            </option>
          </select>

        </div>


        {/* ACCOUNT */}

        <div>

          <label className="mb-1.5 block text-xs font-bold text-gray-600">
            Account
          </label>

          <select
            value={filters.accountId}
            onChange={(event) =>
              update(
                "accountId",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">
              All Accounts
            </option>

            {accounts
              .filter(
                (account) =>
                  account.is_active
              )
              .map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.name}
                </option>
              ))}
          </select>

        </div>


        {/* CATEGORY */}

        <div>

          <label className="mb-1.5 block text-xs font-bold text-gray-600">
            Category
          </label>

          <select
            value={
              filters.categoryId
            }
            onChange={(event) =>
              update(
                "categoryId",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">
              All Categories
            </option>

            {categories
              .filter(
                (category) =>
                  category.is_active
              )
              .map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
          </select>

        </div>


        {/* DATE FROM */}

        <div>

          <label className="mb-1.5 block text-xs font-bold text-gray-600">
            From
          </label>

          <input
            type="date"
            value={
              filters.dateFrom
            }
            onChange={(event) =>
              update(
                "dateFrom",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
          />

        </div>


        {/* DATE TO */}

        <div>

          <label className="mb-1.5 block text-xs font-bold text-gray-600">
            To
          </label>

          <input
            type="date"
            value={
              filters.dateTo
            }
            onChange={(event) =>
              update(
                "dateTo",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
          />

        </div>

      </div>

    </div>
  );
}