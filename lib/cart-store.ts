"use client";

import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  addItem: (item: { id: string; name: string; price: number }) => void;
  removeItem: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalQuantity: 0,
  totalAmount: 0,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      let items: CartItem[];

      if (existing) {
        items = state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      } else {
        items = [...state.items, { ...item, quantity: 1 }];
      }

      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

      return { items, totalQuantity, totalAmount };
    }),

  removeItem: (id) =>
    set((state) => {
      const items = state.items.filter((i) => i.id !== id);
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
      return { items, totalQuantity, totalAmount };
    }),

  increaseQuantity: (id) =>
    set((state) => {
      const items = state.items.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
      return { items, totalQuantity, totalAmount };
    }),

  decreaseQuantity: (id) =>
    set((state) => {
      const items = state.items
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
      return { items, totalQuantity, totalAmount };
    }),

  clearCart: () => set({ items: [], totalQuantity: 0, totalAmount: 0 }),
}));

