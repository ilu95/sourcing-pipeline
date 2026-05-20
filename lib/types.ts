export type Material = "써지컬스틸" | "통황동" | "기타";
export type Status = "대기 중" | "샘플 발주" | "드롭🗑️";

export interface SourcingItem {
  id: string;
  imageUrl: string;
  material: Material;
  price: number;
  sourceUrl: string;
  status: Status;
  createdAt: number;
}

export const MATERIAL_OPTIONS: Material[] = ["써지컬스틸", "통황동", "기타"];
export const STATUS_OPTIONS: Status[] = ["대기 중", "샘플 발주", "드롭🗑️"];

export const STATUS_STYLES: Record<Status, string> = {
  "대기 중": "bg-zinc-100 text-zinc-600 border border-zinc-200",
  "샘플 발주": "bg-blue-50 text-blue-700 border border-blue-200",
  "드롭🗑️": "bg-red-50 text-red-500 border border-red-200",
};

export const MATERIAL_STYLES: Record<Material, string> = {
  써지컬스틸: "bg-slate-100 text-slate-600 border border-slate-200",
  통황동: "bg-amber-50 text-amber-700 border border-amber-200",
  기타: "bg-zinc-100 text-zinc-500 border border-zinc-200",
};
