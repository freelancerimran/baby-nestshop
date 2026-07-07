"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
    >
      Logout
    </button>
  );
}