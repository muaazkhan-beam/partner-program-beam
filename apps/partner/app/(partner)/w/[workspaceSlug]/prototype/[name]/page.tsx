"use client"

import { notFound, useParams } from "next/navigation"
import { useSyncExternalStore } from "react"

import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { PrototypeSwitcher } from "@/components/prototype-switcher"
import { prototypes } from "@/components/prototypes/registry"

const enabled = process.env.NEXT_PUBLIC_PROTOTYPES === "true"

function subscribeToLocation(listener: () => void) {
  window.addEventListener("popstate", listener)
  return () => window.removeEventListener("popstate", listener)
}

export default function PrototypePage() {
  const params = useParams<{ name: string }>()
  const entry = enabled ? prototypes[params.name] : undefined
  // The variant is read from the URL on the client only: the demo is a
  // production build, and useSearchParams would force a Suspense boundary.
  const variantKey = useSyncExternalStore(
    subscribeToLocation,
    () => new URLSearchParams(window.location.search).get("variant"),
    () => null
  )

  if (!entry) notFound()

  const variant =
    entry.variants.find((candidate) => candidate.key === variantKey) ??
    entry.variants[0]
  if (!variant) notFound()
  const Variant = variant.Component

  return (
    <PageContainer className="space-y-8 pb-16">
      <PageHeading title={entry.title} description={entry.description} />
      <Variant key={variant.key} />
      <PrototypeSwitcher
        variants={entry.variants.map(({ key, label }) => ({ key, label }))}
        current={variant.key}
      />
    </PageContainer>
  )
}
