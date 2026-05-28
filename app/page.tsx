"use client";

import { useState, useCallback, useEffect } from "react";
import { Package, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react";
import ItemForm from "@/components/ItemForm";
import ItemCard from "@/components/ItemCard";
import EditModal from "@/components/EditModal";
import DetailModal from "@/components/DetailModal";
import { useItems } from "@/lib/useItems";
import { SourcingItem, Status, Category, CATEGORY_OPTIONS } from "@/lib/types";

// ── Filter / Sort types ────────────────────────────────────────────────────
const STATUS_OPTIONS_ALL = [
  "전체", "대기 중", "후보 선정", "샘플 발주", "샘플 도착", "본품 발주", "드롭🗑️",
] as const;
type StatusFilter = (typeof STATUS_OPTIONS_ALL)[number];
type CategoryFilter = "전체" | Category;
type SortOption = "date_desc" | "cost_asc" | "margin_desc";

const SORT_LABELS: Record<SortOption, string> = {
  date_desc: "최신 등록 순",
  cost_asc: "원가 낮은 순",
  margin_desc: "마진율 높은 순",
};

// ── Toast ─────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
type ToastState = { message: string; type: ToastType } | null;

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  const colors: Record<ToastType, string> = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-500 text-white",
    info: "bg-zinc-700 text-white",
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${colors[toast.type]}`}>
      {toast.message}
    </div>
  );
}

// ── Compact Select ────────────────────────────────────────────────────────
function FilterSelect<T extends string>({
  value, onChange, options, labelFn,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  labelFn?: (v: T) => string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 focus:border-zinc-400 focus:outline-none cursor-pointer hover:bg-zinc-50 transition"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{labelFn ? labelFn(opt) : opt}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400"
        viewBox="0 0 10 10" fill="none">
        <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const {
    items, hydrated, addItem, updateItem, updateQA,
    removeItem, updateStatus, migrateFromLocalStorage,
  } = useItems();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("전체");
  const [sort, setSort] = useState<SortOption>("date_desc");
  const [exchangeRate, setExchangeRate] = useState(221);
  const [editingItem, setEditingItem] = useState<SourcingItem | null>(null);
  const [detailItem, setDetailItem] = useState<SourcingItem | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, type: ToastType) => setToast({ message, type }), []);

  const handleMigrate = useCallback(async () => {
    setMigrating(true);
    const result = await migrateFromLocalStorage();
    setMigrating(false);
    if (result === "empty") showToast("옮길 데이터가 없습니다.", "info");
    else if (result === "success") showToast("클라우드 이전 완료!", "success");
    else showToast("이전 중 오류가 발생했습니다.", "error");
  }, [migrateFromLocalStorage, showToast]);

  // detailItem을 최신 items 기준으로 동기화 (QA 업데이트 등 반영)
  useEffect(() => {
    if (!detailItem) return;
    const latest = items.find((i) => i.id === detailItem.id);
    if (latest) setDetailItem(latest);
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter + Sort ──────────────────────────────────────────────────────
  const categoryOptions: CategoryFilter[] = ["전체", ...CATEGORY_OPTIONS];

  const displayed = [...items]
    .filter((item) => {
      const statusOk = statusFilter === "전체" || item.status === statusFilter;
      const categoryOk = categoryFilter === "전체" || item.category === categoryFilter;
      return statusOk && categoryOk;
    })
    .sort((a, b) => {
      if (sort === "cost_asc") return a.price - b.price;
      if (sort === "margin_desc") {
        const getM = (i: SourcingItem) =>
          i.expectedSellPrice && i.expectedSellPrice > 0
            ? (i.expectedSellPrice - i.price) / i.expectedSellPrice
            : -Infinity;
        return getM(b) - getM(a);
      }
      return b.createdAt - a.createdAt;
    });

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Detail modal */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={(item) => {
            setDetailItem(null);
            setEditingItem(item);
          }}
          onStatusChange={async (id, status) => {
            await updateStatus(id, status as Status);
          }}
          onQAUpdate={async (id, qaNotes, qaPassed) => {
            const ok = await updateQA(id, qaNotes, qaPassed);
            if (ok) showToast("QA 노트가 저장되었습니다.", "success");
            return ok;
          }}
        />
      )}

      {/* Edit modal */}
      {editingItem && (
        <EditModal
          item={editingItem}
          exchangeRate={exchangeRate}
          onSave={async (updated) => {
            const ok = await updateItem(updated);
            if (ok) showToast("수정 완료!", "success");
            return ok;
          }}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Sidebar */}
      <aside className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-72" : "w-0"} overflow-hidden`}>
        <div className="w-72 h-full flex flex-col bg-white border-r border-zinc-200">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900">
              <Package size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 leading-tight">소싱 파이프라인</h1>
              <p className="text-[10px] text-zinc-400">1688 상품 관리</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <ItemForm onAdd={addItem} exchangeRate={exchangeRate} />
          </div>
          <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between gap-2">
            <p className="text-[11px] text-zinc-400">
              총 <span className="font-semibold text-zinc-600">{items.length}</span>개 아이템
            </p>
            <button onClick={handleMigrate} disabled={migrating}
              title="로컬 데이터를 클라우드로 이전"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors">
              <UploadCloud size={11} />
              {migrating ? "이전 중…" : "데이터 이전"}
            </button>
          </div>
        </div>
      </aside>

      {/* Toggle sidebar */}
      <button onClick={() => setSidebarOpen((v) => !v)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-5 h-10 rounded-r-md bg-white border border-l-0 border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition shadow-sm"
        style={{ left: sidebarOpen ? "288px" : "0px", transition: "left 0.3s ease" }}
        title={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}>
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Control bar */}
        <header className="flex items-center gap-2 flex-wrap px-6 py-3 bg-white border-b border-zinc-200 flex-shrink-0">

          {/* Filters */}
          <FilterSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions as readonly CategoryFilter[]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS_ALL}
          />
          <FilterSelect
            value={sort}
            onChange={setSort}
            options={["date_desc", "cost_asc", "margin_desc"] as const}
            labelFn={(v) => SORT_LABELS[v]}
          />

          <div className="flex-1" />

          {/* 환율 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 whitespace-nowrap">환율</span>
            <div className="relative flex items-center">
              <span className="absolute left-2 text-[11px] text-zinc-400 pointer-events-none">¥1=</span>
              <input type="number" min={1} value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value) || 190)}
                className="w-[5.5rem] pl-9 pr-5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700 focus:border-zinc-400 focus:outline-none transition text-right" />
              <span className="absolute right-2 text-[11px] text-zinc-400 pointer-events-none">₩</span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 whitespace-nowrap">{displayed.length}개</p>
        </header>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!hydrated ? (
            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">불러오는 중...</div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400">
              <Package size={40} strokeWidth={1.2} />
              <p className="text-sm font-medium">아이템이 없습니다</p>
              <p className="text-xs">
                {statusFilter === "전체" && categoryFilter === "전체"
                  ? "좌측 폼에서 첫 소싱 아이템을 등록해보세요."
                  : "선택한 필터에 해당하는 아이템이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="masonry-grid">
              {displayed.map((item) => (
                <div key={item.id} className="masonry-item">
                  <ItemCard
                    item={item}
                    onDelete={removeItem}
                    onStatusChange={(id, status) => updateStatus(id, status as Status)}
                    onEdit={setEditingItem}
                    onDetail={setDetailItem}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
