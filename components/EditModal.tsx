"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Save, Plus } from "lucide-react";
import {
  SourcingItem,
  Material,
  Status,
  Category,
  MaterialEntry,
  MATERIAL_OPTIONS,
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
} from "@/lib/types";
import { fmt } from "./ItemForm";

type MaterialMode = "single" | "multi";
const EMPTY_ENTRY: MaterialEntry = { part: "", material: "" };

interface EditModalProps {
  item: SourcingItem;
  exchangeRate: number;
  onSave: (item: SourcingItem) => Promise<boolean>;
  onClose: () => void;
}

export default function EditModal({ item, exchangeRate, onSave, onClose }: EditModalProps) {
  const [saving, setSaving] = useState(false);

  // ── form state (초기값 = 기존 아이템) ──────────────────────────────
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [category, setCategory] = useState<Category>(item.category);
  const [materialMode, setMaterialMode] = useState<MaterialMode>(
    item.materialDetail?.length ? "multi" : "single"
  );
  const [material, setMaterial] = useState<Material>(item.material);
  const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>(
    item.materialDetail?.length ? item.materialDetail.map((e) => ({ ...e })) : [{ ...EMPTY_ENTRY }]
  );
  const [priceCny, setPriceCny] = useState(item.priceCny != null ? String(item.priceCny) : "");
  const [expectedSellPrice, setExpectedSellPrice] = useState(
    item.expectedSellPrice != null ? String(item.expectedSellPrice) : ""
  );
  const [sourcingReason, setSourcingReason] = useState(item.sourcingReason ?? "");
  const [sourceUrl, setSourceUrl] = useState(item.sourceUrl);
  const [status, setStatus] = useState<Status>(item.status);
  const [isSampleAvailable, setIsSampleAvailable] = useState(item.isSampleAvailable);
  const [moq, setMoq] = useState(String(item.moq ?? 1));

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const priceKrw = useMemo(() => {
    const cny = parseFloat(priceCny);
    if (!cny || cny <= 0) return null;
    return Math.floor(cny * exchangeRate * 1.1);
  }, [priceCny, exchangeRate]);

  const marginRate = useMemo(() => {
    const sell = parseFloat(expectedSellPrice);
    if (!priceKrw || !sell || sell <= 0) return null;
    return ((sell - priceKrw) / sell) * 100;
  }, [priceKrw, expectedSellPrice]);

  const marginColor =
    marginRate === null ? "" :
    marginRate >= 40 ? "text-emerald-600" :
    marginRate >= 25 ? "text-blue-600" :
    marginRate >= 10 ? "text-amber-600" : "text-red-500";

  const updateEntry = (idx: number, field: keyof MaterialEntry, value: string) =>
    setMaterialEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));

  const removeEntry = (idx: number) =>
    setMaterialEntries((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!imageUrl || !sourceUrl) return;
    const finalPrice = priceKrw ?? item.price;

    const validEntries =
      materialMode === "multi"
        ? materialEntries.filter((e) => e.part.trim() && e.material.trim())
        : undefined;

    const updated: SourcingItem = {
      ...item,
      imageUrl,
      category,
      material: materialMode === "single" ? material : "기타",
      materialDetail: validEntries?.length ? validEntries : undefined,
      price: finalPrice,
      priceCny: priceCny ? parseFloat(priceCny) : undefined,
      sourceUrl,
      sourcingReason: sourcingReason.trim() || undefined,
      expectedSellPrice: expectedSellPrice
        ? Math.floor(parseFloat(expectedSellPrice))
        : undefined,
      isSampleAvailable,
      moq: parseInt(moq) || 1,
      status,
    };

    setSaving(true);
    const ok = await onSave(updated);
    setSaving(false);
    if (ok) onClose();
  };

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition";
  const labelCls = "text-xs font-semibold text-zinc-500 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative z-50 w-full max-w-lg mx-4 max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-zinc-900">아이템 수정</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* 이미지 URL */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>이미지 URL</label>
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              className={inputCls} placeholder="https://..." />
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}
              className={`${inputCls} appearance-none cursor-pointer`}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 소재 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={labelCls}>소재</label>
              <div className="flex rounded-lg overflow-hidden border border-zinc-200 text-[11px] font-medium">
                {(["single", "multi"] as MaterialMode[]).map((mode) => (
                  <button key={mode} type="button" onClick={() => setMaterialMode(mode)}
                    className={`px-2.5 py-1 transition-colors ${
                      materialMode === mode ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"
                    }`}>
                    {mode === "single" ? "단일" : "복합"}
                  </button>
                ))}
              </div>
            </div>
            {materialMode === "single" ? (
              <select value={material} onChange={(e) => setMaterial(e.target.value as Material)}
                className={`${inputCls} appearance-none cursor-pointer`}>
                {MATERIAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <div className="flex flex-col gap-1.5">
                {materialEntries.map((entry, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
                    <input type="text" placeholder="부위" value={entry.part}
                      onChange={(e) => updateEntry(idx, "part", e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition" />
                    <input type="text" placeholder="소재" value={entry.material}
                      onChange={(e) => updateEntry(idx, "material", e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition" />
                    <button type="button" onClick={() => removeEntry(idx)}
                      className={`flex-shrink-0 text-zinc-400 hover:text-red-400 transition-colors ${materialEntries.length === 1 ? "invisible" : ""}`}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setMaterialEntries((prev) => [...prev, { ...EMPTY_ENTRY }])}
                  className="flex items-center gap-1 self-start text-[11px] text-zinc-500 hover:text-zinc-800 transition-colors mt-0.5">
                  <Plus size={12} /> 부위 추가
                </button>
              </div>
            )}
          </div>

          {/* 위안화 원가 */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>위안화 원가 (¥)</label>
            <input type="number" placeholder="0.00" min={0} step="0.01"
              value={priceCny} onChange={(e) => setPriceCny(e.target.value)} className={inputCls} />
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2">
              <span className="text-[11px] text-zinc-400">¥{priceCny || "0"} × {exchangeRate} × 1.1</span>
              <span className={`text-sm font-bold ${priceKrw ? "text-zinc-800" : "text-zinc-300"}`}>
                ₩{priceKrw ? fmt(priceKrw) : "—"}
              </span>
            </div>
          </div>

          {/* 예상 판매가 */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>예상 판매가 (₩) <span className="text-zinc-300 font-normal normal-case">선택</span></label>
            <input type="number" placeholder="0" min={0}
              value={expectedSellPrice} onChange={(e) => setExpectedSellPrice(e.target.value)} className={inputCls} />
            {marginRate !== null && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${marginColor}`}>
                <span>예상 마진율</span>
                <span className="text-base">{marginRate.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* 샘플 / MOQ */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>샘플 / MOQ</label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isSampleAvailable}
                onChange={(e) => setIsSampleAvailable(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 cursor-pointer" />
              <span className="text-sm text-zinc-700">샘플(1개) 구매 가능</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 whitespace-nowrap">최소 주문 수량(MOQ)</span>
              <input type="number" min={1} value={moq} onChange={(e) => setMoq(e.target.value)}
                className="w-20 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:border-zinc-400 focus:outline-none transition text-center" />
            </div>
          </div>

          {/* 소싱 명분 */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>소싱 명분 <span className="text-zinc-300 font-normal normal-case">선택</span></label>
            <textarea value={sourcingReason} onChange={(e) => setSourcingReason(e.target.value)}
              placeholder="이 제품을 소싱하는 이유를 적어주세요" rows={2}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition resize-none" />
          </div>

          {/* 1688 직링크 */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>1688 직링크</label>
            <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://detail.1688.com/..." className={inputCls} />
          </div>

          {/* 상태 */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)}
              className={`${inputCls} appearance-none cursor-pointer`}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
            취소
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors">
            <Save size={14} />
            {saving ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
