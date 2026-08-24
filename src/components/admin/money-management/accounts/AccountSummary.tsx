"use client";

interface Account {
  id: number;
  name: string;
  account_type: string;
  ownership_type: string;
  opening_balance: number;
  current_balance?: number;
  is_active: boolean;
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

export default function AccountSummary({
  accounts,
}: {
  accounts: Account[];
}) {
  const activeAccounts = accounts.filter(
    (account) => account.is_active
  );

  const personalBalance = activeAccounts
    .filter((account) => account.ownership_type === "personal")
    .reduce(
      (sum, account) =>
        sum + Number(account.current_balance || 0),
      0
    );

  const businessBalance = activeAccounts
    .filter((account) => account.ownership_type === "business")
    .reduce(
      (sum, account) =>
        sum + Number(account.current_balance || 0),
      0
    );

  const totalBalance = personalBalance + businessBalance;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-500">
          Total Balance
        </p>
        <p className="mt-2 text-2xl font-black text-gray-900">
          {money(totalBalance)}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Across active accounts
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-500">
          Personal
        </p>
        <p className="mt-2 text-2xl font-black text-blue-600">
          {money(personalBalance)}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Personal accounts
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-500">
          Business
        </p>
        <p className="mt-2 text-2xl font-black text-emerald-600">
          {money(businessBalance)}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Business accounts
        </p>
      </div>
    </div>
  );
}
