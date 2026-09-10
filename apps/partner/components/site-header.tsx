"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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
import { workspacePath } from "@/lib/workspace-resolver"

const titles: Record<string, string> = {
  home: "Home",
  tools: "Tools",
  materials: "Materials",
  faq: "FAQ",
  requests: "Requests",
  admin: "Admin",
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
                  {decodeURIComponent(detail)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="text-sm font-medium sm:text-base">{title}</h1>
        )}
      </div>
    </header>
  )
}
