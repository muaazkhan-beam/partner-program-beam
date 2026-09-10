"use client"

import { type FormEvent, type ReactNode, useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"

import { api } from "@partner/convex/_generated/api"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { authBypass } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWorkspace } from "@/components/workspace-context"
import { getCertification } from "@/lib/certifications"

const stages = ["qualify", "diagnostic", "shadow", "success-criteria"] as const
const supportTypes = [
  "shadow-demo",
  "deployment-review",
  "faq-escalation",
  "other",
] as const

export default function RequestsPage() {
  if (authBypass) {
    return <PreviewRequestsPage />
  }
  return <LiveRequestsPage />
}

type RequestInput = {
  accountName: string
  candidateProcess: string
  stage: (typeof stages)[number]
  supportType: (typeof supportTypes)[number]
  problemStatement: string
}

function PreviewRequestsPage() {
  return (
    <RequestsForm
      onCreate={async () =>
        "Preview bypass does not create requests. In a live workspace this returns a request ID, owner, and status."
      }
    />
  )
}

function LiveRequestsPage() {
  const workspace = useWorkspace()
  const createRequest = useMutation(api.partner.createRequest)
  const requests = useQuery(api.partner.listRequests, {
    workspaceId: workspace.workspaceId as never,
    paginationOpts: { numItems: 20, cursor: null },
  })

  return (
    <RequestsForm
      onCreate={async (input) => {
        const created = await createRequest({
          workspaceId: workspace.workspaceId as never,
          accountName: input.accountName.trim() || undefined,
          candidateProcess: input.candidateProcess,
          stage: input.stage,
          supportType: input.supportType,
          problemStatement: input.problemStatement,
        })
        return `${created.requestKey} is ${created.status}. Owner: ${created.owner}.`
      }}
      requests={
        requests ? (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Open requests</h2>
            {requests.page.length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet.</p>
            ) : (
              <ul className="space-y-2">
                {requests.page.map((request) => (
                  <li
                    key={request._id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <strong>{request.requestKey}</strong> · {request.status} ·{" "}
                    {request.candidateProcess}
                    {request.owner ? ` · ${request.owner}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null
      }
    />
  )
}

function RequestsForm({
  onCreate,
  requests,
}: {
  onCreate: (input: RequestInput) => Promise<string>
  requests?: ReactNode
}) {
  const [accountName, setAccountName] = useState("")
  const [candidateProcess, setCandidateProcess] = useState("")
  const [stage, setStage] = useState<(typeof stages)[number]>("qualify")
  const [supportType, setSupportType] =
    useState<(typeof supportTypes)[number]>("shadow-demo")
  const [problemStatement, setProblemStatement] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const certificationSlug = new URLSearchParams(window.location.search).get(
      "certification"
    )
    const certification = getCertification(certificationSlug ?? "")
    if (!certification) return

    const prefill = window.setTimeout(() => {
      setCandidateProcess(`Partner certification — ${certification.name}`)
      setSupportType("other")
      setProblemStatement(
        certification.active
          ? `Please add me to the next ${certification.name} certification cohort.`
          : `Please review my readiness for the ${certification.name} certification.`
      )
    }, 0)

    return () => window.clearTimeout(prefill)
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setResult(null)
    try {
      const message = await onCreate({
        accountName,
        candidateProcess,
        stage,
        supportType,
        problemStatement,
      })
      setResult(message)
      setCandidateProcess("")
      setProblemStatement("")
      setAccountName("")
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create the request"
      )
    }
  }

  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Start a client opportunity"
        description="A small request into Beam, not a CRM. Do not upload client data."
      />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Request Beam support</h2>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="account">Named account (optional)</Label>
              <Input
                id="account"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="process">Candidate process</Label>
              <Input
                id="process"
                required
                value={candidateProcess}
                onChange={(event) => setCandidateProcess(event.target.value)}
                placeholder="Invoice exceptions in shared services"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <select
                  id="stage"
                  className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
                  value={stage}
                  onChange={(event) =>
                    setStage(event.target.value as (typeof stages)[number])
                  }
                >
                  {stages.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support">Requested support</Label>
                <select
                  id="support"
                  className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
                  value={supportType}
                  onChange={(event) =>
                    setSupportType(
                      event.target.value as (typeof supportTypes)[number]
                    )
                  }
                >
                  {supportTypes.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="problem">Problem statement</Label>
              <textarea
                id="problem"
                required
                className="min-h-28 w-full rounded-lg border bg-background p-2 text-sm"
                value={problemStatement}
                onChange={(event) => setProblemStatement(event.target.value)}
              />
            </div>
            <Button type="submit">Create request</Button>
            {result ? (
              <p className="text-sm text-muted-foreground">{result}</p>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
      {requests}
    </PageContainer>
  )
}
