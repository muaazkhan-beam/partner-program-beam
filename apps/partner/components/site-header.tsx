"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { PackButton } from "@/components/pack-button"
import { useWorkspace } from "@/components/workspace-context"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { ContentKind } from "@/convex/catalogTypes"
import { getWorkspaceItem } from "@/lib/catalog/static"
import { getCertification } from "@/lib/certifications"
import { workspacePath } from "@/lib/workspace-resolver"

const titles: Record<string, string> = {
  home: "Home",
  journey: "Partner journey",
  tools: "Tools",
  materials: "Materials",
  compliance: "Security & compliance",
  scope: "Scope",
  pack: "Client pack",
  faq: "FAQ",
  certifications: "Certifications",
  agents: "Agents",
  requests: "Ask the Beam team",
  "use-cases": "Use cases",
  playbooks: "Playbooks",
  admin: "Admin",
}

const detailKind: Record<string, ContentKind> = {
  materials: "material",
  faq: "faq",
  tools: "tool",
  playbooks: "playbook",
  "use-cases": "use-case",
}

/** The item's title in the breadcrumb, never its URL slug. */
function detailTitle(workspaceSlug: string, surface: string | undefined, detail: string) {
  const slug = decodeURIComponent(detail)
  if (surface === "certifications") return getCertification(slug)?.name ?? slug
  const kind = surface ? detailKind[surface] : undefined
  return (kind && getWorkspaceItem(workspaceSlug, kind, slug)?.title) || slug
}

export function SiteHeader() {
  const pathname = usePathname()
  const workspace = useWorkspace()
  const segments = pathname.split("/").filter(Boolean)
  const surface = segments[0] === "w" ? segments[2] : segments[0]
  const detail = segments[0] === "w" ? segments[3] : segments[1]
  const title = titles[surface ?? "home"] ?? "Beam Partner"

  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center border-b bg-background/90 backdrop-blur-xl">
      <div className="flex w-full items-center gap-2 px-4 sm:px-5 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:self-auto"
        />
        {detail ? (
          <Breadcrumb>
            <BreadcrumbList className="text-sm sm:text-base">
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={
                    <Link
                      href={workspacePath(workspace.slug, `/${surface}`)}
                    />
                  }
                >
                  {title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {detailTitle(workspace.slug, surface, detail)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="text-sm font-medium sm:text-base">{title}</h1>
        )}
        <div className="ml-auto flex items-center gap-2">
          <PackButton />
        </div>
      </div>
    </header>
  )
}
