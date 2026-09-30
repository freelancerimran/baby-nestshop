"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "/api/admin/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Login failed. Please check your credentials."
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h1>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <input
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="Email or Mobile Number"
            value={identifier}
            onChange={(e) =>
              setIdentifier(e.target.value)
            }
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            required
            disabled={loading}
          />

          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            required
            disabled={loading}
          />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-red-600 text-sm">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              !identifier.trim() ||
              !password
            }
            className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}