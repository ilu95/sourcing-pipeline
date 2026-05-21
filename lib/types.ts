export type Material = "써지컬스틸" | "통황동" | "기타";
export type Status = "대기 중" | "샘플 발주" | "드롭🗑️";
export type Category =
  | "목걸이(완제품)"
  | "목걸이(펜던트)"
  | "목걸이(체인/끈)"
  | "반지"
  | "키링"
  | "부자재"
  | "기타";

export interface SourcingItem {
  id: string;
  imageUrl: string;
  material: Material;
  /** 원화 원가 (price_cny * 환율 * 1.1) */
  price: number;
  priceCny?: number;
  sourceUrl: string;
  sourcingReason?: string;
  category: Category;
  expectedSellPrice?: number;
  status: Status;
  createdAt: number;
}

export const MATERIAL_OPTIONS: Material[] = ["써지컬스틸", "통황동", "기타"];
export const STATUS_OPTIONS: Status[] = ["대기 중", "샘플 발주", "드롭🗑️"];
export const CATEGORY_OPTIONS: Category[] = [
  "목걸이(완제품)",
  "목걸이(펜던트)",
  "목걸이(체인/끈)",
  "반지",
  "키링",
  "부자재",
  "기타",
];

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

export const CATEGORY_STYLES: Record<Category, string> = {
  "목걸이(완제품)": "bg-violet-50 text-violet-700 border border-violet-200",
  "목걸이(펜던트)": "bg-purple-50 text-purple-700 border border-purple-200",
  "목걸이(체인/끈)": "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200",
  반지: "bg-rose-50 text-rose-700 border border-rose-200",
  키링: "bg-orange-50 text-orange-700 border border-orange-200",
  부자재: "bg-teal-50 text-teal-700 border border-teal-200",
  기타: "bg-zinc-100 text-zinc-500 border border-zinc-200",
};
