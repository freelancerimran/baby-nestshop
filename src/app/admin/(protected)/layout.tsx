import { redirect } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileLayout from "@/components/admin/AdminMobileLayout";

import { isAdminAuthenticated } from "@/lib/adminAuth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
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