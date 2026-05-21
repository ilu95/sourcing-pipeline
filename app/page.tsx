"use client";

import { useState, useCallback, useEffect } from "react";
import { Package, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react";
import ItemForm from "@/components/ItemForm";
import ItemCard from "@/components/ItemCard";
import { useItems } from "@/lib/useItems";
import { Status } from "@/lib/types";

const STATUS_FILTER_OPTIONS = ["전체", "대기 중", "샘플 발주", "드롭🗑️"] as const;
type FilterOption = (typeof STATUS_FILTER_OPTIONS)[number];

type ToastType = "success" | "error" | "info";
type ToastState = { message: string; type: ToastType } | null;

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const colors = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-500 text-white",
    info: "bg-zinc-700 text-white",
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${colors[toast.type]}`}
    >
      {toast.message}
    </div>
  );
}

export default function Home() {
  const { items, hydrated, addItem, removeItem, updateStatus, migrateFromLocalStorage } = useItems();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("전체");
  const [migrating, setMigrating] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const handleMigrate = useCallback(async () => {
    setMigrating(true);
    const result = await migrateFromLocalStorage();
    setMigrating(false);

    if (result === "empty") {
      showToast("옮길 데이터가 없습니다.", "info");
    } else if (result === "success") {
      showToast("클라우드 이전 완료!", "success");
    } else {
      showToast("이전 중 오류가 발생했습니다. 콘솔을 확인해주세요.", "error");
    }
  }, [migrateFromLocalStorage, showToast]);

  const filtered =
    filter === "전체" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      {/* Sidebar */}
      <aside
        className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden`}
      >
        <div className="w-72 h-full flex flex-col bg-white border-r border-zinc-200">
          {/* Sidebar header */}
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900">
              <Package size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 leading-tight">소싱 파이프라인</h1>
              <p className="text-[10px] text-zinc-400">1688 상품 관리</p>
            </div>
          </div>

          {/* Form area */}
          <div className="flex-1 overflow-y-auto p-5">
            <ItemForm onAdd={addItem} />
          </div>

          {/* Item count + migration footer */}
          <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between gap-2">
            <p className="text-[11px] text-zinc-400">
              총 <span className="font-semibold text-zinc-600">{items.length}</span>개 아이템
            </p>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              title="로컬 데이터를 클라우드(Supabase)로 이전"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
            >
              <UploadCloud size={11} />
              {migrating ? "이전 중…" : "데이터 이전"}
            </button>
          </div>
        </div>
      </aside>

      {/* Toggle sidebar button */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-5 h-10 rounded-r-md bg-white border border-l-0 border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition shadow-sm"
        style={{ left: sidebarOpen ? "288px" : "0px", transition: "left 0.3s ease" }}
        title={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-zinc-200 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const count =
                opt === "전체"
                  ? items.length
                  : items.filter((i) => i.status === opt).length;
              return (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === opt
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {opt}
                  <span
                    className={`inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[10px] px-1 ${
                      filter === opt
                        ? "bg-white/20 text-white"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-zinc-400">
            {filtered.length}개 표시 중
          </p>
        </header>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!hydrated ? (
            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
              불러오는 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400">
              <Package size={40} strokeWidth={1.2} />
              <p className="text-sm font-medium">아이템이 없습니다</p>
              <p className="text-xs text-zinc-400">
                {filter === "전체"
                  ? "좌측 폼에서 첫 소싱 아이템을 등록해보세요."
                  : `'${filter}' 상태의 아이템이 없습니다.`}
              </p>
            </div>
          ) : (
            <div className="masonry-grid">
              {filtered.map((item) => (
                <div key={item.id} className="masonry-item">
                  <ItemCard
                    item={item}
                    onDelete={removeItem}
                    onStatusChange={(id, status) => updateStatus(id, status as Status)}
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
