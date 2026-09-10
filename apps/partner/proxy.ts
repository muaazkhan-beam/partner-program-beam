import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

import { isServerAuthBypass } from "@/lib/auth-bypass"
import { getLoginPath, getSafeAuthReturnPath } from "@/lib/auth-redirect"
import {
  isPublicPath,
  resolveWorkspaceSlug,
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

  if (resolution.source === "host" && resolution.slug) {
    const rewritten = rewriteSubdomainPath(pathname, resolution.slug)
    if (rewritten !== pathname) {
      const url = request.nextUrl.clone()
      url.pathname = rewritten
      return NextResponse.rewrite(url)
    }
  }

  if (isServerAuthBypass()) return NextResponse.next()
  if (pathname.startsWith("/api/auth")) return NextResponse.next()

  const session = getSessionCookie(request)
  if (pathname === "/login" && session) {
    const returnPath = getSafeAuthReturnPath(
      request.nextUrl.searchParams.get("from")
    )
    return NextResponse.redirect(new URL(returnPath, request.url))
  }
  if (isPublicPath(pathname) || session) return NextResponse.next()

  const requestedPath = `${pathname}${request.nextUrl.search}`
  return NextResponse.redirect(
    new URL(getLoginPath(requestedPath), request.url)
  )
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|beam-logo.png).*)"],
}
