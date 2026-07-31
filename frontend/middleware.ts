import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// میان‌ور (Middleware) محافظت از ثبت‌نام — پلتفرم املاک ایران
// =============================================================================
// ۱. محدودیت نرخ ثبت‌نام: کاربر باید حداقل ۶۰ ثانیه در سایت بگردد
// ۲. تشخیص VPN/پراکسی: مسدودسازی IPهای معروف VPN و دیتاسنتر
// ۳. محافظت در برابر ربات‌ها
// =============================================================================

const FIRST_VISIT_COOKIE = "site_first_visit";
const REGISTRATION_COOLDOWN_MS = 60 * 1000;

const REGISTRATION_PATHS = ["/auth/register", "/auth/signup", "/register"];
const LOGIN_PATHS = ["/auth/login", "/login"];
const AUTH_PATHS = [...REGISTRATION_PATHS, ...LOGIN_PATHS];

// ---------------------------------------------------------------------------
// VPN Detection
// ---------------------------------------------------------------------------

const VPN_DATA_CENTER_RANGES: string[] = [
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "108.162.192.0/18",
  "131.0.72.0/22",
  "141.101.64.0/18",
  "162.158.0.0/15",
  "172.64.0.0/13",
  "173.245.48.0/20",
  "188.114.96.0/20",
  "190.93.240.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "185.159.128.0/22",
  "193.180.119.0/24",
  "145.239.0.0/16",
  "91.108.4.0/22",
  "91.108.8.0/22",
  "194.242.2.0/24",
  "185.232.21.0/24",
  "194.126.160.0/24",
  "45.33.32.0/24",
  "149.28.0.0/16",
  "209.58.128.0/17",
  "67.205.0.0/18",
  "142.93.0.0/16",
  "178.128.0.0/16",
  "188.166.0.0/16",
  "159.65.0.0/16",
  "104.236.0.0/14",
  "116.202.0.0/15",
  "136.243.0.0/16",
  "95.216.0.0/16",
  "78.46.0.0/15",
  "176.9.0.0/16",
  "139.162.0.0/16",
  "172.105.0.0/16",
  "198.58.96.0/21",
  "23.106.128.0/17",
  "85.90.246.0/23",
  "5.188.0.0/16",
  "185.220.101.0/24",
  "217.160.0.0/16",
];

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (
    ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0
  );
}

function isIPInRange(ip: string, cidr: string): boolean {
  const [rangeIP, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr ?? "32", 10);
  if (isNaN(bits)) return false;
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(rangeIP ?? "0.0.0.0");
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

function extractClientIP(request: NextRequest): string | null {
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[ips.length - 1] ?? null;
  }
  return null;
}

function isVPNOrProxy(request: NextRequest): boolean {
  const clientIP = extractClientIP(request);
  if (!clientIP) return false;

  for (const range of VPN_DATA_CENTER_RANGES) {
    if (isIPInRange(clientIP, range)) return true;
  }

  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry === "IR") return false;

  return false;
}

// ---------------------------------------------------------------------------
// Bot Detection
// ---------------------------------------------------------------------------

const BOT_UA_PATTERNS: RegExp[] = [
  /\b(bot|crawl|spider|scraper|slurp)\b/i,
  /\b(curl|wget|python-requests|python-urllib|node-fetch)\b/i,
  /\b(scrapy|selenium|puppeteer|playwright|phantomjs)\b/i,
  /\b(googlebot|bingbot|yandex|baiduspider)\b/i,
];

const BLOCKED_UA_SUBSTRINGS: string[] = [
  "curl/",
  "wget/",
  "python-requests/",
  "Go-http-client",
  "Java/",
  "Apache-HttpClient",
  "okhttp/",
  "axios/",
  "node-fetch",
  "libwww-perl",
  "httpclient",
  "scrapy",
];

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true;
  for (const pattern of BOT_UA_PATTERNS) {
    if (pattern.test(userAgent)) return true;
  }
  const lowerUA = userAgent.toLowerCase();
  for (const substring of BLOCKED_UA_SUBSTRINGS) {
    if (lowerUA.includes(substring.toLowerCase())) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOrCreateFirstVisitCookie(
  request: NextRequest,
  response: NextResponse,
): number {
  const existingCookie = request.cookies.get(FIRST_VISIT_COOKIE);
  if (existingCookie?.value) return parseInt(existingCookie.value, 10);

  const now = Date.now();
  response.cookies.set(FIRST_VISIT_COOKIE, now.toString(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return now;
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isRegistrationPath(pathname: string): boolean {
  return REGISTRATION_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

// ---------------------------------------------------------------------------
// Main Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  // فقط مسیرهای احراز هویت
  if (!isAuthPath(pathname)) {
    getOrCreateFirstVisitCookie(request, response);
    return response;
  }

  // ۱. محافظت ربات
  const userAgent = request.headers.get("user-agent");
  if (isBotUserAgent(userAgent)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ۲. تشخیص VPN
  if (isVPNOrProxy(request)) {
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("msg", "vpn_blocked");
    return NextResponse.redirect(homeUrl);
  }

  // ۳. محدودیت ۶۰ ثانیه (فقط ثبت‌نام)
  if (isRegistrationPath(pathname)) {
    const firstVisitTime = getOrCreateFirstVisitCookie(request, response);
    const elapsed = Date.now() - firstVisitTime;

    if (elapsed < REGISTRATION_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil(
        (REGISTRATION_COOLDOWN_MS - elapsed) / 1000,
      );
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("msg", "register_wait");
      return NextResponse.redirect(homeUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/register",
    "/register/:path*",
    "/login",
    "/login/:path*",
  ],
};
