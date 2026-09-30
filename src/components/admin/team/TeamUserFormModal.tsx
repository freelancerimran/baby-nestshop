"use client";

import { FormEvent, useState } from "react";

type Role = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_system_role: boolean;
  is_active: boolean;
};

type TeamUserFormModalProps = {
  open: boolean;
  roles: Role[];
  onClose: () => void;
  onCreated: () => void;
};

export default function TeamUserFormModal({
  open,
  roles,
  onClose,
  onCreated,
}: TeamUserFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [joiningDate, setJoiningDate] =
    useState("");

  const [roleId, setRoleId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  if (!open) {
    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setError(
        "Email or mobile number is required."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (!roleId) {
      setError("Please select a role.");
      return;
    }

    try {
      setLoading(true);

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
              fullName.trim(),

            email:
              email.trim() ||
              undefined,

            phone:
              phone.trim() ||
              undefined,

            password,

            job_title:
              jobTitle.trim() ||
              undefined,

            joining_date:
              joiningDate ||
              null,

            role_id: Number(roleId),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to create user."
        );
      }

      /*
       * Reset form
       */
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setJobTitle("");
      setJoiningDate("");
      setRoleId("");

      onCreated();
      onClose();
    } catch (err) {
      console.error(
        "Create team user error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create user."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add Team User
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Create a new ERP team account.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-6"
        >
          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Full Name *
            </label>

            <input
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
              placeholder="Enter full name"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="name@example.com"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Mobile Number
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
              placeholder="01XXXXXXXXX"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />

            <p className="mt-1 text-xs text-slate-400">
              Native phone authentication requires
              phone authentication to be configured
              in Supabase.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password *
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Minimum 8 characters"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
          </div>

          {/* Job Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Job Title
            </label>

            <input
              value={jobTitle}
              onChange={(event) =>
                setJobTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Sales Executive"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
          </div>

          {/* Joining Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Joining Date
            </label>

            <input
              type="date"
              value={joiningDate}
              onChange={(event) =>
                setJoiningDate(
                  event.target.value
                )
              }
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Role *
            </label>

            <select
              value={roleId}
              onChange={(event) =>
                setRoleId(
                  event.target.value
                )
              }
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            >
              <option value="">
                Select role
              </option>

              {roles
                .filter(
                  (role) =>
                    role.is_active
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
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}