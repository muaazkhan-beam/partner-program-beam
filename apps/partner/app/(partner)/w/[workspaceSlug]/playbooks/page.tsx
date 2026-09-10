import { redirect } from "next/navigation"

import { workspacePath } from "@/lib/workspace-resolver"

export default async function PlaybooksPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  redirect(workspacePath(workspaceSlug, "/materials"))
}
