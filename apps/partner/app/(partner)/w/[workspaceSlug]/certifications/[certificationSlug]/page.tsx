import { notFound } from "next/navigation"

import { CertificationDetail } from "@/components/certification-detail"
import { PageContainer } from "@/components/page-container"
import { getCertification } from "@/lib/certifications"

export default async function CertificationDetailPage({
  params,
}: {
  params: Promise<{ certificationSlug: string }>
}) {
  const { certificationSlug } = await params
  const certification = getCertification(certificationSlug)

  if (!certification) notFound()

  return (
    <PageContainer>
      <CertificationDetail certification={certification} />
    </PageContainer>
  )
}
