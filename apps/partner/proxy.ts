import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

import { isServerAuthBypass } from "@/lib/auth-bypass"
import { getLoginPath, getSafeAuthReturnPath } from "@/lib/auth-redirect"
import {
  isPublicPath,
  isPartnerLoginEntryPath,
  resolveWorkspaceSlug,
  rewritePartnerEntryPath,
  rewriteSubdomainPath,
} from "@/lib/workspace-resolver"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api/share-preview/")) return NextResponse.next()

  const host = request.headers.get("host") ?? ""
  const resolution = resolveWorkspaceSlug({ host, pathname })

  if (!resolution.ok) {
    return new NextResponse("Unknown partner workspace", { status: 404 })
  }

  // Staff administration is an apex-only surface. A tenant hostname must never
  // turn /admin into a workspace route or become another staff login origin.
  if (pathname === "/admin" && resolution.source === "host") {
    return new NextResponse("Not found", { status: 404 })
  }

  const isPartnerLoginEntry = isPartnerLoginEntryPath(pathname)
  const rewrittenPath = resolution.slug
    ? resolution.source === "host"
      ? rewriteSubdomainPath(pathname, resolution.slug)
      : resolution.source === "entry" && !isPartnerLoginEntry
        ? rewritePartnerEntryPath(pathname, resolution.slug)
        : pathname
    : pathname

  if (isServerAuthBypass()) return NextResponse.next()
  if (pathname.startsWith("/api/auth")) return NextResponse.next()

  const session = getSessionCookie(request)
  if (pathname === "/login" && session) {
    const returnPath = getSafeAuthReturnPath(
      request.nextUrl.searchParams.get("from"),
    )
    return NextResponse.redirect(new URL(returnPath, request.url))
  }
  if (isPublicPath(pathname)) return NextResponse.next()

  if (!session) {
    const requestedPath = `${pathname}${request.nextUrl.search}`
    const loginUrl = new URL(getLoginPath(requestedPath), request.url)
    if (resolution.source === "entry" && resolution.slug) {
      loginUrl.searchParams.set("workspace", resolution.slug)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (rewrittenPath !== pathname) {
    const url = request.nextUrl.clone()
    url.pathname = rewrittenPath
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|beam-logo.png).*)"],
}
