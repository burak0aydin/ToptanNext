import { create } from 'zustand';

type CartToast = {
  id: number;
  message: string;
};

type CartState = {
  totalItems: number;
  toast: CartToast | null;
  setTotalItems: (totalItems: number) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  totalItems: 0,
  toast: null,
  setTotalItems: (totalItems) => set({ totalItems }),
  showToast: (message) =>
    set({
      toast: {
        id: Date.now(),
        message,
      },
    }),
  clearToast: () => set({ toast: null }),
}));
