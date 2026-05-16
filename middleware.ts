import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const APP_ROUTES = [
  "/",
  "/dashboard",
  "/inventory",
  "/inventory/new",
  "/requests",
  "/requests/new",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    APP_ROUTES.includes(pathname) ||
    /^\/requests\/[^/]+$/.test(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
