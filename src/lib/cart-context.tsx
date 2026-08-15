"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "emmason.cart.v1";
/** Fired on writes so subscribers in *this* tab update too — the native
 *  `storage` event only fires in other tabs. */
const CHANGE_EVENT = "emmason:cart-changed";

const EMPTY_LINES: CartLine[] = [];

// ---------------------------------------------------------------------------
// The cart lives in localStorage, which makes it an external store. Reading it
// through useSyncExternalStore keeps React in step with it without effects,
// and correctly handles other tabs writing to it.
// ---------------------------------------------------------------------------

function parseCart(raw: string | null): CartLine[] {
  if (!raw) return EMPTY_LINES;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_LINES;

    // Storage is user-writable, so validate rather than trust.
    const lines = parsed.flatMap((entry): CartLine[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { productId, quantity } = entry as Record<string, unknown>;
      if (typeof productId !== "string" || typeof quantity !== "number") return [];
      if (!Number.isInteger(quantity) || quantity < 1) return [];
      return [{ productId, quantity: Math.min(quantity, 99) }];
    });

    return lines.length > 0 ? lines : EMPTY_LINES;
  } catch {
    return EMPTY_LINES;
  }
}

// getSnapshot must return a referentially stable value between changes, or
// React re-renders forever. Cache the parse against the raw string.
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY_LINES;

function getSnapshot(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing with storage disabled — behave as an empty cart.
    return EMPTY_LINES;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parseCart(raw);
  }
  return cachedLines;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY_LINES;
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
    // Quota or disabled storage. Notify anyway so the UI stays consistent
    // with whatever did get written.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** True once mounted on the client, so the UI can hold off on "cart is empty". */
const subscribeNoop = () => () => {};

// ---------------------------------------------------------------------------

interface CartContextValue {
  lines: CartLine[];
  /** False during SSR and the first client render. */
  ready: boolean;
  itemCount: number;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const add = useCallback((productId: string, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find((line) => line.productId === productId);

    writeCart(
      existing
        ? current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: Math.min(line.quantity + quantity, 99) }
              : line,
          )
        : [...current, { productId, quantity: Math.min(quantity, 99) }],
    );
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = getSnapshot();

    writeCart(
      quantity < 1
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: Math.min(quantity, 99) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    writeCart(getSnapshot().filter((line) => line.productId !== productId));
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
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
