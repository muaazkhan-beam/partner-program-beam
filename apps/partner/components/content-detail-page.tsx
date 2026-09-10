"use client"

import { use } from "react"

import { ContentDetail } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"

export function ContentDetailPage({
  kind,
  params,
}: {
  kind: "tool" | "material" | "faq" | "playbook"
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return (
    <PageContainer>
      <ContentDetail kind={kind} slug={slug} />
    </PageContainer>
  )
}
