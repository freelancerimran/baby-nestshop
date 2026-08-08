import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CartItem } from "@/types/cart";

type QuickCartStore = {
  items: CartItem[];

  addItem: (item: CartItem) => void;

  removeItem: (
    productId: number
  ) => void;

  increaseQuantity: (
    productId: number
  ) => void;

  decreaseQuantity: (
    productId: number
  ) => void;

  clearCart: () => void;

  isInCart: (
    productId: number
  ) => boolean;

  getItem: (
    productId: number
  ) => CartItem | undefined;

  totalItems: number;

  subtotal: number;
};

export const useQuickCart =
  create<QuickCartStore>()(
    persist(
      (set, get) => ({
        items: [],

        totalItems: 0,

        subtotal: 0,

        addItem: (newItem) =>
          set((state) => {
            const existing =
              state.items.find(
                (item) =>
                  item.productId ===
                  newItem.productId
              );

            let updatedItems: CartItem[];

            if (existing) {
              updatedItems =
                state.items.map(
                  (item) =>
                    item.productId ===
                    newItem.productId
                      ? {
                          ...item,
                          quantity:
                            Math.min(
                              item.maxStock,
                              item.quantity + 1
                            ),
                        }
                      : item
                );
            } else {
              updatedItems = [
                ...state.items,
                newItem,
              ];
            }

            return {
              items: updatedItems,

              totalItems:
                updatedItems.reduce(
                  (sum, item) =>
                    sum + item.quantity,
                  0
                ),

              subtotal:
                updatedItems.reduce(
                  (sum, item) =>
                    sum +
                    item.unitPrice *
                      item.quantity,
                  0
                ),
            };
          }),

        removeItem: (
          productId
        ) =>
          set((state) => {
            const updatedItems =
              state.items.filter(
                (item) =>
                  item.productId !==
                  productId
              );

            return {
              items: updatedItems,

              totalItems:
                updatedItems.reduce(
                  (sum, item) =>
                    sum + item.quantity,
                  0
                ),

              subtotal:
                updatedItems.reduce(
                  (sum, item) =>
                    sum +
                    item.unitPrice *
                      item.quantity,
                  0
                ),
            };
          }),

        increaseQuantity: (
          productId
        ) =>
          set((state) => {
            const updatedItems =
              state.items.map(
                (item) =>
                  item.productId ===
                  productId
                    ? {
                        ...item,
                        quantity:
                          Math.min(
                            item.maxStock,
                            item.quantity + 1
                          ),
                      }
                    : item
              );

            return {
              items: updatedItems,

              totalItems:
                updatedItems.reduce(
                  (sum, item) =>
                    sum + item.quantity,
                  0
                ),

              subtotal:
                updatedItems.reduce(
                  (sum, item) =>
                    sum +
                    item.unitPrice *
                      item.quantity,
                  0
                ),
            };
          }),

        decreaseQuantity: (
          productId
        ) =>
          set((state) => {
            const updatedItems =
              state.items
                .map((item) =>
                  item.productId ===
                  productId
                    ? {
                        ...item,
                        quantity:
                          item.quantity - 1,
                      }
                    : item
                )
                .filter(
                  (item) =>
                    item.quantity > 0
                );

            return {
              items: updatedItems,

              totalItems:
                updatedItems.reduce(
                  (sum, item) =>
                    sum + item.quantity,
                  0
                ),

              subtotal:
                updatedItems.reduce(
                  (sum, item) =>
                    sum +
                    item.unitPrice *
                      item.quantity,
                  0
                ),
            };
          }),

clearCart: () =>
  set({
    items: [],
    totalItems: 0,
    subtotal: 0,
  }),

        isInCart: (
          productId
        ) =>
          get().items.some(
            (item) =>
              item.productId ===
              productId
          ),

        getItem: (
          productId
        ) =>
          get().items.find(
            (item) =>
              item.productId ===
              productId
          ),
      }),
      {
        name:
          "baby-nest-quick-cart",
      }
    )
  );