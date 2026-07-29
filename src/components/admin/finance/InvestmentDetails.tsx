"use client";

import {
  useState,
  type ReactNode,
} from "react";

import {
  Pencil,
  X,
  Package,
  Truck,
  Boxes,
  CircleDollarSign,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import type { Investment } from "@/types/finance";

/*
==========================================
PROPS
==========================================
*/

interface InvestmentDetailsProps {
  open: boolean;

  investment: Investment | null;

  onClose: () => void;

  onEdit?: (
    investment: Investment
  ) => void;

  onDeleteSuccess?: (
    investment: Investment
  ) => void | Promise<void>;
}

/*
==========================================
HELPERS
==========================================
*/

function money(value?: number) {
  return `৳${Number(
    value || 0
  ).toLocaleString("en-GB", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date?: string) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/*
==========================================
INVESTMENT DETAILS
==========================================
*/

export default function InvestmentDetails({
  open,
  investment,
  onClose,
  onEdit,
  onDeleteSuccess,
}: InvestmentDetailsProps) {
  /*
  ========================================
  DELETE STATE
  ========================================
  */

  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  /*
  ========================================
  CLOSED STATE
  ========================================
  */

  if (
    !open ||
    !investment
  ) {
    return null;
  }
const currentInvestment = investment;
  /*
  ========================================
  DATA
  ========================================
  */

  const items =
    investment.items || [];

  const totalInvestment =
    Number(
      investment.totalInvestment ||
        0
    );

  const potentialRevenue =
    Number(
      investment.potentialRevenue ||
        0
    );

  const potentialProfit =
    Number(
      investment.potentialProfit ||
        0
    );

  const actualRevenue =
    Number(
      investment.actualRevenue ||
        0
    );

  const realizedProfit =
    Number(
      investment.realizedProfit ||
        0
    );

  const totalUnits =
    Number(
      investment.totalUnits ||
        0
    );

  const soldUnits =
    Number(
      investment.soldUnits ||
        0
    );

  const remainingUnits =
    Number(
      investment.remainingUnits ||
        0
    );

  const recovery =
    Number(
      investment.recoveryPercentage ||
        0
    );

  /*
  ========================================
  OPEN DELETE CONFIRMATION
  ========================================
  */

  function openDeleteConfirmation() {
    setDeleteError("");
    setShowDeleteConfirm(true);
  }

  /*
  ========================================
  CLOSE DELETE CONFIRMATION
  ========================================
  */

  function closeDeleteConfirmation() {
    if (deleting) {
      return;
    }

    setDeleteError("");
    setShowDeleteConfirm(false);
  }

  /*
  ========================================
  DELETE INVESTMENT
  ========================================
  */

async function handleDeleteInvestment() {
  if (
    currentInvestment.id ===
      undefined ||
    currentInvestment.id === null
  ) {
    setDeleteError(
      "Investment ID is missing. This investment cannot be deleted."
    );

    return;
  }

  try {
    setDeleting(true);
    setDeleteError("");

    const response = await fetch(
      `/api/admin/finance/investments/${currentInvestment.id}`,
      {
        method: "DELETE",
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data?.success
    ) {
      throw new Error(
        data?.error ||
          data?.message ||
          "Could not delete investment."
      );
    }

    setShowDeleteConfirm(false);

    if (onDeleteSuccess) {
      await onDeleteSuccess(
        currentInvestment
      );
    } else {
      onClose();
    }
  } catch (error) {
    console.error(
      "DELETE INVESTMENT ERROR:",
      error
    );

    setDeleteError(
      error instanceof Error
        ? error.message
        : "Could not delete investment."
    );
  } finally {
    setDeleting(false);
  }
}

  /*
  ========================================
  UI
  ========================================
  */

  return (
    <>
      {/* ================================= */}
      {/* INVESTMENT DETAILS MODAL */}
      {/* ================================= */}

      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
        <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
          {/* ========================= */}
          {/* HEADER */}
          {/* ========================= */}

          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Investment Details
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {investment.investmentName ||
                  "Investment"}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-500">
                  {investment.investmentCode ||
                    "—"}
                </span>

                <span className="text-slate-300">
                  •
                </span>

                <span className="text-sm text-slate-500">
                  {formatDate(
                    investment.investmentDate
                  )}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    investment.status ===
                    "completed"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {investment.status ||
                    "Active"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              aria-label="Close investment details"
            >
              <X size={20} />
            </button>
          </div>

          {/* ========================= */}
          {/* SCROLLABLE BODY */}
          {/* ========================= */}

          <div className="overflow-y-auto">
            <div className="space-y-7 p-6 lg:p-8">
              {/* ========================= */}
              {/* SUMMARY */}
              {/* ========================= */}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Total Investment"
                  value={money(
                    totalInvestment
                  )}
                  subtitle="Total invested capital"
                />

                <SummaryCard
                  title="Potential Revenue"
                  value={money(
                    potentialRevenue
                  )}
                  subtitle="Expected total sales"
                />

                <SummaryCard
                  title="Potential Profit"
                  value={money(
                    potentialProfit
                  )}
                  subtitle="Expected profit"
                />

                <SummaryCard
                  title="Investment Recovery"
                  value={`${recovery.toFixed(
                    1
                  )}%`}
                  subtitle={`${money(
                    actualRevenue
                  )} recovered`}
                />
              </div>

              {/* ========================= */}
              {/* ACTUAL PERFORMANCE */}
              {/* ========================= */}

              <section className="rounded-3xl bg-slate-950 p-5 text-white lg:p-6">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Live Performance
                  </p>

                  <h3 className="mt-1 text-xl font-bold">
                    Actual Performance
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DarkCard
                    label="Actual Revenue"
                    value={money(
                      actualRevenue
                    )}
                  />

                  <DarkCard
                    label="Realized Profit"
                    value={money(
                      realizedProfit
                    )}
                  />

                  <DarkCard
                    label="Sold Units"
                    value={`${soldUnits}`}
                  />

                  <DarkCard
                    label="Remaining Units"
                    value={`${remainingUnits}`}
                  />
                </div>
              </section>

              {/* ========================= */}
              {/* INVESTMENT INFORMATION */}
              {/* ========================= */}

              <section className="rounded-3xl border border-slate-200 bg-white p-5 lg:p-6">
                <h3 className="text-lg font-bold text-slate-950">
                  Investment Information
                </h3>

                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <Info
                    label="Investment Name"
                    value={
                      investment.investmentName ||
                      "—"
                    }
                  />

                  <Info
                    label="Investment Code"
                    value={
                      investment.investmentCode ||
                      "—"
                    }
                  />

                  <Info
                    label="Investment Date"
                    value={formatDate(
                      investment.investmentDate
                    )}
                  />

                  <Info
                    label="Supplier"
                    value={
                      investment.supplier ||
                      "—"
                    }
                  />
                </div>
              </section>

              {/* ========================= */}
              {/* PRODUCTS */}
              {/* ========================= */}

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 lg:px-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package
                        size={19}
                        className="text-blue-600"
                      />

                      <h3 className="text-lg font-bold text-slate-950">
                        Products
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Products purchased
                      under this investment
                      batch.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {items.length}{" "}
                    {items.length === 1
                      ? "Product"
                      : "Products"}
                  </span>
                </div>

                {items.length ===
                0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    No products found for
                    this investment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <TableHeader>
                            Product
                          </TableHeader>

                          <TableHeader>
                            Qty
                          </TableHeader>

                          <TableHeader>
                            Unit Cost
                          </TableHeader>

                          <TableHeader>
                            Selling Price
                          </TableHeader>

                          <TableHeader>
                            Purchase Cost
                          </TableHeader>

                          <TableHeader>
                            Potential Sales
                          </TableHeader>

                          <TableHeader>
                            Sold
                          </TableHeader>

                          <TableHeader>
                            Remaining
                          </TableHeader>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {items.map(
                          (
                            item,
                            index
                          ) => {
                            const quantity =
                              Number(
                                item.quantity ||
                                  0
                              );

                            const unitCost =
                              Number(
                                item.unitCost ||
                                  0
                              );

                            const sellingPrice =
                              Number(
                                item.sellingPrice ||
                                  0
                              );

                            const sold =
                              Number(
                                item.soldQuantity ||
                                  0
                              );

                            const remaining =
                              item.remainingQuantity ??
                              Math.max(
                                quantity -
                                  sold,
                                0
                              );

                            const purchaseCost =
                              quantity *
                              unitCost;

                            const potentialSales =
                              quantity *
                              sellingPrice;

                            return (
                              <tr
                                key={
                                  item.id ??
                                  `${item.productId}-${index}`
                                }
                                className="text-sm"
                              >
                                <td className="px-6 py-5">
                                  <p className="font-semibold text-slate-900">
                                    {item.productName ||
                                      "Product"}
                                  </p>

                                  {item.productId !=
                                    null && (
                                    <p className="mt-1 text-xs text-slate-400">
                                      Product
                                      ID:{" "}
                                      {
                                        item.productId
                                      }
                                    </p>
                                  )}
                                </td>

                                <td className="px-6 py-5 font-semibold text-slate-700">
                                  {
                                    quantity
                                  }
                                </td>

                                <td className="px-6 py-5 text-slate-600">
                                  {money(
                                    unitCost
                                  )}
                                </td>

                                <td className="px-6 py-5 font-semibold text-blue-600">
                                  {money(
                                    sellingPrice
                                  )}
                                </td>

                                <td className="px-6 py-5 font-semibold text-slate-900">
                                  {money(
                                    purchaseCost
                                  )}
                                </td>

                                <td className="px-6 py-5 font-semibold text-emerald-600">
                                  {money(
                                    potentialSales
                                  )}
                                </td>

                                <td className="px-6 py-5">
                                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                    {
                                      sold
                                    }
                                  </span>
                                </td>

                                <td className="px-6 py-5">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                    {
                                      remaining
                                    }
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* ========================= */}
              {/* ADDITIONAL COSTS */}
              {/* ========================= */}

              <section className="rounded-3xl border border-slate-200 bg-white p-5 lg:p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-950">
                    Additional Costs
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Additional expenses
                    included in this
                    investment.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <CostCard
                    icon={
                      <Truck
                        size={18}
                      />
                    }
                    label="Shipping"
                    value={
                      investment.shippingCost
                    }
                  />

                  <CostCard
                    icon={
                      <CircleDollarSign
                        size={18}
                      />
                    }
                    label="Customs"
                    value={
                      investment.customsCost
                    }
                  />

                  <CostCard
                    icon={
                      <Boxes
                        size={18}
                      />
                    }
                    label="Packaging"
                    value={
                      investment.packagingCost
                    }
                  />

                  <CostCard
                    icon={
                      <CircleDollarSign
                        size={18}
                      />
                    }
                    label="Other"
                    value={
                      investment.otherCost
                    }
                  />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
                  <span className="text-sm font-medium text-slate-500">
                    Total Additional
                    Costs
                  </span>

                  <span className="text-lg font-bold text-slate-950">
                    {money(
                      investment.extraCost
                    )}
                  </span>
                </div>
              </section>

              {/* ========================= */}
              {/* NOTES */}
              {/* ========================= */}

              {investment.notes && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 lg:p-6">
                  <h3 className="text-lg font-bold text-slate-950">
                    Notes
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {investment.notes}
                  </p>
                </section>
              )}

              {/* ========================= */}
              {/* COST BREAKDOWN */}
              {/* ========================= */}

              <section className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 lg:p-6">
                <h3 className="text-lg font-bold text-slate-950">
                  Investment Breakdown
                </h3>

                <div className="mt-5 space-y-3">
                  <BreakdownRow
                    label="Product Cost"
                    value={money(
                      investment.productCost
                    )}
                  />

                  <BreakdownRow
                    label="Additional Costs"
                    value={money(
                      investment.extraCost
                    )}
                  />

                  <div className="border-t border-blue-100 pt-3">
                    <BreakdownRow
                      label="Total Investment"
                      value={money(
                        totalInvestment
                      )}
                      strong
                    />
                  </div>
                </div>
              </section>

              {/* ========================= */}
              {/* DELETE SAFETY INFO */}
              {/* ========================= */}

              {soldUnits > 0 && (
                <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <TriangleAlert
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                      <h3 className="font-bold text-amber-900">
                        Permanent deletion
                        is locked
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-amber-700">
                        This investment
                        already contains{" "}
                        {soldUnits} sold
                        unit
                        {soldUnits === 1
                          ? ""
                          : "s"}
                        . Investments with
                        recorded sales
                        cannot be
                        permanently
                        deleted.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* ========================= */}
          {/* FOOTER */}
          {/* ========================= */}

          <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="hidden text-sm text-slate-500 sm:block">
              {totalUnits} units
              purchased under this
              batch
            </div>

            <div className="ml-auto flex flex-wrap justify-end gap-3">
              {/* DELETE */}

              <button
                type="button"
                onClick={
                  openDeleteConfirmation
                }
                disabled={
                  deleting ||
                  soldUnits > 0
                }
                title={
                  soldUnits > 0
                    ? "Investments with recorded sales cannot be deleted."
                    : "Delete investment"
                }
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2
                  size={16}
                />

                Delete Investment
              </button>

              {/* CLOSE */}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              {/* EDIT */}

              <button
                type="button"
                onClick={() =>
                  onEdit?.(
                    investment
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Pencil
                  size={16}
                />

                Edit Investment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================= */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Trash2
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Delete
                    Investment?
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    This action cannot
                    be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeDeleteConfirmation
                }
                disabled={deleting}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close delete confirmation"
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}

            <div className="p-6">
              <p className="text-sm leading-6 text-slate-600">
                You are about to
                permanently delete:
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-slate-950">
                  {investment.investmentName ||
                    "Investment"}
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  {investment.investmentCode ||
                    "No investment code"}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      Investment
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {money(
                        totalInvestment
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Units
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {totalUnits}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                <TriangleAlert
                  size={19}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm leading-6 text-red-700">
                  The investment batch
                  and all products
                  recorded under this
                  batch will be
                  permanently removed.
                </p>
              </div>

              {/* DELETE ERROR */}

              {deleteError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700">
                  {deleteError}
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 p-5">
              <button
                type="button"
                onClick={
                  closeDeleteConfirmation
                }
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteInvestment
                }
                disabled={deleting}
                className="flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2
                  size={16}
                />

                {deleting
                  ? "Deleting..."
                  : "Delete Investment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/*
==========================================
COMPONENTS
==========================================
*/

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

function DarkCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function CostCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-sm">
          {label}
        </span>
      </div>

      <p className="mt-3 text-lg font-bold text-slate-950">
        {money(value)}
      </p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "font-bold text-slate-950"
            : "text-sm text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-lg font-bold text-slate-950"
            : "text-sm font-semibold text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}