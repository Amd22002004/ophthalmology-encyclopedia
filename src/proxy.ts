import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/forgot-password") ||
    pathname.startsWith("/admin/reset-password/")
  ) {
    return secureResponse(request, NextResponse.next());
  }

  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/cabinet")) {
    const sessionCookie = request.cookies.get("participant_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return secureResponse(request, NextResponse.next());
}

function secureResponse(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/invitation") ||
    pathname.startsWith("/cabinet")
  ) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*", "/invitation/:path*", "/cabinet/:path*"],
};
