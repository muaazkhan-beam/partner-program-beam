"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"

export type PrototypeVariant = { key: string; label: string }

/**
 * Floating switcher for throwaway prototypes. The variant lives in the URL so
 * a link is shareable and reload-stable; arrow keys cycle unless the focus is
 * in a field. Rendered only when NEXT_PUBLIC_PROTOTYPES is "true" at build.
 */
export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: PrototypeVariant[]
  current: string
}) {
  const router = useRouter()
  const index = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current)
  )

  function go(next: number) {
    const target = variants[(next + variants.length) % variants.length]
    if (!target) return
    const url = new URL(window.location.href)
    url.searchParams.set("variant", target.key)
    router.replace(`${url.pathname}${url.search}`, { scroll: false })
    // The page reads the variant through a popstate subscription.
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return
      }
      if (event.key === "ArrowRight") go(index + 1)
      if (event.key === "ArrowLeft") go(index - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const active = variants[index]
  return (
    <div
      role="toolbar"
      aria-label="Prototype variants"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/95 px-2 py-1 text-xs shadow-sm backdrop-blur"
    >
      <button
        type="button"
        aria-label="Previous variant"
        className="rounded-full p-1 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => go(index - 1)}
      >
        <RiArrowLeftSLine className="size-4" aria-hidden="true" />
      </button>
      <span className="px-2 font-medium">
        {active ? `${active.key.toUpperCase()} · ${active.label}` : "Prototype"}
      </span>
      <button
        type="button"
        aria-label="Next variant"
        className="rounded-full p-1 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => go(index + 1)}
      >
        <RiArrowRightSLine className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
