import { PartnerGate } from "@/components/partner-gate"
import { PartnerShell } from "@/components/partner-shell"

export default async function WorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}>) {
  const { workspaceSlug } = await params
  return (
    <PartnerGate workspaceSlug={workspaceSlug}>
      <PartnerShell>{children}</PartnerShell>
    </PartnerGate>
  )
}
