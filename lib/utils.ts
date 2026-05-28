/** 1688/알리CDN 이미지 URL을 Next.js 이미지 프록시 경로로 변환합니다.
 *  - http → https 강제 변환
 *  - 1688/alicdn 도메인 이미지만 프록시를 통해 제공 (SSRF 방지)
 *  - 그 외 도메인은 https URL 그대로 반환
 */
export function proxyImageUrl(src: string): string {
  if (!src) return "";
  const https = src.replace(/^http:\/\//i, "https://");
  try {
    const url = new URL(https);
    const needsProxy = [
      "alicdn.com",
      "1688.com",
      "img.alicdn.com",
      "cbu01.alicdn.com",
      "sc01.alicdn.com",
      "gw.alicdn.com",
    ].some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
    if (needsProxy) {
      return `/api/proxy-image?url=${encodeURIComponent(https)}`;
    }
  } catch {
    // invalid URL — fall through
  }
  return https;
}

export const fmtKrw = (n: number) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);
