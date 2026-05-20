"use client";

import { useState, useRef } from "react";
import { ImageIcon, PlusCircle, X } from "lucide-react";
import {
  SourcingItem,
  Material,
  Status,
  MATERIAL_OPTIONS,
  STATUS_OPTIONS,
} from "@/lib/types";

interface ItemFormProps {
  onAdd: (item: SourcingItem) => void;
}

const EMPTY_FORM = {
  imageUrl: "",
  material: "써지컬스틸" as Material,
  price: "",
  sourceUrl: "",
  status: "대기 중" as Status,
};

export default function ItemForm({ onAdd }: ItemFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imgError, setImgError] = useState(false);
  const priceRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl || !form.price || !form.sourceUrl) return;

    const item: SourcingItem = {
      id: crypto.randomUUID(),
      imageUrl: form.imageUrl,
      material: form.material,
      price: Number(form.price),
      sourceUrl: form.sourceUrl,
      status: form.status,
      createdAt: Date.now(),
    };
    onAdd(item);
    setForm(EMPTY_FORM);
    setImgError(false);
  };

  const hasPreview = form.imageUrl.trim() !== "" && !imgError;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      {/* Image URL + Preview */}
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
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0 transition"
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

        {/* Preview Box */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
          {hasPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt="preview"
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

      {/* Material */}
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

      {/* Price */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          사입 단가 (₩)
        </label>
        <input
          ref={priceRef}
          type="number"
          placeholder="0"
          min={0}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition"
          required
        />
      </div>

      {/* Source URL */}
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

      {/* Status */}
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

      {/* Submit */}
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
