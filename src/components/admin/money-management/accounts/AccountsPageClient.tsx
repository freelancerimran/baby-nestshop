"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AccountSummary from "./AccountSummary";
import AccountsList from "./AccountsList";
import AccountFormModal from "./AccountFormModal";

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

export default function AccountsPageClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  async function loadAccounts() {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/money-management/accounts",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "Failed to load accounts.");
        return;
      }

      setAccounts(result.accounts || []);
    } catch (error) {
      console.error("LOAD ACCOUNTS ERROR:", error);
      alert("Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(account: Account) {
    setEditing(account);
    setModalOpen(true);
  }

  async function handleDelete(account: Account) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${account.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/money-management/accounts/${account.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "Failed to delete account.");
        return;
      }

      await loadAccounts();
    } catch (error) {
      console.error("DELETE ACCOUNT ERROR:", error);
      alert("Failed to delete account.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div>
            <Link
              href="/admin/money-management"
              className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Money Management
            </Link>

            <h1 className="text-3xl font-black text-gray-900">
              Accounts
            </h1>

            <p className="mt-1 text-gray-500">
              Manage your bank, cash, wallet and other accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Account
          </button>

        </div>

        {/* SUMMARY */}
        <div className="mb-6">
          <AccountSummary accounts={accounts} />
        </div>

        {/* LIST */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="font-semibold text-gray-700">
              Loading accounts...
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Please wait.
            </p>
          </div>
        ) : (
          <AccountsList
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

      </div>

      {/* MODAL */}
      <AccountFormModal
        open={modalOpen}
        account={editing}
        onClose={() => setModalOpen(false)}
        onSaved={loadAccounts}
      />
    </main>
  );
}
