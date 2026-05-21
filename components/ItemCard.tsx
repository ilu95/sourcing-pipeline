"use client";

import { useState } from "react";
import { ExternalLink, Trash2, ImageOff, Pencil } from "lucide-react";
import {
  SourcingItem,
  Status,
  Material,
  STATUS_OPTIONS,
  MATERIAL_STYLES,
  CATEGORY_STYLES,
} from "@/lib/types";

const STATUS_SELECT_STYLES: Record<Status, string> = {
  "대기 중": "bg-zinc-100 text-zinc-600 border-zinc-200",
  "샘플 발주": "bg-blue-50 text-blue-700 border-blue-200",
  "드롭🗑️": "bg-red-50 text-red-500 border-red-200",
};

const fmtKrw = (n: number) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);

function marginBadge(cost: number, sell: number) {
  const rate = ((sell - cost) / sell) * 100;
  const label = `${rate.toFixed(1)}%`;
  if (rate >= 40) return { label, cls: "bg-emerald-100 text-emerald-700" };
  if (rate >= 25) return { label, cls: "bg-blue-100 text-blue-700" };
  if (rate >= 10) return { label, cls: "bg-amber-100 text-amber-700" };
  return { label, cls: "bg-red-100 text-red-500" };
}

interface ItemCardProps {
  item: SourcingItem;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
  onEdit: (item: SourcingItem) => void;
}

export default function ItemCard({ item, onDelete, onStatusChange, onEdit }: ItemCardProps) {
  const [imgError, setImgError] = useState(false);

  const margin =
    item.expectedSellPrice && item.expectedSellPrice > 0 && item.price > 0
      ? marginBadge(item.price, item.expectedSellPrice)
      : null;

  const matStyle =
    MATERIAL_STYLES[(item.material as Material) in MATERIAL_STYLES
      ? (item.material as Material)
      : "기타"];

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">

      {/* Image */}
      <div className="relative w-full bg-zinc-100">
        {imgError ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-300">
            <ImageOff size={28} strokeWidth={1.5} />
            <span className="text-xs text-zinc-400">이미지 없음</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl.replace(/^http:\/\//i, "https://")}
            alt="product"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full object-cover"
          />
        )}

        {/* Category badge */}
        <span className={`absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${CATEGORY_STYLES[item.category]}`}>
          {item.category}
        </span>

        {/* Hover action buttons */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)} title="수정"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-zinc-600 hover:bg-white hover:text-zinc-900 shadow-sm border border-zinc-200 transition">
            <Pencil size={12} />
          </button>
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" title="1688 링크 열기"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-zinc-700 hover:bg-white hover:text-zinc-900 shadow-sm border border-zinc-200 transition">
            <ExternalLink size={13} />
          </a>
          <button onClick={() => onDelete(item.id)} title="삭제"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-zinc-500 hover:bg-red-50 hover:text-red-500 shadow-sm border border-zinc-200 transition">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2">

        {/* 원화 원가 */}
        <div className="flex items-baseline justify-between gap-1">
          <p className="text-base font-bold text-zinc-900 tracking-tight">{fmtKrw(item.price)}</p>
          {item.priceCny != null && (
            <span className="text-[10px] text-zinc-400">¥{item.priceCny}</span>
          )}
        </div>

        {/* 예상 판매가 + 마진율 */}
        {item.expectedSellPrice != null && (
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] text-zinc-400">
              판매가 <span className="font-medium text-zinc-600">{fmtKrw(item.expectedSellPrice)}</span>
            </span>
            {margin && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${margin.cls}`}>
                마진 {margin.label}
              </span>
            )}
          </div>
        )}

        {/* 소재 (단일/복합) + 상태 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {item.materialDetail && item.materialDetail.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {item.materialDetail.map((e, i) => (
                <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-50 text-slate-600 border border-slate-200">
                  <span className="text-slate-400">{e.part}</span>
                  <span className="text-slate-300 mx-0.5">·</span>
                  <span>{e.material}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${matStyle}`}>
              {item.material}
            </span>
          )}

          {/* Status select */}
          <div className="relative inline-flex items-center">
            <select
              value={item.status}
              onChange={(e) => onStatusChange(item.id, e.target.value as Status)}
              className={`appearance-none pl-2 pr-5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-400 transition-colors ${STATUS_SELECT_STYLES[item.status]}`}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 opacity-50"
              viewBox="0 0 10 10" fill="none">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* 샘플 / MOQ 배지 */}
        <div className="flex items-center gap-1.5">
          {item.isSampleAvailable && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              샘플 가능
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-200">
            MOQ {item.moq}
          </span>
        </div>

        {/* 소싱 명분 */}
        {item.sourcingReason && (
          <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
            {item.sourcingReason}
          </p>
        )}
      </div>
    </div>
  );
}
