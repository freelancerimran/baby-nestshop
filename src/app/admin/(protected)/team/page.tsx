import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { hasPermission } from "@/lib/permissions";

import TeamManagementClient from "../../../../components/admin/team/TeamManagementClient";

export default async function TeamPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/admin/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !profile.is_active
  ) {
    redirect("/admin/login");
  }

  const canViewTeam = await hasPermission(
    "team",
    "view"
  );

  if (!canViewTeam) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">
              Access Denied
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              You do not have permission to view Team Management.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <TeamManagementClient />;
}