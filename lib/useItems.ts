"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, SourcingItemRow } from "./supabase";
import { SourcingItem, Status, Category } from "./types";

const LEGACY_STORAGE_KEY = "sourcing_items";

/** DB row → 프론트엔드 상태 변환 */
function rowToItem(row: SourcingItemRow): SourcingItem {
  // material_detail: Supabase JSONB → JS array 안전 변환
  let materialDetail: SourcingItem["materialDetail"] = undefined;
  if (Array.isArray(row.material_detail) && row.material_detail.length > 0) {
    materialDetail = row.material_detail.filter(
      (e): e is { part: string; material: string } =>
        e != null &&
        typeof e === "object" &&
        typeof e.part === "string" &&
        typeof e.material === "string"
    );
    if (materialDetail.length === 0) materialDetail = undefined;
  }

  return {
    id: row.id,
    imageUrl: row.image_url,
    material: (row.material || "기타") as SourcingItem["material"],
    materialDetail,
    price: Number(row.price) || 0,
    priceCny: row.price_cny != null ? Number(row.price_cny) : undefined,
    sourceUrl: row.source_url,
    sourcingReason: row.sourcing_reason ?? undefined,
    category: (row.category as Category) ?? "기타",
    expectedSellPrice:
      row.expected_sell_price != null
        ? Number(row.expected_sell_price)
        : undefined,
    isSampleAvailable: row.is_sample_available ?? false,
    moq: Number(row.moq) || 1,
    status: row.status as Status,
    createdAt: new Date(row.created_at).getTime(),
    qaNotes: row.qa_note ?? undefined,
    qaPassed: Boolean(row.qa_passed),
  };
}

/** 프론트엔드 상태 → DB upsert payload 변환 (id·created_at 제외)
 *
 * material_detail (jsonb):
 *   - Supabase JS 클라이언트는 JS 배열/객체를 그대로 JSONB로 전송합니다.
 *   - JSON.stringify는 불필요 (이중 직렬화 버그 방지를 위해 금지).
 */
function itemToRow(
  item: SourcingItem
): Omit<SourcingItemRow, "id" | "created_at"> {
  const materialDetail: SourcingItemRow["material_detail"] =
    Array.isArray(item.materialDetail) && item.materialDetail.length > 0
      ? item.materialDetail
          .filter((e) => e.part?.trim() && e.material?.trim())
          .map((e) => ({ part: e.part.trim(), material: e.material.trim() }))
          .filter((e) => e.part && e.material)
      : null;

  return {
    image_url: item.imageUrl,
    material: item.material,
    material_detail: materialDetail,
    price: Math.floor(Number(item.price)),
    price_cny: item.priceCny != null ? Number(item.priceCny) : null,
    source_url: item.sourceUrl,
    sourcing_reason: item.sourcingReason?.trim() || null,
    category: item.category,
    expected_sell_price:
      item.expectedSellPrice != null
        ? Math.floor(Number(item.expectedSellPrice))
        : null,
    is_sample_available: Boolean(item.isSampleAvailable),
    moq: Math.max(1, Math.floor(Number(item.moq) || 1)),
    status: item.status,
    qa_note: item.qaNotes?.trim() || null,
    qa_passed: Boolean(item.qaPassed),
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
    console.log("[useItems] insert payload:", JSON.stringify(payload, null, 2));

    const { data, error } = await supabase
      .from("sourcing_items")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[useItems] insert error:", {
        message: error.message,
        code:    (error as { code?: string }).code,
        details: (error as { details?: string }).details,
        hint:    (error as { hint?: string }).hint,
      });
      alert(
        `등록 실패: ${error.message}` +
        `\n\n💡 "column does not exist" 에러라면:\n` +
        `Supabase 대시보드 → Settings → API → Reload schema cache`
      );
      return;
    }
    setItems((prev) => [rowToItem(data as SourcingItemRow), ...prev]);
  }, []);

  const updateItem = useCallback(async (item: SourcingItem): Promise<boolean> => {
    const payload = itemToRow(item);

    const { error } = await supabase
      .from("sourcing_items")
      .update(payload)
      .eq("id", item.id);

    if (error) {
      console.error("[useItems] update error:", {
        message: error.message,
        code:    (error as { code?: string }).code,
        details: (error as { details?: string }).details,
        hint:    (error as { hint?: string }).hint,
      });
      alert(`수정 실패: ${error.message}`);
      return false;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    return true;
  }, []);

  /** QA 필드만 부분 업데이트 */
  const updateQA = useCallback(async (
    id: string,
    qaNotes: string,
    qaPassed: boolean
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("sourcing_items")
      .update({ qa_note: qaNotes.trim() || null, qa_passed: qaPassed })
      .eq("id", id);

    if (error) {
      console.error("[useItems] updateQA error:", error.message);
      return false;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qaNotes: qaNotes || undefined, qaPassed } : i
      )
    );
    return true;
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
      material_detail: null,
      price: Math.floor(Number(item.price)),
      price_cny: null,
      source_url: item.sourceUrl,
      sourcing_reason: null,
      category: "기타",
      expected_sell_price: null,
      is_sample_available: false,
      moq: 1,
      status: item.status,
      created_at: new Date(item.createdAt).toISOString(),
      qa_note: null,
      qa_passed: false,
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

  return {
    items,
    hydrated,
    addItem,
    updateItem,
    updateQA,
    removeItem,
    updateStatus,
    migrateFromLocalStorage,
  };
}
