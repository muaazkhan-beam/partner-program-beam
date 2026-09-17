import { AdminWorkspaceGate } from "@/components/admin-workspace-context"

export default async function AdminWorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}>) {
  const { workspaceSlug } = await params
  return (
    <AdminWorkspaceGate workspaceSlug={workspaceSlug}>
      {children}
    </AdminWorkspaceGate>
  )
}
