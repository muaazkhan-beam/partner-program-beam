"use client"

import { use } from "react"

import { ContentDetail } from "@/components/content-views"
import type { ContentKind } from "@/convex/catalogTypes"
import { PageContainer } from "@/components/page-container"

export function ContentDetailPage({
  kind,
  params,
}: {
  kind: ContentKind
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return (
    <PageContainer>
      <ContentDetail kind={kind} slug={slug} />
    </PageContainer>
  )
}
