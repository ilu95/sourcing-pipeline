"use client";

import { useState, useCallback } from "react";
import { supabase, SourcingVendorRow } from "./supabase";
import { SourcingVendor } from "./types";

function rowToVendor(row: SourcingVendorRow): SourcingVendor {
  return {
    id: row.id,
    itemId: row.item_id,
    vendorName: row.vendor_name ?? "",
    sourceUrl: row.source_url,
    priceCny: row.price_cny != null ? Number(row.price_cny) : null,
    moq: Number(row.moq) || 1,
    isSuperFactory: Boolean(row.is_super_factory),
    tradeAmount: row.trade_amount ?? "",
    reviewCount: Number(row.review_count) || 0,
    createdAt: row.created_at,
  };
}

export function useVendors() {
  const [vendors, setVendors] = useState<SourcingVendor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVendors = useCallback(async (itemId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sourcing_vendors")
      .select("*")
      .eq("item_id", itemId)
      .order("created_at", { ascending: true });
    setLoading(false);

    if (error) {
      console.error("[useVendors] fetch error:", error.message);
      return;
    }
    setVendors((data as SourcingVendorRow[]).map(rowToVendor));
  }, []);

  const addVendor = useCallback(async (
    itemId: string,
    fields: {
      vendorName: string;
      sourceUrl: string;
      priceCny: number | null;
      moq: number;
      isSuperFactory: boolean;
      tradeAmount: string;
      reviewCount: number;
    }
  ): Promise<boolean> => {
    const payload = {
      item_id: itemId,
      vendor_name: fields.vendorName.trim() || null,
      source_url: fields.sourceUrl.trim(),
      price_cny: fields.priceCny,
      moq: Math.max(1, Math.floor(Number(fields.moq) || 1)),
      is_super_factory: Boolean(fields.isSuperFactory),
      trade_amount: fields.tradeAmount.trim() || null,
      review_count: Math.max(0, Math.floor(Number(fields.reviewCount) || 0)),
    };

    const { data, error } = await supabase
      .from("sourcing_vendors")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[useVendors] insert error:", error.message);
      return false;
    }
    setVendors((prev) => [...prev, rowToVendor(data as SourcingVendorRow)]);
    return true;
  }, []);

  const updateVendor = useCallback(async (vendor: SourcingVendor): Promise<boolean> => {
    const payload = {
      vendor_name: vendor.vendorName.trim() || null,
      source_url: vendor.sourceUrl.trim(),
      price_cny: vendor.priceCny,
      moq: Math.max(1, Math.floor(Number(vendor.moq) || 1)),
      is_super_factory: Boolean(vendor.isSuperFactory),
      trade_amount: vendor.tradeAmount.trim() || null,
      review_count: Math.max(0, Math.floor(Number(vendor.reviewCount) || 0)),
    };

    const { error } = await supabase
      .from("sourcing_vendors")
      .update(payload)
      .eq("id", vendor.id);

    if (error) {
      console.error("[useVendors] update error:", error.message);
      return false;
    }
    setVendors((prev) => prev.map((v) => (v.id === vendor.id ? vendor : v)));
    return true;
  }, []);

  const removeVendor = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("sourcing_vendors")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[useVendors] delete error:", error.message);
      return;
    }
    setVendors((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return {
    vendors,
    loading,
    fetchVendors,
    addVendor,
    updateVendor,
    removeVendor,
  };
}
