// ════════════════════════════════════════════════════════════════════════════
//  ✏️  아래 두 상수를 본인의 Supabase 프로젝트 값으로 교체하세요.
// ════════════════════════════════════════════════════════════════════════════
const SUPABASE_URL      = 'https://apkignlvwtbudhtnloir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwa2lnbmx2d3RidWRodG5sb2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDY4NjIsImV4cCI6MjA5NDg4Mjg2Mn0.GxF5Ea2ips6oF_zfmit1DxtJ4KjNcu8VqMZtG62kbPw';

const DEFAULT_EXCHANGE_RATE = 222; // 위안 → 원화 기본 환율 (×1.1 해운비 포함)
const MIN_SIZE = 100;              // 의미 있는 이미지 최소 크기 (px)

// DB 카테고리 옵션 (웹앱과 동일하게 유지)
const CATEGORY_OPTIONS = [
  '기타',
  '목걸이(완제품)',
  '목걸이(펜던트)',
  '목걸이(체인/끈)',
  '반지',
  '키링',
  '부자재',
];

// extractProductData가 반환하는 단순 카테고리 → DB 카테고리 매핑
const CATEGORY_MAP = {
  '반지':  '반지',
  '목걸이': '목걸이(완제품)',  // 세부 분류는 사용자가 선택
  '키링':  '키링',
  '부자재': '부자재',
  '기타':  '기타',
};


// ════════════════════════════════════════════════════════════════════════════
//  1. 스타일 주입 (모달 + 토스트 전용, CSS 파일 없이 DOM 방식)
// ════════════════════════════════════════════════════════════════════════════
function injectStyles() {
  if (document.getElementById('__sourcing_styles__')) return;
  const s = document.createElement('style');
  s.id = '__sourcing_styles__';
  s.textContent = `
    /* ── 호버 버튼 ────────────────────────────────────────────── */
    /* position: absolute + scrollY/scrollX 좌표로 배치 — img DOM 불간섭 */
    #__sourcing_clip_btn__ {
      position: absolute; z-index: 999999;
      display: none; align-items: center; gap: 5px;
      padding: 6px 12px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,.25);
      background: rgba(15,15,15,.82);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      color: #fff; font-size: 12px; font-weight: 600;
      font-family: -apple-system,'Segoe UI',sans-serif;
      white-space: nowrap; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,.35);
      /* transform은 JS positionBtn()에서 translateX(-100%)로 설정 */
      transition: background .15s; user-select: none; pointer-events: auto;
    }
    /* transform을 건드리지 않으므로 :hover/:active 는 색상만 */
    #__sourcing_clip_btn__:hover  { background: rgba(0,0,0,.95); }
    #__sourcing_clip_btn__:active { opacity: .8; }

    /* ── 모달 백드롭 ──────────────────────────────────────────── */
    #__sourcing_backdrop__ {
      position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(0,0,0,.5);
      backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: __sfa .18s ease;
    }
    @keyframes __sfa { from { opacity:0; } to { opacity:1; } }

    /* ── 모달 패널 ────────────────────────────────────────────── */
    #__sourcing_modal__ {
      width: 420px; max-width: calc(100vw - 32px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,.3);
      overflow: hidden; font-family: -apple-system,'Segoe UI',sans-serif;
      animation: __sfm .2s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes __sfm { from { opacity:0; transform:scale(.92) translateY(8px); } to { opacity:1; transform:none; } }

    /* ── 모달 헤더 ────────────────────────────────────────────── */
    .__sm-header__ {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px; border-bottom: 1px solid #f1f1f1;
    }
    .__sm-thumb__ {
      width: 48px; height: 48px; border-radius: 8px;
      object-fit: cover; border: 1px solid #e5e5e5; flex-shrink: 0;
    }
    .__sm-thumb-ph__ {
      width: 48px; height: 48px; border-radius: 8px;
      background: #f4f4f5; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .__sm-title__ { font-size: 14px; font-weight: 700; color: #111; }
    .__sm-url__   { font-size: 11px; color: #a1a1aa; margin-top: 2px;
                    max-width: 260px; overflow: hidden;
                    text-overflow: ellipsis; white-space: nowrap; }
    .__sm-close__ {
      margin-left: auto; width: 28px; height: 28px; border-radius: 6px;
      border: none; background: transparent; cursor: pointer;
      color: #71717a; font-size: 16px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: background .12s;
    }
    .__sm-close__:hover { background: #f4f4f5; color: #111; }

    /* ── 모달 바디 ────────────────────────────────────────────── */
    .__sm-body__ { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

    .__sm-field__ { display: flex; flex-direction: column; gap: 5px; }
    .__sm-label__ {
      font-size: 11px; font-weight: 600; color: #71717a;
      text-transform: uppercase; letter-spacing: .05em;
    }
    .__sm-opt__   { font-size: 11px; color: #d4d4d8; font-weight: 400; }
    .__sm-input__ {
      width: 100%; box-sizing: border-box;
      padding: 9px 12px; border-radius: 8px;
      border: 1px solid #e4e4e7; background: #fff;
      font-size: 13px; color: #18181b; outline: none;
      transition: border-color .15s, box-shadow .15s;
      font-family: inherit;
    }
    .__sm-input__:focus {
      border-color: #a1a1aa;
      box-shadow: 0 0 0 3px rgba(161,161,170,.18);
    }
    .__sm-calc__ {
      font-size: 12px; color: #71717a; margin-top: 2px;
      min-height: 16px;
    }
    .__sm-calc__ b { color: #18181b; }

    /* ── 자동추출 뱃지 ────────────────────────────────────────── */
    .__sm-auto__ {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 7px; border-radius: 99px;
      font-size: 10px; font-weight: 600;
      background: #ede9fe; color: #7c3aed; margin-left: 6px;
    }

    /* ── 모달 푸터 ────────────────────────────────────────────── */
    .__sm-footer__ {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 14px 20px; border-top: 1px solid #f1f1f1;
    }
    .__sm-btn-cancel__ {
      padding: 8px 16px; border-radius: 8px; border: 1px solid #e4e4e7;
      background: #fff; color: #52525b; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: background .12s; font-family: inherit;
    }
    .__sm-btn-cancel__:hover { background: #f4f4f5; }
    .__sm-btn-submit__ {
      padding: 8px 18px; border-radius: 8px; border: none;
      background: #18181b; color: #fff; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background .12s, transform .1s;
      display: flex; align-items: center; gap: 6px; font-family: inherit;
    }
    .__sm-btn-submit__:hover   { background: #3f3f46; }
    .__sm-btn-submit__:active  { transform: scale(.97); }
    .__sm-btn-submit__:disabled {
      background: #a1a1aa; cursor: not-allowed; transform: none;
    }

    /* ── 토스트 ───────────────────────────────────────────────── */
    .__sourcing_toast__ {
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      display: flex; align-items: center; gap: 8px;
      padding: 11px 16px; border-radius: 10px;
      font-size: 13px; font-weight: 600; color: #fff;
      box-shadow: 0 8px 24px rgba(0,0,0,.2);
      font-family: -apple-system,'Segoe UI',sans-serif;
      opacity: 0; transform: translateY(-8px);
      transition: opacity .22s, transform .22s;
      pointer-events: none;
    }
    .__sourcing_toast__.visible {
      opacity: 1; transform: translateY(0);
    }
  `;
  document.head.appendChild(s);
}


// ════════════════════════════════════════════════════════════════════════════
//  2. 1688 페이지 데이터 자동 추출 — 범용 복합 소재 추론 알고리즘
// ════════════════════════════════════════════════════════════════════════════

/** 소재 매핑 사전 (한·중 혼합 텍스트 대응, 순서가 우선순위) */
const MATERIAL_DICT = [
  { name: '써지컬스틸',    regex: /티타늄|스테인리스|스테인리스\s*스틸|钛钢|不锈钢|316L/i },
  { name: '은(Silver)',    regex: /은|실버|925|银/i },
  { name: '합금',          regex: /합금|구리\s*합금|合金/i },
  { name: '통황동',        regex: /구리(?!\s*합금)|铜(?!合금)|黄铜/i },
  { name: '수지\/플라스틱', regex: /수지|플라스틱|树脂|塑料/i },
];

/**
 * 카테고리와 순서 index를 받아 부위(Key) 명칭 반환
 * - 목걸이: 체인 / 펜던트 / 부위 3 …
 * - 기타  : 몸체 / 부속품 / 부위 3 …
 */
function getPartKey(idx, cat) {
  if (cat === '목걸이') {
    return idx === 0 ? '체인' : idx === 1 ? '펜던트' : `부위 ${idx + 1}`;
  }
  return idx === 0 ? '몸체' : idx === 1 ? '부속품' : `부위 ${idx + 1}`;
}

/**
 * 본문 텍스트를 스캔해 카테고리·소재를 추출.
 *
 * 반환값:
 *   category      : '반지' | '목걸이' | '키링' | '부자재' | '기타'
 *   materialDetail: {
 *     is_composite   : boolean,
 *     single_material: string,          // 단일일 때 소재명
 *     items          : [{key, value}]   // 복합일 때 부위-소재 쌍
 *   }
 */
function extractProductData(pageText) {
  // ── 1. 카테고리 감지 ──────────────────────────────────────────────────────
  let category = '기타';
  if      (/반지|戒指|指环|크기\s*\d+호/i.test(pageText))                       category = '반지';
  else if (/목걸이|체인 스타일|펜던트 소재|둘레|쇄골|项链|链子/i.test(pageText)) category = '목걸이';
  else if (/키링|열쇠고리|挂件|钥匙扣/i.test(pageText))                          category = '키링';
  else if (/부자재|配件/i.test(pageText))                                        category = '부자재';

  // ── 2. 소재 감지 — Set으로 고유 소재만 수집 ──────────────────────────────
  const seen = new Set();
  const detected = [];
  for (const { name, regex } of MATERIAL_DICT) {
    if (regex.test(pageText) && !seen.has(name)) {
      seen.add(name);
      detected.push(name);
    }
  }

  // ── 3. 개수 기반 복합 판정 (2개 이상 = 복합) ─────────────────────────────
  const isComposite = detected.length >= 2;

  // ── 4. material_detail 객체 생성 ─────────────────────────────────────────
  const materialDetail = isComposite
    ? {
        is_composite:    true,
        single_material: '',
        items: detected.map((mat, idx) => ({
          key:   getPartKey(idx, category),
          value: mat,
        })),
      }
    : {
        is_composite:    false,
        single_material: detected[0] || '',
        items:           [],
      };

  return { category, materialDetail };
}


// ════════════════════════════════════════════════════════════════════════════
//  3. 토스트 알림
// ════════════════════════════════════════════════════════════════════════════
function showToast(message, isError = false) {
  const t = document.createElement('div');
  t.className = '__sourcing_toast__';
  t.style.background = isError ? '#ef4444' : '#10b981';
  t.textContent = message;
  document.body.appendChild(t);
  // 다음 프레임에 visible 추가 → CSS 트랜지션 발동
  requestAnimationFrame(() => {
    requestAnimationFrame(() => t.classList.add('visible'));
  });
  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}


// ════════════════════════════════════════════════════════════════════════════
//  4. Supabase INSERT
// ════════════════════════════════════════════════════════════════════════════
async function insertToSupabase(payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sourcing_items`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':         SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
}


// ════════════════════════════════════════════════════════════════════════════
//  5. 모달 열기 / 닫기
// ════════════════════════════════════════════════════════════════════════════
let activeBackdrop = null;

function closeModal() {
  activeBackdrop?.remove();
  activeBackdrop = null;
}

function openModal(img) {
  if (activeBackdrop) closeModal();

  // ── 페이지 텍스트 크롤링 & 자동 추출 ────────────────────────────────────
  const pageText = document.body.innerText;
  const { category: detectedCat, materialDetail } = extractProductData(pageText);
  const mappedCategory = CATEGORY_MAP[detectedCat] ?? '기타';
  const autoDetectedMat = materialDetail.is_composite
    ? materialDetail.items.length > 0
    : materialDetail.single_material !== '';

  // 소재 입력 상태 (submit 핸들러와 공유하는 mutable 배열)
  // 형식: [{key: 부위명, value: 소재명}]
  let matItems = materialDetail.is_composite
    ? materialDetail.items.map(i => ({ key: i.key, value: i.value }))
    : [{ key: '', value: materialDetail.single_material }];

  // ── 백드롭 ──────────────────────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.id = '__sourcing_backdrop__';
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // ── 모달 패널 ────────────────────────────────────────────────────────────
  const modal = document.createElement('div');
  modal.id = '__sourcing_modal__';

  // ── 헤더 ─────────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = '__sm-header__';

  const thumbWrap = document.createElement('div');
  if (img.src) {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.className = '__sm-thumb__';
    thumb.referrerPolicy = 'no-referrer';
    thumb.onerror = () => { thumbWrap.innerHTML = '<div class="__sm-thumb-ph__">🛒</div>'; };
    thumbWrap.appendChild(thumb);
  } else {
    thumbWrap.innerHTML = '<div class="__sm-thumb-ph__">🛒</div>';
  }

  const titleBlock = document.createElement('div');
  titleBlock.style.cssText = 'flex:1;min-width:0;';
  titleBlock.innerHTML = `
    <div class="__sm-title__">소싱 담기</div>
    <div class="__sm-url__">${location.hostname}${location.pathname}</div>
  `;

  const closeBtn = document.createElement('button');
  closeBtn.className = '__sm-close__';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', closeModal);

  header.append(thumbWrap, titleBlock, closeBtn);

  // ── 바디 ─────────────────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = '__sm-body__';

  // 카테고리
  const catField = document.createElement('div');
  catField.className = '__sm-field__';
  const catLabel = document.createElement('label');
  catLabel.className = '__sm-label__';
  catLabel.innerHTML = '카테고리' +
    (detectedCat !== '기타' ? '<span class="__sm-auto__">✦ 자동 추출</span>' : '');
  const catSelect = document.createElement('select');
  catSelect.className = '__sm-input__';
  CATEGORY_OPTIONS.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt; o.textContent = opt;
    if (opt === mappedCategory) o.selected = true;
    catSelect.appendChild(o);
  });
  catField.append(catLabel, catSelect);

  // ── 소재 (단일/복합 동적 렌더링) ────────────────────────────────────────
  const matField = document.createElement('div');
  matField.className = '__sm-field__';

  const matLabel = document.createElement('label');
  matLabel.className = '__sm-label__';
  matLabel.innerHTML =
    '소재' +
    (autoDetectedMat ? ' <span class="__sm-auto__">✦ 자동 추출</span>' : '') +
    (materialDetail.is_composite
      ? ' <span class="__sm-auto__" style="background:#fef3c7;color:#92400e;">복합 소재</span>'
      : '');
  matField.appendChild(matLabel);

  if (materialDetail.is_composite) {
    // ── 복합: 부위-소재 key-value 쌍 입력 ─────────────────────────────────
    const pairsWrap = document.createElement('div');
    pairsWrap.style.cssText = 'display:flex;flex-direction:column;gap:5px;';

    matItems.forEach((item, idx) => {
      const row = document.createElement('div');
      row.style.cssText =
        'display:grid;grid-template-columns:72px 1fr;gap:5px;align-items:center;';

      const keyInp = document.createElement('input');
      keyInp.type = 'text';
      keyInp.className = '__sm-input__';
      keyInp.value = item.key;
      keyInp.placeholder = '부위';
      keyInp.style.cssText = 'font-size:12px;padding:7px 8px;';
      keyInp.addEventListener('input', () => { matItems[idx].key = keyInp.value; });

      const valInp = document.createElement('input');
      valInp.type = 'text';
      valInp.className = '__sm-input__';
      valInp.value = item.value;
      valInp.placeholder = '소재';
      valInp.style.cssText = 'font-size:12px;padding:7px 8px;';
      valInp.addEventListener('input', () => { matItems[idx].value = valInp.value; });

      row.append(keyInp, valInp);
      pairsWrap.appendChild(row);
    });

    matField.appendChild(pairsWrap);
  } else {
    // ── 단일: 텍스트 입력 하나 ────────────────────────────────────────────
    const singleInp = document.createElement('input');
    singleInp.type = 'text';
    singleInp.className = '__sm-input__';
    singleInp.placeholder = '예: 써지컬스틸, 통황동';
    singleInp.value = materialDetail.single_material;
    singleInp.addEventListener('input', () => { matItems[0].value = singleInp.value; });
    matField.appendChild(singleInp);
  }

  // 사입가 (autofocus)
  const priceField = document.createElement('div');
  priceField.className = '__sm-field__';
  const priceLabel = document.createElement('label');
  priceLabel.className = '__sm-label__';
  priceLabel.textContent = '사입가 (위안 ¥)';
  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.className = '__sm-input__';
  priceInput.placeholder = '0.00';
  priceInput.min = '0';
  priceInput.step = '0.01';
  const priceCalc = document.createElement('div');
  priceCalc.className = '__sm-calc__';
  priceCalc.innerHTML = '원화 원가: <b>—</b>';

  // 사입가 입력 시 원화 자동 계산
  priceInput.addEventListener('input', () => {
    const cny = parseFloat(priceInput.value);
    if (cny > 0) {
      const krw = Math.floor(cny * DEFAULT_EXCHANGE_RATE * 1.1);
      priceCalc.innerHTML = `¥${cny} × ${DEFAULT_EXCHANGE_RATE} × 1.1 = <b>₩${krw.toLocaleString('ko-KR')}</b>`;
    } else {
      priceCalc.innerHTML = '원화 원가: <b>—</b>';
    }
  });

  // Enter 키 → 저장
  priceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
  });

  priceField.append(priceLabel, priceInput, priceCalc);

  // 소싱 명분 (선택)
  const reasonField = document.createElement('div');
  reasonField.className = '__sm-field__';
  const reasonLabel = document.createElement('label');
  reasonLabel.className = '__sm-label__';
  reasonLabel.innerHTML = '소싱 명분 <span class="__sm-opt__">선택</span>';
  const reasonInput = document.createElement('textarea');
  reasonInput.className = '__sm-input__';
  reasonInput.placeholder = '이 제품을 소싱하는 이유';
  reasonInput.rows = 2;
  reasonInput.style.resize = 'none';
  reasonField.append(reasonLabel, reasonInput);

  body.append(catField, matField, priceField, reasonField);

  // ── 푸터 ─────────────────────────────────────────────────────────────────
  const footer = document.createElement('div');
  footer.className = '__sm-footer__';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = '__sm-btn-cancel__';
  cancelBtn.textContent = '취소';
  cancelBtn.addEventListener('click', closeModal);

  const submitBtn = document.createElement('button');
  submitBtn.className = '__sm-btn-submit__';
  submitBtn.innerHTML = '💾 DB에 저장';
  submitBtn.addEventListener('click', async () => {
    const cny = parseFloat(priceInput.value);
    if (!cny || cny <= 0) {
      priceInput.focus();
      priceInput.style.borderColor = '#ef4444';
      priceInput.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.18)';
      setTimeout(() => {
        priceInput.style.borderColor = '';
        priceInput.style.boxShadow   = '';
      }, 1400);
      return;
    }

    const priceKrw = Math.floor(cny * DEFAULT_EXCHANGE_RATE * 1.1);

    // ── material_detail 변환 ──────────────────────────────────────────────
    // 웹앱 스펙: [{part: 부위명, material: 소재명}] 포맷 (MaterialEntry[])
    // 익스텐션 내부: [{key, value}] → {part, material} 로 변환
    const validMatItems = matItems.filter(m => m.key?.trim() && m.value?.trim());
    const isCompositePayload = validMatItems.length >= 2;

    const material_detail_payload = isCompositePayload
      ? validMatItems.map(m => ({
          part:     m.key.trim(),
          material: m.value.trim(),
        }))
      : null;

    // material 컬럼: 단일 소재명 or 복합 시 '기타' (웹앱 필터링 호환)
    const material_str = isCompositePayload
      ? '기타'
      : (matItems[0]?.value?.trim() || '기타');

    const payload = {
      image_url:           img.src,
      source_url:          location.href,
      price_cny:           cny,
      price:               priceKrw,
      category:            catSelect.value,
      material:            material_str,
      material_detail:     material_detail_payload, // JS 배열 그대로 (supabase-js가 JSONB 직렬화)
      sourcing_reason:     reasonInput.value.trim() || null,
      status:              '대기 중',
      is_sample_available: false,
      moq:                 1,
    };

    submitBtn.disabled   = true;
    submitBtn.innerHTML  = '⏳ 저장 중…';

    try {
      await insertToSupabase(payload);
      closeModal();
      showToast('✅ 성공적으로 저장되었습니다');
    } catch (err) {
      submitBtn.disabled  = false;
      submitBtn.innerHTML = '💾 DB에 저장';
      showToast(`❌ 등록 실패: ${err.message}`, true);
    }
  });

  footer.append(cancelBtn, submitBtn);

  // ── 조립 & 마운트 ────────────────────────────────────────────────────────
  modal.append(header, body, footer);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  activeBackdrop = backdrop;

  // ESC 키로 닫기
  const escHandler = (e) => {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);

  // autofocus — 모달 애니메이션 끝난 뒤 포커스
  setTimeout(() => priceInput.focus(), 210);
}


// ════════════════════════════════════════════════════════════════════════════
//  6. 호버 버튼 — Non-destructive 좌표 기반 방식
//     ✅ img.classList / img.style / img.parentNode 절대 미접촉
//     ✅ document.body 직속 자식 단 1개만 생성
//     ✅ position: absolute + getBoundingClientRect + scrollY/scrollX
// ════════════════════════════════════════════════════════════════════════════
injectStyles();

// ── 글로벌 플로팅 버튼 (body 직속, 단 1개) ──────────────────────────────
const btn = document.createElement('div');
btn.id = '__sourcing_clip_btn__';
btn.innerHTML = '➕ 소싱 담기';
document.body.appendChild(btn);

let currentImg = null;   // 현재 추적 중인 img (DOM 조작 없음, 참조만)
let hideTimer  = null;

// ── 좌표 계산: getBoundingClientRect + scrollY/scrollX ────────────────────
// 이미지 우측 상단에 버튼 우측 끝이 맞닿도록 translateX(-100%) 활용
function positionBtn(img) {
  const r    = img.getBoundingClientRect();
  const top  = r.top  + window.scrollY + 8;          // 이미지 상단 + 8px
  const left = r.right + window.scrollX - 8;          // 이미지 우측 끝 - 8px

  btn.style.top       = `${Math.max(top, window.scrollY + 8)}px`;
  btn.style.left      = `${left}px`;
  btn.style.right     = 'auto';
  // 버튼 자신의 너비만큼 왼쪽으로 당겨 이미지 우측 안에 위치
  btn.style.transform = 'translateX(-100%)';
}

// ── 버튼 표시 (img DOM 불간섭) ────────────────────────────────────────────
function showBtn(img) {
  clearTimeout(hideTimer);
  currentImg = img;
  positionBtn(img);
  btn.style.display = 'flex';
}

// ── 버튼 숨김 딜레이 (버튼으로 이동 시 타이머 취소됨) ────────────────────
function scheduleHide() {
  hideTimer = setTimeout(() => {
    btn.style.display = 'none';
    currentImg = null;
  }, 130);
}

// ── 이미지 mouseover (이벤트 위임, passive) ───────────────────────────────
document.addEventListener('mouseover', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement)) return;

  // 100px 미만 이미지 제외
  const w = img.offsetWidth  || img.naturalWidth;
  const h = img.offsetHeight || img.naturalHeight;
  if (w < MIN_SIZE || h < MIN_SIZE) return;

  // 같은 이미지 재진입 시 타이머만 취소
  if (img === currentImg) { clearTimeout(hideTimer); return; }

  showBtn(img);
}, { passive: true });

// ── 이미지 mouseout → 버튼 숨김 예약 ────────────────────────────────────
document.addEventListener('mouseout', (e) => {
  // 추적 중인 이미지를 벗어날 때만 반응
  if (e.target !== currentImg) return;
  // relatedTarget이 버튼 자신이면 취소 (이미지 → 버튼 이동)
  if (e.relatedTarget === btn) return;
  scheduleHide();
}, { passive: true });

// ── 버튼 mouseenter → 숨김 타이머 취소 ──────────────────────────────────
btn.addEventListener('mouseenter', () => clearTimeout(hideTimer));

// ── 버튼 mouseleave → 버튼+이미지 둘 다 벗어남 → 즉시 숨김 ──────────────
btn.addEventListener('mouseleave', (e) => {
  // relatedTarget이 추적 중인 이미지로 돌아가면 유지
  if (e.relatedTarget === currentImg) { clearTimeout(hideTimer); return; }
  scheduleHide();
});

// ── 버튼 클릭 → 모달 오픈 ────────────────────────────────────────────────
btn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!currentImg) return;
  const imgSnapshot = currentImg;   // 클로저용 스냅샷
  btn.style.display = 'none';
  currentImg = null;
  clearTimeout(hideTimer);
  openModal(imgSnapshot);           // img DOM 조작 없이 참조만 전달
});
