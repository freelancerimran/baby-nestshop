/*
==========================================
FINANCE SHARED TYPES
==========================================
*/

export type InvestmentItem = {
  id?: number | string;

  productId?: number | string | null;
  productName?: string;

  quantity?: number;

  unitCost?: number;
  sellingPrice?: number;

  soldQuantity?: number;
  remainingQuantity?: number;
};

export type Investment = {
  id?: number | string;

  investment_code?: string;
  investmentCode?: string;

  investment_name?: string;
  investmentName?: string;

  investment_date?: string;
  investmentDate?: string;

  supplier?: string | null;

  shipping_cost?: number;
  shippingCost?: number;

  customs_cost?: number;
  customsCost?: number;

  packaging_cost?: number;
  packagingCost?: number;

  other_cost?: number;
  otherCost?: number;

  product_cost?: number;
  productCost?: number;

  extra_cost?: number;
  extraCost?: number;

  total_investment?: number;
  totalInvestment?: number;

  potential_revenue?: number;
  potentialRevenue?: number;

  potential_profit?: number;
  potentialProfit?: number;

  actual_revenue?: number;
  actualRevenue?: number;

  realized_cost?: number;
  realizedCost?: number;

  realized_profit?: number;
  realizedProfit?: number;

  total_units?: number;
  totalUnits?: number;

  sold_units?: number;
  soldUnits?: number;

  remaining_units?: number;
  remainingUnits?: number;

  recovery_percentage?: number;
  recoveryPercentage?: number;

  notes?: string | null;

  status?: string;

  items?: InvestmentItem[];

  created_at?: string;
  createdAt?: string;

  updated_at?: string;
  updatedAt?: string;

  [key: string]: unknown;
};