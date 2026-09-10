"use client"

import { use } from "react"

import { MaterialsContentDetail } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return (
    <PageContainer>
      <MaterialsContentDetail slug={slug} />
    </PageContainer>
  )
}
