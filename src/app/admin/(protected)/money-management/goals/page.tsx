"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Target,
} from "lucide-react";

import GoalsList from "@/components/admin/money-management/goals/GoalsList";
import GoalFormModal from "@/components/admin/money-management/goals/GoalFormModal";
import GoalContributionModal from "@/components/admin/money-management/goals/GoalContributionModal";

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

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

function calculatePercentage(
  contributed: number,
  target: number
): number {
  if (target <= 0) {
    return 0;
  }

  const percentage =
    (contributed / target) * 100;

  return Math.min(
    100,
    Math.max(0, percentage)
  );
}

export default function GoalsPage() {
  const [goals, setGoals] =
    useState<Goal[]>([]);

  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [accountsLoading, setAccountsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    contributionModalOpen,
    setContributionModalOpen,
  ] = useState(false);

  const [editingGoal, setEditingGoal] =
    useState<Goal | null>(null);

  const [
    contributionGoal,
    setContributionGoal,
  ] = useState<Goal | null>(null);

  const [
    editingContribution,
    setEditingContribution,
  ] = useState<Contribution | null>(
    null
  );

  async function loadGoals() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/money-management/goals",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Failed to load goals."
        );
      }

      const incomingGoals =
        Array.isArray(result.goals)
          ? result.goals
          : [];

      /*
       * Load all contributions so that
       * every goal can display its history.
       */

      let contributions: Contribution[] =
        [];

      try {
        const contributionsResponse =
          await fetch(
            "/api/admin/money-management/goals/contributions",
            {
              cache: "no-store",
            }
          );

        const contributionsResult =
          await contributionsResponse.json();

        if (
          contributionsResponse.ok &&
          contributionsResult.success &&
          Array.isArray(
            contributionsResult.contributions
          )
        ) {
          contributions =
            contributionsResult.contributions.map(
              (
                item: Contribution
              ) => ({
                ...item,
                amount: toNumber(
                  item.amount
                ),
              })
            );
        }
      } catch (contributionError) {
        console.error(
          "GOAL CONTRIBUTIONS LOAD ERROR:",
          contributionError
        );
      }

      /*
       * Account names
       */

      const accountMap =
        new Map<number, string>();

      accounts.forEach(
        (account) => {
          accountMap.set(
            account.id,
            account.name
          );
        }
      );

      const contributionsByGoal =
        new Map<
          number,
          Contribution[]
        >();

      contributions.forEach(
        (contribution) => {
          const list =
            contributionsByGoal.get(
              contribution.goal_id
            ) || [];

          list.push({
            ...contribution,
            account_name:
              contribution.account_id !==
                null &&
              contribution.account_id !==
                undefined
                ? accountMap.get(
                    contribution.account_id
                  ) || null
                : null,
          });

          contributionsByGoal.set(
            contribution.goal_id,
            list
          );
        }
      );

      const normalizedGoals =
        incomingGoals.map(
          (goal: Goal) => {
            const target =
              toNumber(
                goal.target_amount
              );

            const contributionList =
              contributionsByGoal.get(
                goal.id
              ) || [];

            /*
             * Use contribution records
             * as the source of truth.
             */

            const contributionTotal =
              contributionList.reduce(
                (
                  sum,
                  contribution
                ) =>
                  sum +
                  toNumber(
                    contribution.amount
                  ),
                0
              );

            /*
             * If the goals API already
             * provides a contributed value,
             * use it when contribution
             * history is unavailable.
             */

            const contributed =
              contributionList.length > 0
                ? contributionTotal
                : toNumber(
                    goal.contributed
                  );

            const remaining =
              Math.max(
                0,
                target -
                  contributed
              );

            const percentage =
              calculatePercentage(
                contributed,
                target
              );

            return {
              ...goal,

              target_amount:
                target,

              monthly_target:
                toNumber(
                  goal.monthly_target
                ),

              contributed,

              remaining,

              percentage,

              contribution_count:
                contributionList.length ||
                toNumber(
                  goal.contribution_count
                ),

              contributions:
                contributionList,
            };
          }
        );

      setGoals(
        normalizedGoals
      );
    } catch (err) {
      console.error(
        "GOALS PAGE LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load goals."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAccounts() {
    try {
      setAccountsLoading(true);

      const response =
        await fetch(
          "/api/admin/money-management/accounts",
          {
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Failed to load accounts."
        );
      }

      const incomingAccounts =
        Array.isArray(
          result.accounts
        )
          ? result.accounts
          : [];

      const normalizedAccounts =
        incomingAccounts.map(
          (account: Account) => ({
            ...account,

            opening_balance:
              toNumber(
                account.opening_balance
              ),

            current_balance:
              toNumber(
                account.current_balance
              ),
          })
        );

      setAccounts(
        normalizedAccounts
      );
    } catch (err) {
      console.error(
        "GOAL ACCOUNTS LOAD ERROR:",
        err
      );
    } finally {
      setAccountsLoading(false);
    }
  }

  /*
   * Initial load
   */

  useEffect(() => {
    loadAccounts();
  }, []);

  /*
   * Reload goals after accounts
   * are available so account names
   * can be displayed in history.
   */

  useEffect(() => {
    if (!accountsLoading) {
      loadGoals();
    }
  }, [accountsLoading]);

  function handleCreate() {
    setEditingGoal(null);
    setModalOpen(true);
  }

  function handleEdit(goal: Goal) {
    setEditingGoal(goal);
    setModalOpen(true);
  }

  function handleContribute(goal: Goal) {
    setEditingContribution(null);
    setContributionGoal(goal);
    setContributionModalOpen(true);
  }

  function handleEditContribution(
    contribution: Contribution
  ) {
    const goal =
      goals.find(
        (item) =>
          item.id ===
          contribution.goal_id
      );

    if (!goal) {
      alert(
        "The goal for this contribution could not be found."
      );

      return;
    }

    setContributionGoal(goal);
    setEditingContribution(
      contribution
    );
    setContributionModalOpen(true);
  }

  async function handleDeleteContribution(
    contribution: Contribution
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete this contribution of ৳${toNumber(
          contribution.amount
        ).toLocaleString(
          "en-BD"
        )}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/admin/money-management/goals/contributions?id=${contribution.id}`,
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
            "Failed to delete contribution."
        );

        return;
      }

      await loadAccounts();
      await loadGoals();
    } catch (err) {
      console.error(
        "CONTRIBUTION DELETE ERROR:",
        err
      );

      alert(
        "Failed to delete contribution."
      );
    }
  }

  async function handleDelete(
    goal: Goal
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${goal.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/admin/money-management/goals/${goal.id}`,
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
            "Failed to delete goal."
        );

        return;
      }

      await loadGoals();
    } catch (err) {
      console.error(
        "GOAL DELETE ERROR:",
        err
      );

      alert(
        "Failed to delete goal."
      );
    }
  }

  async function handleGoalSaved() {
    await loadGoals();
  }

  async function handleContributionSaved() {
    await loadAccounts();
    await loadGoals();
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
              Goals
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Set financial goals and
              track your progress.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Goal
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadGoals}
              className="font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-semibold text-gray-600">
              Loading goals...
            </p>
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Target size={30} />
            </div>

            <h2 className="mt-5 text-xl font-black text-gray-900">
              No goals yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Create a goal when you have
              a specific financial target
              you want to work toward.
            </p>

            <button
              type="button"
              onClick={handleCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Create Your First Goal
            </button>
          </div>
        ) : (
          <GoalsList
            goals={goals}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onContribute={
              handleContribute
            }
            onEditContribution={
              handleEditContribution
            }
            onDeleteContribution={
              handleDeleteContribution
            }
          />
        )}

        {/* ACCOUNT LOADING */}

        {contributionModalOpen &&
          accountsLoading && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
              <div className="rounded-xl bg-white px-5 py-4 text-sm font-semibold text-gray-700 shadow-xl">
                Loading accounts...
              </div>
            </div>
          )}

        {/* GOAL FORM */}

        <GoalFormModal
          open={modalOpen}
          goal={editingGoal}
          onClose={() =>
            setModalOpen(false)
          }
          onSaved={
            handleGoalSaved
          }
        />

        {/* CONTRIBUTION MODAL */}

        <GoalContributionModal
          open={
            contributionModalOpen
          }
          goal={
            contributionGoal
          }
          accounts={accounts}
          contribution={
            editingContribution
          }
          onClose={() => {
            if (loading) {
              return;
            }

            setContributionModalOpen(
              false
            );

            setContributionGoal(
              null
            );

            setEditingContribution(
              null
            );
          }}
          onSaved={
            handleContributionSaved
          }
        />
      </div>
    </main>
  );
}