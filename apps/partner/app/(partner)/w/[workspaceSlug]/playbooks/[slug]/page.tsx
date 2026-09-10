import { redirect } from "next/navigation"

import { workspacePath } from "@/lib/workspace-resolver"

export default async function PlaybookDetailRedirect({
  params,
}: {
  params: Promise<{ workspaceSlug: string; slug: string }>
}) {
  const { workspaceSlug, slug } = await params
  redirect(workspacePath(workspaceSlug, `/materials/${slug}`))
}
