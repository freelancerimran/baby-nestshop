"use client";

import { useState } from "react";
import AdminMobileHeader from "./AdminMobileHeader";
import AdminMobileSidebar from "./AdminMobileSidebar";

export default function AdminMobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdminMobileHeader
        onMenuClick={() =>
          setOpen(true)
        }
      />

      <AdminMobileSidebar
        open={open}
        onClose={() =>
          setOpen(false)
        }
      />

      {children}
    </>
  );
}