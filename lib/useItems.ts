"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, SourcingItemRow } from "./supabase";
import { SourcingItem, Status } from "./types";

/** DB row → 프론트엔드 상태 변환 */
function rowToItem(row: SourcingItemRow): SourcingItem {
  return {
    id: row.id,
    imageUrl: row.image_url,
    material: row.material as SourcingItem["material"],
    price: row.price,
    sourceUrl: row.source_url,
    status: row.status as Status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

/** 프론트엔드 상태 → DB insert payload 변환 */
function itemToRow(
  item: SourcingItem
): Omit<SourcingItemRow, "created_at"> {
  return {
    id: item.id,
    image_url: item.imageUrl,
    material: item.material,
    price: item.price,
    source_url: item.sourceUrl,
    status: item.status,
  };
}

export function useItems() {
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    let cancelled = false;

    async function fetchItems() {
      const { data, error } = await supabase
        .from("sourcing_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("[useItems] fetch error:", error.message);
      } else {
        setItems((data as SourcingItemRow[]).map(rowToItem));
      }
      setHydrated(true);
    }

    fetchItems();
    return () => { cancelled = true; };
  }, []);

  const addItem = useCallback(async (item: SourcingItem) => {
    const { data, error } = await supabase
      .from("sourcing_items")
      .insert(itemToRow(item))
      .select()
      .single();

    if (error) {
      console.error("[useItems] insert error:", error.message);
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

  return { items, hydrated, addItem, removeItem, updateStatus };
}
