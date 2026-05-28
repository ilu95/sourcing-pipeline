export type Material = "써지컬스틸" | "통황동" | "기타";

export type Status =
  | "대기 중"    // pending
  | "후보 선정"  // candidate
  | "샘플 발주"  // sample_ordered
  | "샘플 도착"  // sample_arrived (QA 트리거)
  | "본품 발주"  // main_ordered
  | "드롭🗑️";   // dropped

export type Category =
  | "목걸이(완제품)"
  | "목걸이(펜던트)"
  | "목걸이(체인/끈)"
  | "반지"
  | "키링"
  | "부자재"
  | "기타";

/** 복합 소재 한 쌍 (부위 → 소재) */
export interface MaterialEntry {
  part: string;
  material: string;
}

export interface SourcingItem {
  id: string;
  imageUrl: string;
  /** 단일 소재 (복합 소재일 때는 "기타" fallback) */
  material: Material;
  /** 복합 소재 배열 — 설정 시 material 대신 표시 */
  materialDetail?: MaterialEntry[];
  /** 원화 원가 (price_cny * 환율 * 1.1) */
  price: number;
  priceCny?: number;
  sourceUrl: string;
  sourcingReason?: string;
  category: Category;
  expectedSellPrice?: number;
  isSampleAvailable: boolean;
  moq: number;
  status: Status;
  createdAt: number;
  /** QA 검수 노트 (샘플 도착 시 사용) */
  qaNotes?: string;
  /** 최종 발주 합격 여부 */
  qaPassed: boolean;
}

/** 멀티 벤더 비교 */
export interface SourcingVendor {
  id: string;
  itemId: string;
  vendorName: string;
  sourceUrl: string;
  priceCny: number | null;
  moq: number;
  isSuperFactory: boolean;
  tradeAmount: string;
  reviewCount: number;
  createdAt: string;
}

export const MATERIAL_OPTIONS: Material[] = ["써지컬스틸", "통황동", "기타"];

export const STATUS_OPTIONS: Status[] = [
  "대기 중", "후보 선정", "샘플 발주", "샘플 도착", "본품 발주", "드롭🗑️",
];

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
  "대기 중":   "bg-zinc-100 text-zinc-600 border border-zinc-200",
  "후보 선정": "bg-violet-50 text-violet-700 border border-violet-200",
  "샘플 발주": "bg-blue-50 text-blue-700 border border-blue-200",
  "샘플 도착": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "본품 발주": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "드롭🗑️":   "bg-red-50 text-red-500 border border-red-200",
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
