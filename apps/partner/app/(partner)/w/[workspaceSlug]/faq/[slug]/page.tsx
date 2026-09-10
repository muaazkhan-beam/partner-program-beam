"use client"

import { ContentDetailPage } from "@/components/content-detail-page"

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <ContentDetailPage kind="faq" params={params} />
}
