"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Pencil, Trash2, ExternalLink, Plus, Check, ImageOff,
} from "lucide-react";
import {
  SourcingItem,
  SourcingVendor,
  Status,
  STATUS_OPTIONS,
  CATEGORY_STYLES,
  STATUS_STYLES,
} from "@/lib/types";
import { useVendors } from "@/lib/useVendors";
import { proxyImageUrl, fmtKrw } from "@/lib/utils";

// ── 타입 ────────────────────────────────────────────────────────────────────

interface DetailModalProps {
  item: SourcingItem;
  onClose: () => void;
  onEdit: (item: SourcingItem) => void;
  onStatusChange: (id: string, status: Status) => void;
  onQAUpdate: (id: string, qaNotes: string, qaPassed: boolean) => Promise<boolean>;
}

// ── 빈 벤더 폼 ───────────────────────────────────────────────────────────────

const EMPTY_VENDOR_FORM = {
  vendorName: "",
  sourceUrl: "",
  priceCny: "",
  moq: "1",
  isSuperFactory: false,
  tradeAmount: "",
  reviewCount: "",
};

// ── 벤더 테이블 하이라이트 ───────────────────────────────────────────────────

function getRowBg(vendor: SourcingVendor, minPrice: number | null): string {
  if (vendor.isSuperFactory) return "bg-emerald-50 border-emerald-200";
  if (
    vendor.priceCny != null &&
    minPrice != null &&
    vendor.priceCny === minPrice
  ) {
    return "bg-blue-50 border-blue-200";
  }
  return "bg-white border-zinc-100";
}

// ── QA 섹션 ──────────────────────────────────────────────────────────────────

function QASection({
  item,
  onQAUpdate,
}: {
  item: SourcingItem;
  onQAUpdate: (id: string, notes: string, passed: boolean) => Promise<boolean>;
}) {
  const [notes, setNotes] = useState(item.qaNotes ?? "");
  const [passed, setPassed] = useState(item.qaPassed);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (n: string, p: boolean) => {
      setSaving(true);
      const ok = await onQAUpdate(item.id, n, p);
      setSaving(false);
      if (ok) setSavedAt(new Date());
    },
    [item.id, onQAUpdate]
  );

  // textarea: 1.5초 debounce 자동저장
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(val, passed), 1500);
  };

  // 체크박스: 즉시 저장
  const handlePassedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setPassed(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save(notes, val);
  };

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
          🔬 샘플 검수 노트
        </span>
        <span className="text-[10px] text-amber-500">(샘플 도착 상태일 때 입력)</span>
        {saving && (
          <span className="ml-auto text-[10px] text-amber-500 animate-pulse">저장 중…</span>
        )}
        {!saving && savedAt && (
          <span className="ml-auto text-[10px] text-emerald-600">
            ✓ {savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 저장됨
          </span>
        )}
      </div>

      <textarea
        value={notes}
        onChange={handleNotesChange}
        placeholder="체인 변색, 마감 상태, 도금 품질 등 검수 내용 입력…"
        rows={4}
        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm placeholder-amber-300 text-zinc-700 focus:border-amber-400 focus:outline-none resize-none transition"
      />

      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
            passed
              ? "bg-emerald-500 border-emerald-500"
              : "border-zinc-300 bg-white"
          }`}
        >
          {passed && <Check size={12} className="text-white" strokeWidth={3} />}
        </div>
        <input
          type="checkbox"
          checked={passed}
          onChange={handlePassedChange}
          className="sr-only"
        />
        <span className="text-sm font-medium text-zinc-700">최종 발주 합격 ✅</span>
      </label>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function DetailModal({
  item,
  onClose,
  onEdit,
  onStatusChange,
  onQAUpdate,
}: DetailModalProps) {
  const [imgError, setImgError] = useState(false);
  const [vendorForm, setVendorForm] = useState(EMPTY_VENDOR_FORM);
  const [addingVendor, setAddingVendor] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const { vendors, loading: vendorLoading, fetchVendors, addVendor, removeVendor } =
    useVendors();

  useEffect(() => {
    fetchVendors(item.id);
  }, [item.id, fetchVendors]);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // 최저가 계산
  const minPrice = vendors.length > 0
    ? Math.min(
        ...vendors
          .filter((v) => v.priceCny != null)
          .map((v) => v.priceCny as number)
      )
    : null;

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.sourceUrl.trim()) return;
    setAddingVendor(true);
    const ok = await addVendor(item.id, {
      vendorName: vendorForm.vendorName,
      sourceUrl: vendorForm.sourceUrl,
      priceCny: vendorForm.priceCny ? parseFloat(vendorForm.priceCny) : null,
      moq: parseInt(vendorForm.moq) || 1,
      isSuperFactory: vendorForm.isSuperFactory,
      tradeAmount: vendorForm.tradeAmount,
      reviewCount: parseInt(vendorForm.reviewCount) || 0,
    });
    setAddingVendor(false);
    if (ok) {
      setVendorForm(EMPTY_VENDOR_FORM);
      setShowAddForm(false);
    }
  };

  const inputCls =
    "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-50 w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200">
            {imgError ? (
              <div className="flex items-center justify-center h-full text-zinc-300">
                <ImageOff size={20} strokeWidth={1.5} />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proxyImageUrl(item.imageUrl)}
                alt="product"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_STYLES[item.category]}`}>
                {item.category}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[item.status]}`}>
                {item.status}
              </span>
              {item.qaPassed && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                  <Check size={9} strokeWidth={3} /> QA 합격
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-zinc-900">{fmtKrw(item.price)}</span>
              {item.priceCny != null && (
                <span className="text-xs text-zinc-400">¥{item.priceCny}</span>
              )}
              {item.expectedSellPrice != null && (
                <span className="text-xs text-zinc-400">
                  → 판매 {fmtKrw(item.expectedSellPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { onClose(); onEdit(item); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition"
            >
              <Pencil size={12} /> 수정
            </button>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition"
            >
              <ExternalLink size={12} /> 1688
            </a>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">소재</p>
              {item.materialDetail && item.materialDetail.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {item.materialDetail.map((e, i) => (
                    <span key={i} className="text-xs text-zinc-600">
                      <span className="text-zinc-400">{e.part}</span> · {e.material}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-zinc-600">{item.material}</span>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">상태 변경</p>
              <select
                value={item.status}
                onChange={(e) => onStatusChange(item.id, e.target.value as Status)}
                className="appearance-none text-xs border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 bg-white cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">MOQ / 샘플</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600">MOQ {item.moq}</span>
                {item.isSampleAvailable && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    샘플 가능
                  </span>
                )}
              </div>
            </div>

            {item.sourcingReason && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">소싱 명분</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{item.sourcingReason}</p>
              </div>
            )}
          </div>

          {/* ── 벤더 비교 테이블 ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                🏭 업체 비교 ({vendors.length}개)
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" />
                  원천공장
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-300" />
                  최저가
                </span>
              </div>
            </div>

            {vendorLoading ? (
              <div className="text-center py-4 text-xs text-zinc-400">불러오는 중…</div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                등록된 업체가 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500">
                      <th className="text-left px-3 py-2 font-semibold border-b border-zinc-200">업체명</th>
                      <th className="text-right px-3 py-2 font-semibold border-b border-zinc-200">단가(¥)</th>
                      <th className="text-right px-3 py-2 font-semibold border-b border-zinc-200">MOQ</th>
                      <th className="text-center px-3 py-2 font-semibold border-b border-zinc-200">원천공장</th>
                      <th className="text-left px-3 py-2 font-semibold border-b border-zinc-200">거래액</th>
                      <th className="text-right px-3 py-2 font-semibold border-b border-zinc-200">리뷰</th>
                      <th className="px-3 py-2 border-b border-zinc-200" />
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => {
                      const rowBg = getRowBg(v, minPrice);
                      return (
                        <tr key={v.id} className={`border-b transition-colors ${rowBg}`}>
                          <td className="px-3 py-2 font-medium text-zinc-700">
                            {v.vendorName || (
                              <span className="text-zinc-300 italic">미입력</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-zinc-800">
                            {v.priceCny != null ? `¥${v.priceCny}` : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-600">{v.moq}</td>
                          <td className="px-3 py-2 text-center">
                            {v.isSuperFactory ? (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                                <Check size={9} className="text-white" strokeWidth={3} />
                              </span>
                            ) : (
                              <span className="text-zinc-200">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-zinc-500">
                            {v.tradeAmount || <span className="text-zinc-200">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-500">{v.reviewCount}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5 justify-end">
                              <a
                                href={v.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-zinc-700 transition-colors"
                                title="1688 링크"
                              >
                                <ExternalLink size={12} />
                              </a>
                              <button
                                onClick={() => removeVendor(v.id)}
                                className="text-zinc-300 hover:text-red-400 transition-colors"
                                title="삭제"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 업체 추가 폼 */}
            {showAddForm ? (
              <form onSubmit={handleAddVendor} className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
                <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">신규 업체 추가</p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-0.5 block">업체명 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 张氏珠宝"
                      value={vendorForm.vendorName}
                      onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-0.5 block">1688 URL (필수)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      required
                      value={vendorForm.sourceUrl}
                      onChange={(e) => setVendorForm({ ...vendorForm, sourceUrl: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-0.5 block">단가 (¥)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="예: 12.5"
                      value={vendorForm.priceCny}
                      onChange={(e) => setVendorForm({ ...vendorForm, priceCny: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-0.5 block">MOQ</label>
                    <input
                      type="number"
                      min="1"
                      value={vendorForm.moq}
                      onChange={(e) => setVendorForm({ ...vendorForm, moq: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-0.5 block">거래액 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 100万+"
                      value={vendorForm.tradeAmount}
                      onChange={(e) => setVendorForm({ ...vendorForm, tradeAmount: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-0.5 block">리뷰 수</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="예: 256"
                      value={vendorForm.reviewCount}
                      onChange={(e) => setVendorForm({ ...vendorForm, reviewCount: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      vendorForm.isSuperFactory
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-zinc-300 bg-white"
                    }`}
                  >
                    {vendorForm.isSuperFactory && (
                      <Check size={9} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={vendorForm.isSuperFactory}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, isSuperFactory: e.target.checked })
                    }
                    className="sr-only"
                  />
                  <span className="text-xs text-zinc-600">원천공장 (Super Factory)</span>
                </label>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setVendorForm(EMPTY_VENDOR_FORM); }}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-zinc-200 transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={addingVendor}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-700 disabled:opacity-50 transition"
                  >
                    {addingVendor ? "저장 중…" : "업체 저장"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-3 flex items-center gap-1.5 w-full justify-center py-2 rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition"
              >
                <Plus size={13} /> 업체 추가
              </button>
            )}
          </div>

          {/* ── QA 검수 노트 (샘플 도착 시에만 표시) ── */}
          {item.status === "샘플 도착" && (
            <QASection item={item} onQAUpdate={onQAUpdate} />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-100 flex-shrink-0 bg-zinc-50">
          <p className="text-[10px] text-zinc-400">
            등록일: {new Date(item.createdAt).toLocaleDateString("ko-KR")}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
