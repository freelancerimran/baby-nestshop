export interface FulfillmentStats {
  todayOrders: number;
  pendingPacking: number;
  packed: number;
  dispatched: number;
  delivered: number;
  totalQty: number;
  todayCod: number;
}