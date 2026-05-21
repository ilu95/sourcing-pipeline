"use client";

import { useState, useRef, useMemo } from "react";
import { ImageIcon, PlusCircle, X } from "lucide-react";
import {
  SourcingItem,
  Material,
  Status,
  Category,
  MATERIAL_OPTIONS,
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
} from "@/lib/types";

interface ItemFormProps {
  onAdd: (item: SourcingItem) => void;
  exchangeRate: number;
}

const EMPTY_FORM = {
  imageUrl: "",
  category: "기타" as Category,
  material: "써지컬스틸" as Material,
  priceCny: "",
  expectedSellPrice: "",
  sourcingReason: "",
  sourceUrl: "",
  status: "대기 중" as Status,
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.floor(n));

export default function ItemForm({ onAdd, exchangeRate }: ItemFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imgError, setImgError] = useState(false);
  const priceRef = useRef<HTMLInputElement>(null);

  /** 원화 원가: CNY * 환율 * 1.1 (해운비 버퍼) */
  const priceKrw = useMemo(() => {
    const cny = parseFloat(form.priceCny);
    if (!cny || cny <= 0) return null;
    return Math.floor(cny * exchangeRate * 1.1);
  }, [form.priceCny, exchangeRate]);

  /** 예상 마진율 */
  const marginRate = useMemo(() => {
    const sell = parseFloat(form.expectedSellPrice);
    if (!priceKrw || !sell || sell <= 0) return null;
    return ((sell - priceKrw) / sell) * 100;
  }, [priceKrw, form.expectedSellPrice]);

  const marginColor =
    marginRate === null
      ? ""
      : marginRate >= 40
      ? "text-emerald-600"
      : marginRate >= 25
      ? "text-blue-600"
      : marginRate >= 10
      ? "text-amber-600"
      : "text-red-500";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl || !form.priceCny || !form.sourceUrl) return;
    if (!priceKrw) return;

    const item: SourcingItem = {
      id: crypto.randomUUID(),
      imageUrl: form.imageUrl,
      category: form.category,
      material: form.material,
      price: priceKrw,
      priceCny: parseFloat(form.priceCny),
      sourceUrl: form.sourceUrl,
      sourcingReason: form.sourcingReason.trim() || undefined,
      expectedSellPrice: form.expectedSellPrice
        ? Math.floor(parseFloat(form.expectedSellPrice))
        : undefined,
      status: form.status,
      createdAt: Date.now(),
    };
    onAdd(item);
    setForm(EMPTY_FORM);
    setImgError(false);
  };

  const hasPreview = form.imageUrl.trim() !== "" && !imgError;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* 이미지 URL + Preview */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          이미지 URL
        </label>
        <div className="relative">
          <input
            type="url"
            placeholder="https://..."
            value={form.imageUrl}
            onChange={(e) => {
              setForm({ ...form, imageUrl: e.target.value });
              setImgError(false);
            }}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition"
            required
          />
          {form.imageUrl && (
            <button
              type="button"
              onClick={() => { setForm({ ...form, imageUrl: "" }); setImgError(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
          {hasPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl.replace(/^http:\/\//i, "https://")}
              alt="preview"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
              <ImageIcon size={28} strokeWidth={1.5} />
              <span className="text-xs">이미지 미리보기</span>
            </div>
          )}
          {imgError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 gap-1 text-zinc-400">
              <X size={20} />
              <span className="text-xs">이미지 로드 실패</span>
            </div>
          )}
        </div>
      </div>

      {/* 카테고리 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          카테고리
        </label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none transition appearance-none cursor-pointer"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* 소재 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          소재
        </label>
        <select
          value={form.material}
          onChange={(e) => setForm({ ...form, material: e.target.value as Material })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none transition appearance-none cursor-pointer"
        >
          {MATERIAL_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* 가격 섹션 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          위안화 원가 (¥)
        </label>
        <input
          ref={priceRef}
          type="number"
          placeholder="0.00"
          min={0}
          step="0.01"
          value={form.priceCny}
          onChange={(e) => setForm({ ...form, priceCny: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition"
          required
        />
        {/* 원화 자동 계산 표시 */}
        <div className="flex items-center justify-between rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2">
          <span className="text-[11px] text-zinc-400">
            ¥{form.priceCny || "0"} × {exchangeRate} × 1.1
          </span>
          <span className={`text-sm font-bold ${priceKrw ? "text-zinc-800" : "text-zinc-300"}`}>
            ₩{priceKrw ? fmt(priceKrw) : "—"}
          </span>
        </div>
      </div>

      {/* 예상 판매가 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          예상 판매가 (₩)
        </label>
        <input
          type="number"
          placeholder="0"
          min={0}
          value={form.expectedSellPrice}
          onChange={(e) => setForm({ ...form, expectedSellPrice: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition"
        />
        {/* 마진율 실시간 표시 */}
        {marginRate !== null && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${marginColor}`}>
            <span>예상 마진율</span>
            <span className="text-base">{marginRate.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* 소싱 명분 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          소싱 명분
        </label>
        <textarea
          placeholder="이 제품을 소싱하는 이유를 적어주세요"
          value={form.sourcingReason}
          onChange={(e) => setForm({ ...form, sourcingReason: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition resize-none"
        />
      </div>

      {/* 1688 직링크 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          1688 직링크
        </label>
        <input
          type="url"
          placeholder="https://detail.1688.com/..."
          value={form.sourceUrl}
          onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition"
          required
        />
      </div>

      {/* 상태 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          상태
        </label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none transition appearance-none cursor-pointer"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 active:bg-zinc-800 transition-colors"
      >
        <PlusCircle size={16} />
        등록하기
      </button>
    </form>
  );
}
