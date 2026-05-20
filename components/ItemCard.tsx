"use client";

import { useState } from "react";
import { ExternalLink, Trash2, ImageOff } from "lucide-react";
import {
  SourcingItem,
  Status,
  STATUS_OPTIONS,
  MATERIAL_STYLES,
} from "@/lib/types";

const STATUS_SELECT_STYLES: Record<Status, string> = {
  "대기 중": "bg-zinc-100 text-zinc-600 border-zinc-200",
  "샘플 발주": "bg-blue-50 text-blue-700 border-blue-200",
  "드롭🗑️": "bg-red-50 text-red-500 border-red-200",
};

interface ItemCardProps {
  item: SourcingItem;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
}

export default function ItemCard({ item, onDelete, onStatusChange }: ItemCardProps) {
  const [imgError, setImgError] = useState(false);

  const formattedPrice = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(item.price);

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
            src={item.imageUrl}
            alt="product"
            onError={() => setImgError(true)}
            className="w-full object-cover"
          />
        )}

        {/* Hover action buttons */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="1688 링크 열기"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-zinc-700 hover:bg-white hover:text-zinc-900 shadow-sm border border-zinc-200 transition"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={() => onDelete(item.id)}
            title="삭제"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-zinc-500 hover:bg-red-50 hover:text-red-500 shadow-sm border border-zinc-200 transition"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2">
        {/* Price */}
        <p className="text-base font-bold text-zinc-900 tracking-tight">
          {formattedPrice}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Material badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${MATERIAL_STYLES[item.material]}`}
          >
            {item.material}
          </span>

          {/* Status — native select styled as badge */}
          <div className="relative inline-flex items-center">
            <select
              value={item.status}
              onChange={(e) => onStatusChange(item.id, e.target.value as Status)}
              className={`appearance-none pl-2 pr-5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-400 transition-colors ${STATUS_SELECT_STYLES[item.status]}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 opacity-50"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Source link (text) */}
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors truncate mt-0.5"
        >
          <ExternalLink size={10} />
          <span className="truncate">{item.sourceUrl}</span>
        </a>
      </div>
    </div>
  );
}
