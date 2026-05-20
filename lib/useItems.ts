"use client";

import { useState, useEffect, useCallback } from "react";
import { SourcingItem, Status } from "./types";

const STORAGE_KEY = "sourcing_items";

export function useItems() {
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setItems(JSON.parse(raw));
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: SourcingItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(
    (item: SourcingItem) => {
      persist([item, ...items]);
    },
    [items, persist]
  );

  const removeItem = useCallback(
    (id: string) => {
      persist(items.filter((i) => i.id !== id));
    },
    [items, persist]
  );

  const updateStatus = useCallback(
    (id: string, status: Status) => {
      persist(items.map((i) => (i.id === id ? { ...i, status } : i)));
    },
    [items, persist]
  );

  return { items, hydrated, addItem, removeItem, updateStatus };
}
