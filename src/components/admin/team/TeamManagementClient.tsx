"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Role = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_system_role?: boolean;
  is_active?: boolean;
};

type TeamUser = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  avatar_url?: string | null;
  job_title?: string | null;
  joining_date?: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  roles?: Role[];
};

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  job_title: string;
  joining_date: string;
  role_id: string;
};

const emptyForm: FormState = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  job_title: "",
  joining_date: "",
  role_id: "",
};

function formatBangladeshPhone(
  value: string | null | undefined
): string {
  if (!value) return "";

  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("00880")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("880") && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }

  if (digits.startsWith("88") && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith("1") && digits.length === 10) {
    return `0${digits}`;
  }

  if (/^01[3-9]\d{8}$/.test(digits)) {
    return digits;
  }

  return value;
}

function validateLocalPhone(
  value: string
): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  if (
    /^01[3-9]\d{8}$/.test(digits)
  ) {
    return digits;
  }

  if (
    digits.startsWith("880") &&
    digits.length === 13
  ) {
    const local = `0${digits.slice(3)}`;

    if (/^01[3-9]\d{8}$/.test(local)) {
      return local;
    }
  }

  if (
    digits.startsWith("88") &&
    digits.length === 12
  ) {
    const local = `0${digits.slice(2)}`;

    if (/^01[3-9]\d{8}$/.test(local)) {
      return local;
    }
  }

  return "";
}

export default function TeamManagementClient() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [createModalOpen, setCreateModalOpen] =
    useState(false);
  const [form, setForm] =
    useState<FormState>(emptyForm);
  const [creating, setCreating] =
    useState(false);
  const [createError, setCreateError] =
    useState("");

  const [manageModalOpen, setManageModalOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] =
    useState<TeamUser | null>(null);
  const [managementForm, setManagementForm] =
    useState<FormState>(emptyForm);
  const [updating, setUpdating] =
    useState(false);
  const [managementError, setManagementError] =
    useState("");

  const [deletingUserId, setDeletingUserId] =
    useState<string | null>(null);

  const loadUsers = useCallback(async () => {
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

      setUsers(
        Array.isArray(data.users)
          ? data.users
          : []
      );

      setRoles(
        Array.isArray(data.roles)
          ? data.roles
          : []
      );
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
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      const roleText =
        user.roles
          ?.map((role) => role.name)
          .join(" ") || "";

      return [
        user.full_name,
        user.email || "",
        formatBangladeshPhone(user.phone),
        user.phone || "",
        user.job_title || "",
        roleText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [users, search]);

  const activeCount = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveCount =
    users.length - activeCount;

  function updateCreateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateManagementField(
    field: keyof FormState,
    value: string
  ) {
    setManagementForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setForm(emptyForm);
    setCreateError("");
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (creating) return;

    setCreateModalOpen(false);
    setCreateError("");
    setForm(emptyForm);
  }

  async function createUser(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setCreateError("");

    if (!form.full_name.trim()) {
      setCreateError(
        "Full name is required."
      );
      return;
    }

    if (
      !form.email.trim() &&
      !form.phone.trim()
    ) {
      setCreateError(
        "Email or mobile number is required."
      );
      return;
    }

    if (
      form.phone.trim() &&
      !validateLocalPhone(form.phone)
    ) {
      setCreateError(
        "Invalid Bangladesh mobile number. Example: 01712345678"
      );
      return;
    }

    if (form.password.length < 8) {
      setCreateError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (!form.role_id) {
      setCreateError(
        "Please select a role."
      );
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(
        "/api/admin/team/users",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            full_name:
              form.full_name.trim(),
            email:
              form.email.trim(),
            phone:
              form.phone.trim(),
            password:
              form.password,
            job_title:
              form.job_title.trim(),
            joining_date:
              form.joining_date || null,
            role_id:
              Number(form.role_id),
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to create team user."
        );
      }

      closeCreateModal();
      await loadUsers();
    } catch (err) {
      console.error(
        "Team user creation error:",
        err
      );

      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create team user."
      );
    } finally {
      setCreating(false);
    }
  }

  function openManageModal(
    user: TeamUser
  ) {
    const role =
      user.roles?.[0];

    setSelectedUser(user);
    setManagementForm({
      full_name:
        user.full_name || "",
      email:
        user.email || "",
      phone:
        formatBangladeshPhone(
          user.phone
        ),
      password: "",
      job_title:
        user.job_title || "",
      joining_date:
        user.joining_date || "",
      role_id:
        role
          ? String(role.id)
          : "",
    });

    setManagementError("");
    setManageModalOpen(true);
  }

  function closeManageModal() {
    if (updating) return;

    setManageModalOpen(false);
    setSelectedUser(null);
    setManagementError("");
    setManagementForm(emptyForm);
  }

  async function updateUser(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedUser) return;

    setManagementError("");

    if (
      !managementForm.full_name.trim()
    ) {
      setManagementError(
        "Full name is required."
      );
      return;
    }

    if (
      !managementForm.email.trim() &&
      !managementForm.phone.trim()
    ) {
      setManagementError(
        "Email or mobile number is required."
      );
      return;
    }

    if (
      managementForm.phone.trim() &&
      !validateLocalPhone(
        managementForm.phone
      )
    ) {
      setManagementError(
        "Invalid Bangladesh mobile number. Example: 01712345678"
      );
      return;
    }

    if (
      !managementForm.role_id
    ) {
      setManagementError(
        "Please select a role."
      );
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        `/api/admin/team/users/${selectedUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            full_name:
              managementForm.full_name.trim(),
            email:
              managementForm.email.trim(),
            phone:
              managementForm.phone.trim(),
            job_title:
              managementForm.job_title.trim(),
            joining_date:
              managementForm.joining_date ||
              null,
            role_id:
              Number(
                managementForm.role_id
              ),
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update team user."
        );
      }

      closeManageModal();
      await loadUsers();
    } catch (err) {
      console.error(
        "Team user update error:",
        err
      );

      setManagementError(
        err instanceof Error
          ? err.message
          : "Unable to update team user."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function toggleUserStatus(
    user: TeamUser
  ) {
    const action =
      user.is_active
        ? "Deactivate"
        : "Activate";

    if (
      user.is_active &&
      window.confirm(
        `Deactivate ${user.full_name}? They will no longer be able to use the ERP.`
      ) === false
    ) {
      return;
    }

    if (
      !user.is_active &&
      window.confirm(
        `Activate ${user.full_name}?`
      ) === false
    ) {
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        `/api/admin/team/users/${user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            is_active:
              !user.is_active,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            `Unable to ${action.toLowerCase()} user.`
        );
      }

      await loadUsers();

      if (
        selectedUser?.id === user.id
      ) {
        setSelectedUser({
          ...user,
          is_active:
            !user.is_active,
        });
      }
    } catch (err) {
      console.error(
        "Team status update error:",
        err
      );

      window.alert(
        err instanceof Error
          ? err.message
          : `Unable to ${action.toLowerCase()} user.`
      );
    } finally {
      setUpdating(false);
    }
  }

  async function deleteUser(
    user: TeamUser
  ) {
    if (
      window.confirm(
        `Are you sure you want to permanently delete ${user.full_name}? This cannot be undone.`
      ) === false
    ) {
      return;
    }

    try {
      setDeletingUserId(user.id);

      const response = await fetch(
        `/api/admin/team/users/${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to delete team user."
        );
      }

      if (
        selectedUser?.id === user.id
      ) {
        closeManageModal();
      }

      await loadUsers();
    } catch (err) {
      console.error(
        "Team user deletion error:",
        err
      );

      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to delete team user."
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Team Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage team members, roles,
            permissions, and account status.
          </p>
        </div>

        <div className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600">
          Logged in as{" "}
          <span className="font-semibold text-slate-900">
            Super Admin
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Team Members"
          value={
            loading
              ? "—"
              : users.length
          }
        />

        <SummaryCard
          label="Active"
          value={
            loading
              ? "—"
              : activeCount
          }
        />

        <SummaryCard
          label="Inactive"
          value={
            loading
              ? "—"
              : inactiveCount
          }
        />

        <SummaryCard
          label="Roles"
          value={
            loading
              ? "—"
              : roles.length
          }
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Team Members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage users, roles, and
              account status.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Add User
          </button>
        </div>

        <div className="border-b border-slate-200 p-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search name, email, phone or role..."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {loading && (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading team members...
          </div>
        )}

        {!loading && error && (
          <div className="p-5">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>

            <button
              type="button"
              onClick={loadUsers}
              className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          filteredUsers.length === 0 && (
            <div className="p-10 text-center">
              <div className="text-base font-medium text-slate-800">
                {search
                  ? "No team members found."
                  : "No team members yet."}
              </div>

              {!search && (
                <p className="mt-1 text-sm text-slate-500">
                  Click &quot;+ Add User&quot; to
                  create the first team account.
                </p>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          filteredUsers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Joining Date
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {user.full_name
                                ?.trim()
                                .charAt(0)
                                .toUpperCase() ||
                                "U"}
                            </div>

                            <div>
                              <div className="font-medium text-slate-900">
                                {user.full_name}
                              </div>

                              {user.job_title && (
                                <div className="text-xs text-slate-500">
                                  {user.job_title}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          <div>
                            {user.email ||
                              "—"}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {formatBangladeshPhone(
                              user.phone
                            ) || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles &&
                            user.roles.length >
                              0 ? (
                              user.roles.map(
                                (role) => (
                                  <span
                                    key={
                                      role.id
                                    }
                                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                                  >
                                    {
                                      role.name
                                    }
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-sm text-slate-400">
                                No role
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {user.is_active ? (
                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {user.joining_date
                            ? formatDate(
                                user.joining_date
                              )
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openManageModal(
                                  user
                                )
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Manage
                            </button>

                            <button
                              type="button"
                              disabled={
                                updating ||
                                deletingUserId ===
                                  user.id
                              }
                              onClick={() =>
                                toggleUserStatus(
                                  user
                                )
                              }
                              className={
                                user.is_active
                                  ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                  : "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                              }
                            >
                              {user.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                deletingUserId ===
                                user.id
                              }
                              onClick={() =>
                                deleteUser(
                                  user
                                )
                              }
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingUserId ===
                              user.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {createModalOpen && (
        <Modal
          title="Add Team User"
          description="Create a new ERP team account."
          onClose={closeCreateModal}
          disabled={creating}
        >
          <form
            onSubmit={createUser}
            className="space-y-4"
          >
            <Field label="Full Name" required>
              <input
                value={form.full_name}
                onChange={(event) =>
                  updateCreateField(
                    "full_name",
                    event.target.value
                  )
                }
                placeholder="Enter full name"
                className={inputClass}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateCreateField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="name@example.com"
                className={inputClass}
              />
            </Field>

            <Field label="Mobile Number">
              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  updateCreateField(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="01712345678"
                inputMode="numeric"
                autoComplete="tel"
                className={inputClass}
              />

              <p className="mt-1 text-xs text-slate-400">
                Use 017XXXXXXXX format. The system
                stores it securely as E.164.
              </p>
            </Field>

            <Field label="Password" required>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateCreateField(
                    "password",
                    event.target.value
                  )
                }
                placeholder="Minimum 8 characters"
                className={inputClass}
                minLength={8}
              />
            </Field>

            <Field label="Job Title">
              <input
                value={form.job_title}
                onChange={(event) =>
                  updateCreateField(
                    "job_title",
                    event.target.value
                  )
                }
                placeholder="e.g. Sales Executive"
                className={inputClass}
              />
            </Field>

            <Field label="Joining Date">
              <input
                type="date"
                value={form.joining_date}
                onChange={(event) =>
                  updateCreateField(
                    "joining_date",
                    event.target.value
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Role" required>
              <select
                value={form.role_id}
                onChange={(event) =>
                  updateCreateField(
                    "role_id",
                    event.target.value
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Select role
                </option>

                {roles
                  .filter(
                    (role) =>
                      role.is_active !==
                      false
                  )
                  .map((role) => (
                    <option
                      key={role.id}
                      value={role.id}
                    >
                      {role.name}
                    </option>
                  ))}
              </select>
            </Field>

            {createError && (
              <ErrorBox>
                {createError}
              </ErrorBox>
            )}

            <ModalActions
              onCancel={
                closeCreateModal
              }
              loading={creating}
              submitText="Create User"
              loadingText="Creating..."
            />
          </form>
        </Modal>
      )}

      {manageModalOpen &&
        selectedUser && (
          <Modal
            title="Manage Team User"
            description={`Update ${selectedUser.full_name}'s profile, role, and account status.`}
            onClose={
              closeManageModal
            }
            disabled={updating}
          >
            <form
              onSubmit={updateUser}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    Account Status
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {selectedUser.is_active
                      ? "This account is active."
                      : "This account is inactive."}
                  </div>
                </div>

                <span
                  className={
                    selectedUser.is_active
                      ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                      : "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                  }
                >
                  {selectedUser.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <Field
                label="Full Name"
                required
              >
                <input
                  value={
                    managementForm.full_name
                  }
                  onChange={(event) =>
                    updateManagementField(
                      "full_name",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={
                    managementForm.email
                  }
                  onChange={(event) =>
                    updateManagementField(
                      "email",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Mobile Number">
                <input
                  type="tel"
                  value={
                    managementForm.phone
                  }
                  onChange={(event) =>
                    updateManagementField(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="01712345678"
                  inputMode="numeric"
                  autoComplete="tel"
                  className={inputClass}
                />

                <p className="mt-1 text-xs text-slate-400">
                  Displayed with the leading 0.
                  Backend keeps canonical E.164.
                </p>
              </Field>

              <Field label="Job Title">
                <input
                  value={
                    managementForm.job_title
                  }
                  onChange={(event) =>
                    updateManagementField(
                      "job_title",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Joining Date">
                <input
                  type="date"
                  value={
                    managementForm.joining_date
                  }
                  onChange={(event) =>
                    updateManagementField(
                      "joining_date",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field
                label="Role"
                required
              >
                <select
                  value={
                    managementForm.role_id
                  }
                  onChange={(event) =>
                    updateManagementField(
                      "role_id",
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select role
                  </option>

                  {roles
                    .filter(
                      (role) =>
                        role.is_active !==
                        false
                    )
                    .map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    ))}
                </select>
              </Field>

              {managementError && (
                <ErrorBox>
                  {managementError}
                </ErrorBox>
              )}

              <div className="border-t border-slate-200 pt-4">
                <div className="mb-3 text-sm font-semibold text-slate-800">
                  Account Actions
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      toggleUserStatus(
                        selectedUser
                      )
                    }
                    className={
                      selectedUser.is_active
                        ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                        : "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                    }
                  >
                    {selectedUser.is_active
                      ? "Deactivate User"
                      : "Activate User"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      deletingUserId ===
                      selectedUser.id
                    }
                    onClick={() =>
                      deleteUser(
                        selectedUser
                      )
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete User
                  </button>
                </div>
              </div>

              <ModalActions
                onCancel={
                  closeManageModal
                }
                loading={updating}
                submitText="Save Changes"
                loadingText="Saving..."
              />
            </form>
          </Modal>
        )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-5">
      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="mt-3 text-3xl font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function ErrorBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
      {children}
    </div>
  );
}

function Modal({
  title,
  description,
  children,
  onClose,
  disabled,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="text-2xl leading-none text-slate-400 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  loading,
  submitText,
  loadingText,
}: {
  onCancel: () => void;
  loading: boolean;
  submitText: string;
  loadingText: string;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? loadingText
          : submitText}
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}
