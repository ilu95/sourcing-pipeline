"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, SourcingItemRow } from "./supabase";
import { SourcingItem, Status, Category } from "./types";

const LEGACY_STORAGE_KEY = "sourcing_items";

/** DB row → 프론트엔드 상태 변환 */
function rowToItem(row: SourcingItemRow): SourcingItem {
  return {
    id: row.id,
    imageUrl: row.image_url,
    material: row.material as SourcingItem["material"],
    price: row.price,
    priceCny: row.price_cny ?? undefined,
    sourceUrl: row.source_url,
    sourcingReason: row.sourcing_reason ?? undefined,
    category: (row.category as Category) ?? "기타",
    expectedSellPrice: row.expected_sell_price ?? undefined,
    status: row.status as Status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

/** 프론트엔드 상태 → DB insert payload 변환 (id 제외 — DB가 uuid 발급) */
function itemToRow(
  item: SourcingItem
): Omit<SourcingItemRow, "id" | "created_at"> {
  return {
    image_url: item.imageUrl,
    material: item.material,
    price: Math.floor(Number(item.price)),
    price_cny: item.priceCny != null ? Number(item.priceCny) : null,
    source_url: item.sourceUrl,
    sourcing_reason: item.sourcingReason ?? null,
    category: item.category,
    expected_sell_price:
      item.expectedSellPrice != null
        ? Math.floor(Number(item.expectedSellPrice))
        : null,
    status: item.status,
  };
}

export function useItems() {
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("sourcing_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[useItems] fetch error:", error.message);
      return;
    }
    setItems((data as SourcingItemRow[]).map(rowToItem));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchItems().then(() => {
      if (!cancelled) setHydrated(true);
    });
    return () => { cancelled = true; };
  }, [fetchItems]);

  const addItem = useCallback(async (item: SourcingItem) => {
    const payload = itemToRow(item);
    console.log("[useItems] insert payload:", payload);

    const { data, error } = await supabase
      .from("sourcing_items")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[useItems] insert error:", error.message, error);
      alert(`등록 실패: ${error.message}`);
      return;
    }
    setItems((prev) => [rowToItem(data as SourcingItemRow), ...prev]);
  }, []);

  const removeItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("sourcing_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[useItems] delete error:", error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateStatus = useCallback(async (id: string, status: Status) => {
    const { error } = await supabase
      .from("sourcing_items")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("[useItems] update error:", error.message);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  }, []);

  /**
   * localStorage에 남아있는 기존 데이터를 Supabase로 일괄 이전.
   * @returns "empty" | "success" | "error"
   */
  const migrateFromLocalStorage = useCallback(async (): Promise<
    "empty" | "success" | "error"
  > => {
    let legacy: SourcingItem[] = [];
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return "empty";
      legacy = JSON.parse(raw);
      if (!Array.isArray(legacy) || legacy.length === 0) return "empty";
    } catch {
      return "empty";
    }

    const rows = legacy.map((item) => ({
      image_url: item.imageUrl,
      material: item.material,
      price: Math.floor(Number(item.price)),
      price_cny: null,
      source_url: item.sourceUrl,
      sourcing_reason: null,
      category: "기타",
      expected_sell_price: null,
      status: item.status,
      created_at: new Date(item.createdAt).toISOString(),
    }));

    const { error } = await supabase.from("sourcing_items").insert(rows);
    if (error) {
      console.error("[useItems] migrate error:", error.message);
      return "error";
    }

    localStorage.removeItem(LEGACY_STORAGE_KEY);
    await fetchItems();
    return "success";
  }, [fetchItems]);

  return { items, hydrated, addItem, removeItem, updateStatus, migrateFromLocalStorage };
}
