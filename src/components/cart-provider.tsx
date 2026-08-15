"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "emmason_cart_v1";

interface CartContextValue {
  lines: CartLine[];
  /** Total number of units, used for the header badge. */
  count: number;
  /** False until the stored cart has been read, so SSR and the first client
   *  render agree and the badge does not flash the wrong number. */
  ready: boolean;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): CartLine[] => {
      if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as CartLine).productId === "string" &&
        Number.isFinite((entry as CartLine).quantity)
      ) {
        const quantity = Math.max(1, Math.floor((entry as CartLine).quantity));
        return [{ productId: (entry as CartLine).productId, quantity }];
      }
      return [];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private browsing or a full quota — the cart still works for this session.
    }
  }, [lines, ready]);

  const add = useCallback((productId: string, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((l) => l.productId === productId);
      if (!existing) return [...current, { productId, quantity }];
      return current.map((l) =>
        l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
      );
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((total, l) => total + l.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
