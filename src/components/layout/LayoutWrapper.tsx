"use client";

import { usePathname } from "next/navigation";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdmin =
    pathname.startsWith("/admin");

  const isLandingPage =
    pathname.startsWith("/lp/");

  const shouldHide =
    isAdmin || isLandingPage;

  return (
    <>
      {!shouldHide && children}
    </>
  );
}