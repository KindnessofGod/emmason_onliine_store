"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "emmason_cart_v1";
/** Fired on writes so subscribers in *this* tab update too — the native
 *  `storage` event only fires in other tabs. */
const CHANGE_EVENT = "emmason:cart-changed";

const EMPTY: CartLine[] = [];

interface CartContextValue {
  lines: CartLine[];
  /** Total number of units, used for the header badge. */
  count: number;
  /** False during SSR and the first client render, so the badge does not
   *  flash the wrong number before storage has been read. */
  ready: boolean;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// ---------------------------------------------------------------------------
// The cart lives in localStorage, which makes it an external store. Reading it
// through useSyncExternalStore keeps React in step without effects, and picks
// up writes from other tabs for free.
// ---------------------------------------------------------------------------

function parseCart(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    const lines = parsed.flatMap((entry): CartLine[] => {
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

    return lines.length > 0 ? lines : EMPTY;
  } catch {
    return EMPTY;
  }
}

// getSnapshot must return a stable reference between changes, or React
// re-renders forever. Cache the parse against the raw string.
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function getSnapshot(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing with storage disabled — behave as an empty cart.
    return EMPTY;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parseCart(raw);
  }
  return cachedLines;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function writeCart(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Private browsing or a full quota. Notify anyway so the UI stays
    // consistent with whatever did get written.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const subscribeNoop = () => () => {};

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const add = useCallback((productId: string, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find((l) => l.productId === productId);

    writeCart(
      existing
        ? current.map((l) =>
            l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
          )
        : [...current, { productId, quantity }],
    );
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = getSnapshot();

    writeCart(
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    writeCart(getSnapshot().filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => writeCart([]), []);

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
