import { NextRequest, NextResponse } from "next/server";

/** SSRF 방지: 허용된 1688/알리바바 CDN 도메인만 프록시 */
const ALLOWED_HOSTS = [
  "alicdn.com",
  "1688.com",
  "img.alicdn.com",
  "cbu01.alicdn.com",
  "sc01.alicdn.com",
  "gw.alicdn.com",
];

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  if (!isAllowedHost(parsedUrl.hostname)) {
    return new NextResponse("Domain not allowed", { status: 403 });
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        Referer: "https://www.1688.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, {
        status: response.status,
      });
    }

    const contentType =
      response.headers.get("Content-Type") ?? "image/jpeg";

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[proxy-image] fetch error:", err);
    return new NextResponse("Proxy fetch failed", { status: 502 });
  }
}
