"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import FinanceOverview from "@/components/admin/finance/FinanceOverview";
import CreateInvestmentModal from "@/components/admin/finance/CreateInvestmentModal";
import InvestmentList from "@/components/admin/finance/InvestmentList";
import InvestmentDetails from "@/components/admin/finance/InvestmentDetails";
import EditInvestmentModal from "@/components/admin/finance/EditInvestmentModal";
import FinanceSalesHistory from "@/components/admin/finance/FinanceSalesHistory";

import type { Investment } from "@/types/finance";

/*
==========================================
TYPES
==========================================
*/

type FinanceSummary = {
  totalInvestment: number;

  potentialRevenue: number;
  potentialProfit: number;

  actualRevenue: number;

  costOfGoods: number;
  allocatedExtraCost: number;
  realizedCost: number;

  realizedProfit: number;

  totalUnits: number;
  soldUnits: number;
  remainingUnits: number;

  roi: number;

  recoveryPercentage: number;

  salesCount: number;

  totalBatches: number;
};

/*
==========================================
EMPTY SUMMARY
==========================================
*/

const emptySummary: FinanceSummary = {
  totalInvestment: 0,

  potentialRevenue: 0,
  potentialProfit: 0,

  actualRevenue: 0,

  costOfGoods: 0,
  allocatedExtraCost: 0,
  realizedCost: 0,

  realizedProfit: 0,

  totalUnits: 0,
  soldUnits: 0,
  remainingUnits: 0,

  roi: 0,

  recoveryPercentage: 0,

  salesCount: 0,

  totalBatches: 0,
};

/*
==========================================
PAGE
==========================================
*/

export default function FinancePage() {
  /*
  ==========================================
  FINANCE DATA
  ==========================================
  */

  const [
    summary,
    setSummary,
  ] = useState<FinanceSummary>(
    emptySummary
  );

  const [
    investments,
    setInvestments,
  ] = useState<Investment[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /*
  ==========================================
  CREATE INVESTMENT MODAL
  ==========================================
  */

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  /*
  ==========================================
  INVESTMENT DETAILS MODAL
  ==========================================
  */

  const [
    selectedInvestment,
    setSelectedInvestment,
  ] = useState<Investment | null>(
    null
  );

  const [
    showDetailsModal,
    setShowDetailsModal,
  ] = useState(false);

  /*
  ==========================================
  EDIT INVESTMENT MODAL
  ==========================================
  */

  const [
    editingInvestment,
    setEditingInvestment,
  ] = useState<Investment | null>(
    null
  );

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  /*
  ==========================================
  LOAD FINANCE DATA
  ==========================================
  */

  const loadFinanceData =
    useCallback(async () => {
      try {
        setLoading(true);

        setError("");

        /*
        ====================================
        FETCH FINANCE API
        ====================================
        */

        const response =
          await fetch(
            "/api/admin/finance/investments",
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        /*
        ====================================
        API ERROR
        ====================================
        */

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Failed to load finance data."
          );
        }

        /*
        ====================================
        SUMMARY
        ====================================
        */

        const apiSummary =
          data?.summary || {};

        setSummary({
          /*
          ================================
          INVESTMENT
          ================================
          */

          totalInvestment:
            Number(
              apiSummary
                .totalInvestment ||
                0
            ),

          /*
          ================================
          POTENTIAL
          ================================
          */

          potentialRevenue:
            Number(
              apiSummary
                .potentialRevenue ||
                0
            ),

          potentialProfit:
            Number(
              apiSummary
                .potentialProfit ||
                0
            ),

          /*
          ================================
          ACTUAL SALES
          ================================
          */

          actualRevenue:
            Number(
              apiSummary
                .actualRevenue ||
                0
            ),

          /*
          ================================
          ACTUAL COST
          ================================
          */

          costOfGoods:
            Number(
              apiSummary
                .actualProductCost ??
                apiSummary
                  .costOfGoods ??
                0
            ),

          allocatedExtraCost:
            Number(
              apiSummary
                .allocatedExtraCost ||
                0
            ),

          realizedCost:
            Number(
              apiSummary
                .realizedCost ||
                0
            ),

          /*
          ================================
          REALIZED PROFIT
          ================================
          */

          realizedProfit:
            Number(
              apiSummary
                .realizedProfit ||
                0
            ),

          /*
          ================================
          INVENTORY QUANTITY
          ================================
          */

          totalUnits:
            Number(
              apiSummary
                .totalUnits ||
                0
            ),

          soldUnits:
            Number(
              apiSummary
                .soldUnits ||
                0
            ),

          remainingUnits:
            Number(
              apiSummary
                .remainingUnits ||
                0
            ),

          /*
          ================================
          PERFORMANCE
          ================================
          */

          roi:
            Number(
              apiSummary.roi ||
                0
            ),

          recoveryPercentage:
            Number(
              apiSummary
                .recoveryPercentage ||
                0
            ),

          /*
          ================================
          SALES / BATCHES
          ================================
          */

          salesCount:
            Number(
              apiSummary
                .salesCount ||
                0
            ),

          totalBatches:
            Number(
              apiSummary
                .totalBatches ||
                0
            ),
        });

        /*
        ====================================
        INVESTMENTS
        ====================================
        */

        setInvestments(
          Array.isArray(
            data?.investments
          )
            ? data.investments
            : []
        );
      } catch (err) {
        console.error(
          "FINANCE PAGE ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );

        /*
        ====================================
        RESET DATA ON ERROR
        ====================================
        */

        setSummary(
          emptySummary
        );

        setInvestments([]);
      } finally {
        setLoading(false);
      }
    }, []);

  /*
  ==========================================
  INITIAL LOAD
  ==========================================
  */

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  /*
  ==========================================
  CREATE INVESTMENT
  ==========================================
  */

  const openCreateModal =
    () => {
      setShowCreateModal(
        true
      );
    };

  const closeCreateModal =
    () => {
      setShowCreateModal(
        false
      );
    };

  const handleInvestmentCreated =
    async () => {
      /*
      Close create modal.
      */

      setShowCreateModal(
        false
      );

      /*
      Reload complete Finance data.
      */

      await loadFinanceData();
    };

  /*
  ==========================================
  OPEN INVESTMENT DETAILS
  ==========================================
  */

  const handleSelectInvestment =
    (
      investment: Investment
    ) => {
      setSelectedInvestment(
        investment
      );

      setShowDetailsModal(
        true
      );
    };

  /*
  ==========================================
  CLOSE INVESTMENT DETAILS
  ==========================================
  */

  const closeDetailsModal =
    () => {
      setShowDetailsModal(
        false
      );

      setSelectedInvestment(
        null
      );
    };

  /*
  ==========================================
  OPEN EDIT INVESTMENT
  ==========================================
  */

  const handleEditInvestment =
    (
      investment: Investment
    ) => {
      setEditingInvestment(
        investment
      );

      setShowDetailsModal(
        false
      );

      setShowEditModal(
        true
      );
    };

  /*
  ==========================================
  CLOSE EDIT INVESTMENT
  ==========================================
  */

  const closeEditModal =
    () => {
      setShowEditModal(
        false
      );

      setEditingInvestment(
        null
      );

      setSelectedInvestment(
        null
      );
    };

  /*
  ==========================================
  INVESTMENT UPDATED
  ==========================================
  */

  const handleInvestmentUpdated =
    async () => {
      setShowEditModal(
        false
      );

      setShowDetailsModal(
        false
      );

      setEditingInvestment(
        null
      );

      setSelectedInvestment(
        null
      );

      await loadFinanceData();
    };

  /*
  ==========================================
  PAGE UI
  ==========================================
  */

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      {/* ================================= */}
      {/* PAGE HEADER */}
      {/* ================================= */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Business Finance
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">
            Finance & Investments
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Track investments,
            inventory, delivered
            revenue, landed cost,
            realized profit and
            ROI.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateModal
          }
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          + New Investment
        </button>
      </div>

      {/* ================================= */}
      {/* ERROR MESSAGE */}
      {/* ================================= */}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ================================= */}
      {/* LOADING */}
      {/* ================================= */}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-500">
            Loading finance
            data...
          </p>
        </div>
      ) : (
        /*
        ====================================
        FINANCE CONTENT
        ====================================
        */

        <div className="space-y-8">
          {/* ============================= */}
          {/* FINANCE OVERVIEW */}
          {/* ============================= */}

          <FinanceOverview
            summary={summary}
          />

          {/* ============================= */}
          {/* INVESTMENT HISTORY */}
          {/* ============================= */}

          <InvestmentList
            investments={
              investments
            }
            onSelect={
              handleSelectInvestment
            }
          />

          {/* ============================= */}
          {/* FINANCE TRANSACTION HISTORY */}
          {/* ============================= */}

          <FinanceSalesHistory />
        </div>
      )}

      {/* ================================= */}
      {/* CREATE INVESTMENT MODAL */}
      {/* ================================= */}

      <CreateInvestmentModal
        open={
          showCreateModal
        }
        onClose={
          closeCreateModal
        }
        onSuccess={
          handleInvestmentCreated
        }
      />

      {/* ================================= */}
      {/* INVESTMENT DETAILS */}
      {/* ================================= */}

      <InvestmentDetails
        open={
          showDetailsModal
        }
        investment={
          selectedInvestment
        }
        onClose={
          closeDetailsModal
        }
        onEdit={
          handleEditInvestment
        }
      />

      {/* ================================= */}
      {/* EDIT INVESTMENT MODAL */}
      {/* ================================= */}

      <EditInvestmentModal
        open={
          showEditModal
        }
        investment={
          editingInvestment
        }
        onClose={
          closeEditModal
        }
        onSuccess={
          handleInvestmentUpdated
        }
      />
    </div>
  );
}