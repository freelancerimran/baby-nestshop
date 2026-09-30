"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem } from "@/types/cart";

type QuickCartState = {
  items: CartItem[];

  /**
   * Temporary UI state.
   *
   * This controls whether the floating cart popup
   * should currently be visible.
   *
   * It is intentionally NOT persisted to localStorage.
   */
  isCartPopupOpen: boolean;

  /**
   * Open the floating cart popup.
   */
  openCartPopup: () => void;

  /**
   * Close the floating cart popup.
   */
  closeCartPopup: () => void;

  /**
   * Add a product to cart.
   *
   * IMPORTANT:
   * Variant selection is intentionally NOT required here.
   *
   * Example:
   *
   * Magnetic Activity Book
   *   → Add to Cart
   *   → variants are stored with the cart item
   *   → variant selection happens later in Quick Order
   */
  addItem: (item: CartItem) => void;

  /**
   * Sync the latest product information into an existing cart item
   * without changing its current cart quantity.
   *
   * IMPORTANT:
   * This is used when a product was already saved in localStorage
   * before its latest variant data was loaded from the product page.
   */
  syncItem: (item: CartItem) => void;

  /**
   * Remove an entire product from cart.
   */
  removeItem: (productId: number) => void;

  /**
   * Increase normal/non-variant product quantity.
   */
  increaseQuantity: (productId: number) => void;

  /**
   * Decrease normal/non-variant product quantity.
   *
   * When quantity becomes 0, the product is
   * automatically removed from the cart.
   */
  decreaseQuantity: (productId: number) => void;

  /**
   * Empty the complete cart.
   */
  clearCart: () => void;

  /**
   * Check whether a product exists in cart.
   */
  isInCart: (productId: number) => boolean;

  /**
   * Get a specific cart item.
   */
  getItem: (
    productId: number
  ) => CartItem | undefined;
};

export const useQuickCart =
  create<QuickCartState>()(
    persist(
      (set, get) => ({
        items: [],

        /*
         * =====================================================
         * CART POPUP UI STATE
         * =====================================================
         *
         * This is temporary UI state.
         *
         * It is NOT persisted because the popup should not
         * automatically appear after a page reload.
         */
        isCartPopupOpen: false,

        openCartPopup: () =>
          set({
            isCartPopupOpen: true,
          }),

        closeCartPopup: () =>
          set({
            isCartPopupOpen: false,
          }),

        /*
         * =====================================================
         * ADD ITEM
         * =====================================================
         *
         * Same product:
         *
         * Product A × 1
         * + Product A × 1
         * = Product A × 2
         *
         * Variant selection is NOT handled here.
         */
        addItem: (item) =>
          set((state) => {
            const existing =
              state.items.find(
                (cartItem) =>
                  cartItem.productId ===
                  item.productId
              );

            /*
             * Product isn't already in cart.
             */
            if (!existing) {
              return {
                items: [
                  ...state.items,
                  {
                    ...item,

                    productId:
                      Number(
                        item.productId
                      ),

                    quantity: Math.max(
                      1,
                      Number(
                        item.quantity || 1
                      )
                    ),

                    maxStock: Math.max(
                      0,
                      Number(
                        item.maxStock || 0
                      )
                    ),

                    unitPrice:
                      Number(
                        item.unitPrice || 0
                      ),

                    deliveryInsideDhaka:
                      Number(
                        item.deliveryInsideDhaka ||
                          0
                      ),

                    deliveryOutsideDhaka:
                      Number(
                        item.deliveryOutsideDhaka ||
                          0
                      ),
                  },
                ],
              };
            }

            /*
             * Product already exists.
             *
             * Merge quantity, but never exceed
             * available parent/aggregate stock.
             */
            const currentQuantity =
              Math.max(
                0,
                Number(
                  existing.quantity || 0
                )
              );

            const incomingQuantity =
              Math.max(
                1,
                Number(
                  item.quantity || 1
                )
              );

            const maxStock = Math.max(
              0,
              Number(
                item.maxStock ??
                  existing.maxStock ??
                  0
              )
            );

            /*
             * If maxStock is available,
             * respect it.
             *
             * Otherwise simply increase quantity.
             */
            const nextQuantity =
              maxStock > 0
                ? Math.min(
                    currentQuantity +
                      incomingQuantity,
                    maxStock
                  )
                : currentQuantity +
                  incomingQuantity;

            return {
              items: state.items.map(
                (cartItem) => {
                  if (
                    cartItem.productId !==
                    item.productId
                  ) {
                    return cartItem;
                  }

                  return {
                    ...cartItem,

                    quantity:
                      nextQuantity,

                    /*
                     * Keep the latest product
                     * information from the page.
                     */
                    productName:
                      item.productName ||
                      cartItem.productName,

                    slug:
                      item.slug ||
                      cartItem.slug,

                    image:
                      item.image ??
                      cartItem.image,

                    unitPrice:
                      Number(
                        item.unitPrice ??
                          cartItem.unitPrice ??
                          0
                      ),

                    maxStock:
                      maxStock ||
                      cartItem.maxStock,

                    deliveryInsideDhaka:
                      Number(
                        item.deliveryInsideDhaka ??
                          cartItem.deliveryInsideDhaka ??
                          0
                      ),

                    deliveryOutsideDhaka:
                      Number(
                        item.deliveryOutsideDhaka ??
                          cartItem.deliveryOutsideDhaka ??
                          0
                      ),

                    /*
                     * Keep all available variants.
                     *
                     * We do NOT store a selected
                     * variant here.
                     */
                    variants:
                      item.variants ??
                      cartItem.variants,
                  };
                }
              ),
            };
          }),

        /*
         * =====================================================
         * SYNC EXISTING ITEM
         * =====================================================
         *
         * Refresh product information for an item that is already
         * in the cart without increasing its quantity.
         *
         * This is especially important for variant products because
         * an older localStorage cart item may not contain the latest
         * variant list.
         */
        syncItem: (item) =>
          set((state) => ({
            items: state.items.map(
              (cartItem) => {
                if (
                  cartItem.productId !==
                  item.productId
                ) {
                  return cartItem;
                }

                return {
                  ...cartItem,

                  productId: Number(
                    item.productId
                  ),

                  productName:
                    item.productName ||
                    cartItem.productName,

                  slug:
                    item.slug ||
                    cartItem.slug,

                  image:
                    item.image ??
                    cartItem.image,

                  unitPrice: Number(
                    item.unitPrice ??
                      cartItem.unitPrice ??
                      0
                  ),

                  maxStock: Math.max(
                    0,
                    Number(
                      item.maxStock ??
                        cartItem.maxStock ??
                        0
                    )
                  ),

                  deliveryInsideDhaka:
                    Number(
                      item.deliveryInsideDhaka ??
                        cartItem.deliveryInsideDhaka ??
                        0
                    ),

                  deliveryOutsideDhaka:
                    Number(
                      item.deliveryOutsideDhaka ??
                        cartItem.deliveryOutsideDhaka ??
                        0
                    ),

                  /*
                   * Always take the latest variants from the
                   * current product page when they are provided.
                   */
                  variants:
                    item.variants ??
                    cartItem.variants,
                };
              }
            ),
          })),

        /*
         * =====================================================
         * REMOVE ITEM
         * =====================================================
         */
        removeItem: (productId) =>
          set((state) => ({
            items:
              state.items.filter(
                (item) =>
                  item.productId !==
                  productId
              ),
          })),

        /*
         * =====================================================
         * INCREASE NORMAL PRODUCT
         * =====================================================
         *
         * Used for products WITHOUT variants.
         *
         * Variant quantities are controlled
         * inside Quick Order instead.
         */
        increaseQuantity: (productId) =>
          set((state) => ({
            items:
              state.items.map(
                (item) => {
                  if (
                    item.productId !==
                    productId
                  ) {
                    return item;
                  }

                  const current =
                    Math.max(
                      0,
                      Number(
                        item.quantity ||
                          0
                      )
                    );

                  const maxStock =
                    Number(
                      item.maxStock ||
                        0
                    );

                  /*
                   * Don't exceed stock.
                   */
                  const next =
                    maxStock > 0
                      ? Math.min(
                          current + 1,
                          maxStock
                        )
                      : current + 1;

                  return {
                    ...item,
                    quantity: next,
                  };
                }
              ),
          })),

        /*
         * =====================================================
         * DECREASE NORMAL PRODUCT
         * =====================================================
         *
         * If quantity becomes 0,
         * remove the product completely.
         */
        decreaseQuantity: (productId) =>
          set((state) => ({
            items:
              state.items
                .map((item) => {
                  if (
                    item.productId !==
                    productId
                  ) {
                    return item;
                  }

                  return {
                    ...item,

                    quantity:
                      Math.max(
                        0,
                        Number(
                          item.quantity ||
                            0
                        ) - 1
                      ),
                  };
                })
                .filter(
                  (item) =>
                    Number(
                      item.quantity || 0
                    ) > 0
                ),
          })),

        /*
         * =====================================================
         * CLEAR CART
         * =====================================================
         */
        clearCart: () =>
          set({
            items: [],
          }),

        /*
         * =====================================================
         * IS IN CART
         * =====================================================
         */
        isInCart: (productId) =>
          get().items.some(
            (item) =>
              item.productId ===
              productId
          ),

        /*
         * =====================================================
         * GET ITEM
         * =====================================================
         */
        getItem: (productId) =>
          get().items.find(
            (item) =>
              item.productId ===
              productId
          ),
      }),

      {
        /*
         * Persist cart in browser localStorage.
         */
        name: "baby-nest-quick-cart",

        /*
         * Make sure persisted old data doesn't
         * crash the new store if the structure
         * changed.
         */
        version: 2,

        /*
         * IMPORTANT:
         *
         * Only cart items are persisted.
         *
         * isCartPopupOpen is temporary UI state
         * and must NOT survive page reload.
         */
        partialize: (state) => ({
          items: state.items,
        }),

        migrate: (
          persistedState
        ) => {
          const state =
            persistedState as
              | QuickCartState
              | undefined;

          if (
            !state ||
            !Array.isArray(
              state.items
            )
          ) {
            return {
              items: [],
            };
          }

          return {
            items:
              state.items.map(
                (item) => ({
                  ...item,

                  productId:
                    Number(
                      item.productId
                    ),

                  quantity:
                    Math.max(
                      0,
                      Number(
                        item.quantity ||
                          0
                      )
                    ),

                  maxStock:
                    Math.max(
                      0,
                      Number(
                        item.maxStock ||
                          0
                      )
                    ),

                  unitPrice:
                    Number(
                      item.unitPrice ||
                        0
                    ),

                  deliveryInsideDhaka:
                    Number(
                      item.deliveryInsideDhaka ||
                        0
                    ),

                  deliveryOutsideDhaka:
                    Number(
                      item.deliveryOutsideDhaka ||
                        0
                    ),

                  variants:
                    Array.isArray(
                      item.variants
                    )
                      ? item.variants.map(
                          (
                            variant
                          ) => ({
                            ...variant,

                            id: Number(
                              variant.id
                            ),

                            productId:
                              Number(
                                variant.productId
                              ),

                            price:
                              variant.price ==
                              null
                                ? null
                                : Number(
                                    variant.price
                                  ),

                            realStock:
                              Number(
                                variant.realStock ||
                                  0
                              ),

                            displayStock:
                              Number(
                                variant.displayStock ||
                                  0
                              ),

                            sortOrder:
                              Number(
                                variant.sortOrder ||
                                  0
                              ),
                          })
                        )
                      : undefined,
                })
              ),
          };
        },
      }
    )
  );