"use client";

import { Menu } from "lucide-react";

export default function AdminMobileHeader({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
      <h2 className="font-bold text-gray-900">
        Baby Nest ERP
      </h2>

      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-gray-100"
      >
        <Menu size={24} />
      </button>
    </div>
  );
}