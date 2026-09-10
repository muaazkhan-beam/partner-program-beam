import rawCatalog from "@/convex/generated/catalog.json"
import type { PartnerCatalog } from "@/convex/catalogTypes"

const catalog = rawCatalog as PartnerCatalog
const shareCdnPattern =
  /https:\/\/cdn\.shares\.beam\.ai\/s\/[A-Za-z0-9._-]+\/shares\/[A-Za-z0-9._-]+\//

const previewCsp = [
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'none'",
  "base-uri 'self'",
].join("; ")

function errorPage(message: string, status: number) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#050913;color:#fff;font:16px/1.5 system-ui,sans-serif}.card{max-width:32rem;padding:2rem;text-align:center}.card p{color:#aeb8ca}.card a{color:#fff}</style></head><body><div class="card"><h1>Preview unavailable</h1><p>${message}</p><p>Use “Open in Beam Shares” below the preview.</p></div></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": previewCsp,
        "Cache-Control": "no-store",
        "X-Frame-Options": "SAMEORIGIN",
      },
    }
  )
}

function getShareUrl(slug: string) {
  const item = [...catalog.materials, ...catalog.playbooks].find(
    (entry) => entry.slug === slug
  )
  return item?.shareUrl?.startsWith("https://shares.beam.ai/s/")
    ? item.shareUrl
    : undefined
}

async function resolveCdnBase(shareUrl: string) {
  const response = await fetch(shareUrl, { cache: "no-store" })
  if (!response.ok) return undefined
  const html = await response.text()
  return html.match(shareCdnPattern)?.[0]
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; path?: string[] }> }
) {
  const { slug, path = [] } = await context.params
  const shareUrl = getShareUrl(slug)
  if (!shareUrl)
    return errorPage("This Share is not approved for preview.", 404)
  if (
    path.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        !/^[A-Za-z0-9._-]+$/.test(segment)
    )
  ) {
    return errorPage("The requested preview asset is invalid.", 400)
  }

  const cdnBase = await resolveCdnBase(shareUrl)
  if (!cdnBase) {
    return errorPage("Beam Shares did not return a published preview.", 502)
  }

  const upstreamUrl = new URL(path.map(encodeURIComponent).join("/"), cdnBase)
  const upstream = await fetch(upstreamUrl, { cache: "no-store" })
  if (!upstream.ok || !upstream.body) {
    return errorPage("The published preview asset could not be loaded.", 502)
  }

  const headers = new Headers()
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? "application/octet-stream"
  )
  headers.set("Cache-Control", "public, max-age=300, s-maxage=300")
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("X-Frame-Options", "SAMEORIGIN")
  headers.set("Referrer-Policy", "no-referrer")
  if (path.length === 0) {
    headers.set("Content-Security-Policy", previewCsp)
    const html = await upstream.text()
    const baseHref = `/api/share-preview/${encodeURIComponent(slug)}/`
    return new Response(
      html.replace("<head>", `<head><base href="${baseHref}">`),
      { status: 200, headers }
    )
  }

  return new Response(upstream.body, { status: 200, headers })
}
