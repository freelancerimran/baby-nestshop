"use client";

import CreateOrderForm from "@/components/admin/orders/create/CreateOrderForm";

export default function CreateOrderPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <CreateOrderForm />
      </div>
    </main>
  );
}