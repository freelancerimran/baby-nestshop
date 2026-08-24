import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Wallet,
  Target,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
  CircleDollarSign,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

/*
============================================================
MONEY MANAGEMENT — OVERVIEW
============================================================

This page is separate from Finance.

Finance:
- Investments
- Investment batches
- Product profitability
- Finance sales

Money Management:
- Personal money
- Business money
- Accounts
- Income
- Expenses
- Transfers
- Goals

============================================================
*/

type Account = {
  id: number;
  name: string;
  account_type: string;
  ownership_type: string;
  business_name: string | null;
  opening_balance: number;
  is_active: boolean;
  notes: string | null;
};

type Transaction = {
  id: number;
  account_id: number | null;
  transaction_type: string;
  ownership_type: string;
  category_id: number | null;
  amount: number;
  transaction_date: string;
  description: string | null;
  reference: string | null;
  related_account_id: number | null;
  goal_id: number | null;
};

type Category = {
  id: number;
  name: string;
  category_type: string;
  ownership_type: string;
};

type Goal = {
  id: number;
  name: string;
  description: string | null;
  ownership_type: string;
  target_amount: number;
  monthly_target: number;
  start_date: string | null;
  target_date: string | null;
  status: string;
};

type GoalContribution = {
  goal_id: number;
  amount: number;
};

/*
============================================================
HELPERS
============================================================
*/

function numberValue(value: unknown) {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

function money(value: number) {
  return `৳${numberValue(value).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 0,
    }
  )}`;
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
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function ownershipLabel(
  ownership: string
) {
  return ownership === "business"
    ? "Business"
    : "Personal";
}

/*
============================================================
GET DATA
============================================================
*/

async function getMoneyManagementData() {
  const [
    accountsResult,
    transactionsResult,
    categoriesResult,
    goalsResult,
    contributionsResult,
  ] = await Promise.all([
    /*
     * ACCOUNTS
     *
     * Actual database table:
     * money_accounts
     */
    supabaseAdmin
      .from("money_accounts")
      .select(
        `
          id,
          name,
          account_type,
          ownership_type,
          business_name,
          opening_balance,
          is_active,
          notes
        `
      )
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      }),

    /*
     * TRANSACTIONS
     *
     * Actual database table:
     * money_transactions
     */
    supabaseAdmin
      .from("money_transactions")
      .select(
        `
          id,
          account_id,
          transaction_type,
          ownership_type,
          category_id,
          amount,
          transaction_date,
          description,
          reference,
          related_account_id,
          goal_id
        `
      )
      .order("transaction_date", {
        ascending: false,
      }),

    /*
     * CATEGORIES
     *
     * Actual database table:
     * money_categories
     */
    supabaseAdmin
      .from("money_categories")
      .select(
        `
          id,
          name,
          category_type,
          ownership_type
        `
      )
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      }),

    /*
     * GOALS
     *
     * Actual database table:
     * money_goals
     */
    supabaseAdmin
      .from("money_goals")
      .select(
        `
          id,
          name,
          description,
          ownership_type,
          target_amount,
          monthly_target,
          start_date,
          target_date,
          status
        `
      )
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      }),

    /*
     * GOAL CONTRIBUTIONS
     *
     * Actual database table:
     * money_goal_contributions
     */
    supabaseAdmin
      .from("money_goal_contributions")
      .select(
        `
          goal_id,
          amount
        `
      ),
  ]);

  if (accountsResult.error) {
    console.error(
      "MONEY MANAGEMENT ACCOUNTS ERROR:",
      accountsResult.error
    );
  }

  if (transactionsResult.error) {
    console.error(
      "MONEY MANAGEMENT TRANSACTIONS ERROR:",
      transactionsResult.error
    );
  }

  if (categoriesResult.error) {
    console.error(
      "MONEY MANAGEMENT CATEGORIES ERROR:",
      categoriesResult.error
    );
  }

  if (goalsResult.error) {
    console.error(
      "MONEY MANAGEMENT GOALS ERROR:",
      goalsResult.error
    );
  }

  if (contributionsResult.error) {
    console.error(
      "MONEY MANAGEMENT CONTRIBUTIONS ERROR:",
      contributionsResult.error
    );
  }

  return {
    accounts:
      (accountsResult.data || []).map(
        (account) => ({
          ...account,
          opening_balance:
            numberValue(
              account.opening_balance
            ),
        })
      ) as Account[],

    transactions:
      (transactionsResult.data || []).map(
        (transaction) => ({
          ...transaction,
          amount:
            numberValue(
              transaction.amount
            ),
        })
      ) as Transaction[],

    categories:
      (categoriesResult.data || []) as Category[],

    goals:
      (goalsResult.data || []).map(
        (goal) => ({
          ...goal,
          target_amount:
            numberValue(
              goal.target_amount
            ),
          monthly_target:
            numberValue(
              goal.monthly_target
            ),
        })
      ) as Goal[],

    contributions:
      (contributionsResult.data || []).map(
        (item) => ({
          ...item,
          amount:
            numberValue(item.amount),
        })
      ) as GoalContribution[],
  };
}

/*
============================================================
PAGE
============================================================
*/

export default async function MoneyManagementPage() {
  const {
    accounts,
    transactions,
    categories,
    goals,
    contributions,
  } =
    await getMoneyManagementData();

  /*
  ==========================================================
  ACCOUNT BALANCES
  ==========================================================
  */

  const accountBalances =
    accounts.map((account) => {
      let balance =
        numberValue(
          account.opening_balance
        );

      transactions.forEach(
        (transaction) => {
          if (
            transaction.account_id !==
            account.id
          ) {
            return;
          }

          const type =
            transaction.transaction_type
              .toLowerCase()
              .trim();

          if (
            type === "income" ||
            type === "deposit"
          ) {
            balance +=
              transaction.amount;
          }

          if (
            type === "expense" ||
            type === "withdrawal"
          ) {
            balance -=
              transaction.amount;
          }
        }
      );

      return {
        ...account,
        balance,
      };
    });

  /*
  ==========================================================
  TOTAL BALANCES
  ==========================================================
  */

  const totalBalance =
    accountBalances.reduce(
      (sum, account) =>
        sum + account.balance,
      0
    );

  const personalBalance =
    accountBalances
      .filter(
        (account) =>
          account.ownership_type ===
          "personal"
      )
      .reduce(
        (sum, account) =>
          sum + account.balance,
        0
      );

  const businessBalance =
    accountBalances
      .filter(
        (account) =>
          account.ownership_type ===
          "business"
      )
      .reduce(
        (sum, account) =>
          sum + account.balance,
        0
      );

  /*
  ==========================================================
  CURRENT MONTH
  ==========================================================
  */

  const now = new Date();

  const currentYear =
    now.getFullYear();

  const currentMonth =
    now.getMonth();

  const thisMonthTransactions =
    transactions.filter(
      (transaction) => {
        const date =
          new Date(
            transaction.transaction_date
          );

        return (
          date.getFullYear() ===
            currentYear &&
          date.getMonth() ===
            currentMonth
        );
      }
    );

  /*
  ==========================================================
  INCOME / EXPENSE
  ==========================================================
  */

  function calculateIncome(
    list: Transaction[]
  ) {
    return list
      .filter(
        (transaction) =>
          transaction.transaction_type
            .toLowerCase()
            .trim() === "income"
      )
      .reduce(
        (sum, transaction) =>
          sum + transaction.amount,
        0
      );
  }

  function calculateExpense(
    list: Transaction[]
  ) {
    return list
      .filter(
        (transaction) =>
          transaction.transaction_type
            .toLowerCase()
            .trim() === "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum + transaction.amount,
        0
      );
  }

  const monthlyIncome =
    calculateIncome(
      thisMonthTransactions
    );

  const monthlyExpense =
    calculateExpense(
      thisMonthTransactions
    );

  const monthlyNet =
    monthlyIncome -
    monthlyExpense;

  const personalIncome =
    calculateIncome(
      thisMonthTransactions.filter(
        (transaction) =>
          transaction.ownership_type ===
          "personal"
      )
    );

  const personalExpense =
    calculateExpense(
      thisMonthTransactions.filter(
        (transaction) =>
          transaction.ownership_type ===
          "personal"
      )
    );

  const businessIncome =
    calculateIncome(
      thisMonthTransactions.filter(
        (transaction) =>
          transaction.ownership_type ===
          "business"
      )
    );

  const businessExpense =
    calculateExpense(
      thisMonthTransactions.filter(
        (transaction) =>
          transaction.ownership_type ===
          "business"
      )
    );

  /*
  ==========================================================
  CATEGORY MAP
  ==========================================================
  */

  const categoryMap =
    new Map<number, string>();

  categories.forEach(
    (category) => {
      categoryMap.set(
        category.id,
        category.name
      );
    }
  );

  /*
  ==========================================================
  RECENT TRANSACTIONS
  ==========================================================
  */

  const recentTransactions =
    transactions.slice(0, 8);

  /*
  ==========================================================
  GOAL CONTRIBUTIONS
  ==========================================================
  */

  const contributionMap =
    new Map<number, number>();

  contributions.forEach(
    (contribution) => {
      const existing =
        contributionMap.get(
          contribution.goal_id
        ) || 0;

      contributionMap.set(
        contribution.goal_id,
        existing +
          contribution.amount
      );
    }
  );

  /*
  ==========================================================
  GOAL DATA
  ==========================================================
  */

  const goalData =
    goals.map((goal) => {
      const contributed =
        contributionMap.get(
          goal.id
        ) || 0;

      const percentage =
        goal.target_amount > 0
          ? Math.min(
              100,
              (contributed /
                goal.target_amount) *
                100
            )
          : 0;

      return {
        ...goal,
        contributed,
        remaining:
          Math.max(
            0,
            goal.target_amount -
              contributed
          ),
        percentage,
      };
    });

  /*
  ==========================================================
  PAGE UI
  ==========================================================
  */

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* HEADER */}

        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-100 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                <CircleDollarSign
                  size={16}
                />
                Money Management
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Personal & Business Money
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                Manage your money, accounts,
                income, expenses and goals
                from one place.
              </p>

            </div>

            {/* QUICK ACTIONS */}

            <div className="flex flex-wrap gap-2">

              <Link
                href="/admin/money-management/accounts"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Wallet size={17} />
                Accounts
              </Link>

              <Link
                href="/admin/money-management/transactions"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Transaction
              </Link>

            </div>

          </div>

        </div>

        {/* BALANCE CARDS */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {money(totalBalance)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={22} />
              </div>

            </div>

          </div>

          {/* PERSONAL */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Personal Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {money(personalBalance)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <CreditCard size={22} />
              </div>

            </div>

          </div>

          {/* BUSINESS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Business Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {money(businessBalance)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={22} />
              </div>

            </div>

          </div>

          {/* NET */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  This Month Net
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${
                    monthlyNet >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {money(monthlyNet)}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  monthlyNet >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {monthlyNet >= 0 ? (
                  <TrendingUp size={22} />
                ) : (
                  <TrendingDown size={22} />
                )}
              </div>

            </div>

          </div>

        </div>

        {/* MONTHLY FLOW */}

        <div className="grid gap-4 lg:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowUpRight
                  size={21}
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  This Month Income
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {money(monthlyIncome)}
                </p>
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <ArrowDownRight
                  size={21}
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  This Month Expense
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {money(monthlyExpense)}
                </p>
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ArrowRightLeft
                  size={21}
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Transactions This Month
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {thisMonthTransactions.length}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* PERSONAL / BUSINESS */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* PERSONAL */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Personal
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  This month
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                <CreditCard
                  size={20}
                />
              </div>

            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">

              <div className="rounded-xl bg-emerald-50 p-4">

                <p className="text-xs font-medium text-emerald-700">
                  Income
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-800">
                  {money(
                    personalIncome
                  )}
                </p>

              </div>

              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-xs font-medium text-red-700">
                  Expense
                </p>

                <p className="mt-1 text-lg font-bold text-red-800">
                  {money(
                    personalExpense
                  )}
                </p>

              </div>

            </div>

          </div>

          {/* BUSINESS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Business
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  This month
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <TrendingUp
                  size={20}
                />
              </div>

            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">

              <div className="rounded-xl bg-emerald-50 p-4">

                <p className="text-xs font-medium text-emerald-700">
                  Income
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-800">
                  {money(
                    businessIncome
                  )}
                </p>

              </div>

              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-xs font-medium text-red-700">
                  Expense
                </p>

                <p className="mt-1 text-lg font-bold text-red-800">
                  {money(
                    businessExpense
                  )}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ACCOUNTS */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Accounts
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your current active accounts
              </p>
            </div>

            <Link
              href="/admin/money-management/accounts"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage
              <ChevronRight
                size={16}
              />
            </Link>

          </div>

          {accountBalances.length === 0 ? (
            <div className="px-6 py-10 text-center">

              <Wallet
                size={32}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 font-semibold text-gray-700">
                No accounts yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add your bank, cash or wallet
                account to start.
              </p>

              <Link
                href="/admin/money-management/accounts"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Account
              </Link>

            </div>
          ) : (

            <div className="divide-y divide-gray-100">

              {accountBalances
                .slice(0, 6)
                .map((account) => (

                  <div
                    key={account.id}
                    className="flex items-center justify-between px-6 py-4"
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                        <Wallet
                          size={19}
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-semibold text-gray-900">
                          {account.name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {ownershipLabel(
                            account.ownership_type
                          )}
                          {" • "}
                          {account.account_type}
                        </p>

                      </div>

                    </div>

                    <p
                      className={`ml-4 whitespace-nowrap font-bold ${
                        account.balance >= 0
                          ? "text-gray-900"
                          : "text-red-600"
                      }`}
                    >
                      {money(
                        account.balance
                      )}
                    </p>

                  </div>

                ))}

            </div>

          )}

        </div>

        {/* GOALS + RECENT TRANSACTIONS */}

        <div className="grid gap-6 xl:grid-cols-2">

          {/* GOALS */}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Active Goals
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Track the plans you are working toward
                </p>
              </div>

              <Link
                href="/admin/money-management/goals"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage
                <ChevronRight
                  size={16}
                />
              </Link>

            </div>

            {goalData.length === 0 ? (

              <div className="px-6 py-10 text-center">

                <Target
                  size={32}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-3 font-semibold text-gray-700">
                  No active goals
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Create a goal when you have a
                  specific target to work toward.
                </p>

              </div>

            ) : (

              <div className="space-y-5 p-6">

                {goalData
                  .slice(0, 4)
                  .map((goal) => (

                    <div
                      key={goal.id}
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-gray-900">
                            {goal.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {ownershipLabel(
                              goal.ownership_type
                            )}
                            {" • "}
                            {money(
                              goal.contributed
                            )}{" "}
                            of{" "}
                            {money(
                              goal.target_amount
                            )}
                          </p>

                        </div>

                        <span className="shrink-0 text-sm font-bold text-blue-600">
                          {goal.percentage.toFixed(
                            0
                          )}
                          %
                        </span>

                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${goal.percentage}%`,
                          }}
                        />

                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">

                        <span>
                          Remaining{" "}
                          {money(
                            goal.remaining
                          )}
                        </span>

                        {goal.monthly_target >
                          0 && (
                          <span>
                            Monthly{" "}
                            {money(
                              goal.monthly_target
                            )}
                          </span>
                        )}

                      </div>

                    </div>

                  ))}

              </div>

            )}

          </div>

          {/* RECENT TRANSACTIONS */}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Recent Transactions
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Latest money movements
                </p>
              </div>

              <Link
                href="/admin/money-management/transactions"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
                <ChevronRight
                  size={16}
                />
              </Link>

            </div>

            {recentTransactions.length ===
            0 ? (

              <div className="px-6 py-10 text-center">

                <ArrowRightLeft
                  size={32}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-3 font-semibold text-gray-700">
                  No transactions yet
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Your income and expenses will
                  appear here.
                </p>

              </div>

            ) : (

              <div className="divide-y divide-gray-100">

                {recentTransactions.map(
                  (transaction) => {

                    const type =
                      transaction.transaction_type
                        .toLowerCase()
                        .trim();

                    const isIncome =
                      type === "income";

                    const isTransfer =
                      type === "transfer";

                    return (
                      <div
                        key={
                          transaction.id
                        }
                        className="flex items-center justify-between gap-4 px-6 py-4"
                      >

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
                                size={19}
                              />
                            ) : isTransfer ? (
                              <ArrowRightLeft
                                size={19}
                              />
                            ) : (
                              <ArrowDownRight
                                size={19}
                              />
                            )}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-gray-900">
                              {transaction.description ||
                                categoryMap.get(
                                  transaction.category_id ||
                                    0
                                ) ||
                                "Transaction"}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {ownershipLabel(
                                transaction.ownership_type
                              )}
                              {" • "}
                              {formatDate(
                                transaction.transaction_date
                              )}
                            </p>

                          </div>

                        </div>

                        <p
                          className={`shrink-0 text-sm font-bold ${
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
                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>

      </div>

    </main>
  );
}