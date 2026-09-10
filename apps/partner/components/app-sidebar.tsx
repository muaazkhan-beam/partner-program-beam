"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiMedalLine,
  RiFileTextLine,
  RiHome5Line,
  RiQuestionLine,
  RiSendPlaneLine,
  RiShieldUserLine,
  RiToolsLine,
} from "@remixicon/react"

import { AuthUserControl } from "@/components/auth-user-control"
import { BeamLogo } from "@/components/beam-logo"
import { NavMain } from "@/components/nav-main"
import { useWorkspace } from "@/components/workspace-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { workspacePath } from "@/lib/workspace-resolver"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const workspace = useWorkspace()
  const surfaces = new Set(workspace.enabledSurfaces)
  const navigation = [
    { title: "Home", url: workspacePath(workspace.slug, "/home"), icon: RiHome5Line, surface: "home" },
    { title: "Tools", url: workspacePath(workspace.slug, "/tools"), icon: RiToolsLine, surface: "tools" },
    { title: "Materials", url: workspacePath(workspace.slug, "/materials"), icon: RiFileTextLine, surface: "materials" },
    { title: "FAQ", url: workspacePath(workspace.slug, "/faq"), icon: RiQuestionLine, surface: "faq" },
    { title: "Certifications", url: workspacePath(workspace.slug, "/certifications"), icon: RiMedalLine, surface: "certifications", badge: "New" },
    { title: "Requests", url: workspacePath(workspace.slug, "/requests"), icon: RiSendPlaneLine, surface: "requests" },
    ...(workspace.isStaff
      ? [
          {
            title: "Admin",
            url: "/admin",
            icon: RiShieldUserLine,
            surface: "admin",
          },
        ]
      : []),
  ].filter((item) => item.surface === "admin" || surfaces.has(item.surface))

  const items = navigation.map((item) => ({
    ...item,
    active: pathname === item.url || pathname.startsWith(`${item.url}/`),
    icon: <item.icon />,
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:px-2"
              render={<Link href={workspacePath(workspace.slug, "/home")} />}
            >
              <BeamLogo className="size-8 rounded-lg" />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">
                  {workspace.brandHeader}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Beam Partner
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <AuthUserControl />
      </SidebarFooter>
    </Sidebar>
  )
}
