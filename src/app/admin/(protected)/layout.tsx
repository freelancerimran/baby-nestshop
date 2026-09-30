import { redirect } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileLayout from "@/components/admin/AdminMobileLayout";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * Get the current Supabase Auth session/user.
   */
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  /*
   * No valid Supabase user = not authenticated.
   */
  if (userError || !user) {
    redirect("/admin/login");
  }

  /*
   * Check the user's profile.
   *
   * This makes sure that a valid Supabase Auth account
   * also has a Baby Nest profile and that the account
   * has not been deactivated.
   */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  /*
   * Missing profile or database error = deny access.
   */
  if (profileError || !profile) {
    redirect("/admin/login");
  }

  /*
   * Deactivated account = deny access.
   */
  if (!profile.is_active) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Header + Drawer */}
        <div className="lg:hidden">
          <AdminMobileLayout>
            {children}
          </AdminMobileLayout>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block">
          {children}
        </div>
      </div>
    </div>
  );
}