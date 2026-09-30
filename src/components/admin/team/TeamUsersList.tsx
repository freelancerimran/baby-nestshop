"use client";

import { useEffect, useMemo, useState } from "react";

type Role = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_system_role: boolean;
  is_active: boolean;
};

type User = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: Role[];
};

type TeamUsersListProps = {
  onAddUser: () => void;
  refreshKey: number;
};

export default function TeamUsersList({
  onAddUser,
  refreshKey,
}: TeamUsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/team/users",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load team members."
        );
      }

      setUsers(data.users ?? []);
      setRoles(data.roles ?? []);
    } catch (err) {
      console.error(
        "Team users loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load team members."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const name =
        user.full_name?.toLowerCase() ?? "";

      const email =
        user.email?.toLowerCase() ?? "";

      const phone =
        user.phone?.toLowerCase() ?? "";

      const jobTitle =
        user.job_title?.toLowerCase() ?? "";

      const roleNames = user.roles
        .map((role) =>
          role.name.toLowerCase()
        )
        .join(" ");

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        jobTitle.includes(query) ||
        roleNames.includes(query)
      );
    });
  }, [users, search]);

  const activeCount = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveCount =
    users.length - activeCount;

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">
            Team Members
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage users, roles and account status.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddUser}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      {/* Search */}
      <div className="border-b p-5">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search name, email, phone or role..."
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Summary */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-4 border-b px-5 py-4 text-sm">
          <span className="text-slate-500">
            Total:{" "}
            <strong className="text-slate-900">
              {users.length}
            </strong>
          </span>

          <span className="text-slate-500">
            Active:{" "}
            <strong className="text-green-600">
              {activeCount}
            </strong>
          </span>

          <span className="text-slate-500">
            Inactive:{" "}
            <strong className="text-red-600">
              {inactiveCount}
            </strong>
          </span>

          <span className="text-slate-500">
            Roles:{" "}
            <strong className="text-slate-900">
              {roles.length}
            </strong>
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-10 text-center text-sm text-slate-500">
          Loading team members...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        filteredUsers.length === 0 && (
          <div className="p-10 text-center">
            <div className="text-sm font-medium text-slate-900">
              {search
                ? "No users found."
                : "No team members found."}
            </div>

            {!search && (
              <p className="mt-1 text-sm text-slate-500">
                Create your first team member.
              </p>
            )}
          </div>
        )}

      {/* Desktop Table */}
      {!loading &&
        !error &&
        filteredUsers.length > 0 && (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    User
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Contact
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Role
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Status
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-600">
                    Joining Date
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {(
                            user.full_name ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">
                            {user.full_name ||
                              "Unnamed User"}
                          </div>

                          {user.job_title && (
                            <div className="text-xs text-slate-500">
                              {user.job_title}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {user.email && (
                          <div className="text-slate-700">
                            {user.email}
                          </div>
                        )}

                        {user.phone && (
                          <div className="text-xs text-slate-500">
                            {user.phone}
                          </div>
                        )}

                        {!user.email &&
                          !user.phone && (
                            <span className="text-slate-400">
                              —
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role.id}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                              {role.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">
                            No role
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {user.is_active ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Joining */}
                    <td className="px-5 py-4 text-slate-600">
                      {user.joining_date
                        ? new Date(
                            user.joining_date
                          ).toLocaleDateString(
                            "en-GB"
                          )
                        : "—"}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Mobile Cards */}
      {!loading &&
        !error &&
        filteredUsers.length > 0 && (
          <div className="divide-y md:hidden">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {(
                      user.full_name ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900">
                      {user.full_name ||
                        "Unnamed User"}
                    </div>

                    {user.job_title && (
                      <div className="mt-0.5 text-xs text-slate-500">
                        {user.job_title}
                      </div>
                    )}

                    <div className="mt-3 space-y-1 text-sm">
                      {user.email && (
                        <div className="break-all text-slate-600">
                          {user.email}
                        </div>
                      )}

                      {user.phone && (
                        <div className="text-slate-500">
                          {user.phone}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {role.name}
                        </span>
                      ))}

                      {user.is_active ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}