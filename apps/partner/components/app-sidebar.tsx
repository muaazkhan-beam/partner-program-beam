"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiAiAgentLine,
  RiCompass3Line,
  RiFileTextLine,
  RiHome5Line,
  RiMedalLine,
  RiQuestionLine,
  RiSendPlaneLine,
  RiShieldUserLine,
  RiStackLine,
  RiToolsLine,
} from "@remixicon/react"

import { AuthUserControl } from "@/components/auth-user-control"
import { BeamLogo } from "@/components/beam-logo"
import { NavMain, type NavItem, type NavSection } from "@/components/nav-main"
import { useWorkspace } from "@/components/workspace-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { workspacePath } from "@/lib/workspace-resolver"

type NavDefinition = {
  title: string
  path: string
  icon: typeof RiHome5Line
  surface: string
  badge?: string
  children?: NavDefinition[]
}

/**
 * Two groups rather than one flat list.
 *
 * "Work" holds the pages a partner moves through on a live deal; "Reference"
 * holds the pages they look something up in. They behave differently — one is
 * a sequence with state, the other is a catalog — and listing them at one
 * level made a partner read all nine labels to find either.
 *
 * Journey is not here: it now opens from Home, which is where a partner lands
 * anyway. Requests is not here either — it is an action, not a place, so it
 * sits below the groups.
 */
const WORK: NavDefinition[] = [
  {
    title: "Scope",
    path: "/journey",
    icon: RiCompass3Line,
    surface: "journey",
    children: [
      {
        title: "Agents",
        path: "/agents",
        icon: RiAiAgentLine,
        surface: "agents",
      },
      {
        title: "Use cases",
        path: "/use-cases",
        icon: RiStackLine,
        surface: "use-cases",
      },
    ],
  },
]

const REFERENCE: NavDefinition[] = [
  { title: "Tools", path: "/tools", icon: RiToolsLine, surface: "tools" },
  {
    title: "Materials",
    path: "/materials",
    icon: RiFileTextLine,
    surface: "materials",
  },
  { title: "FAQ", path: "/faq", icon: RiQuestionLine, surface: "faq" },
  {
    title: "Certifications",
    path: "/certifications",
    icon: RiMedalLine,
    surface: "certifications",
  },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const workspace = useWorkspace()
  const surfaces = new Set(workspace.enabledSurfaces)

  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(`${url}/`)

  const toItem = (definition: NavDefinition): NavItem => {
    const url = workspacePath(workspace.slug, definition.path)
    const Icon = definition.icon
    return {
      title: definition.title,
      url,
      icon: <Icon />,
      active: isActive(url),
      badge: definition.badge,
      children: definition.children
        ?.filter((child) => surfaces.has(child.surface))
        .map((child) => {
          const childUrl = workspacePath(workspace.slug, child.path)
          const ChildIcon = child.icon
          return {
            title: child.title,
            url: childUrl,
            icon: <ChildIcon />,
            active: isActive(childUrl),
            badge: child.badge,
          }
        }),
    }
  }

  /**
   * A parent stays when its own surface is off but a child is on — otherwise
   * turning off Journey for a workspace would hide Agents and Use cases with
   * it. In that case the parent links to the first child it still has.
   */
  const build = (definitions: NavDefinition[]) =>
    definitions
      .map((definition) => {
        const enabled = surfaces.has(definition.surface)
        const item = toItem(definition)
        if (enabled) return item
        const [first, ...rest] = item.children ?? []
        if (!first) return null
        return { ...first, children: rest }
      })
      .filter((item): item is NavItem => item !== null)

  const sections: NavSection[] = [
    { label: "Work", items: build(WORK) },
    { label: "Reference", items: build(REFERENCE) },
  ].filter((section) => section.items.length > 0)

  const homeUrl = workspacePath(workspace.slug, "/home")
  const requestsUrl = workspacePath(workspace.slug, "/requests")

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:px-2"
              render={<Link href={homeUrl} />}
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
        {surfaces.has("home") ? (
          <SidebarGroup className="pb-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Home"
                    isActive={isActive(homeUrl)}
                    render={<Link href={homeUrl} />}
                  >
                    <RiHome5Line />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <NavMain sections={sections} />
      </SidebarContent>

      <SidebarFooter>
        {surfaces.has("requests") ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Ask Beam for help on a deal"
                isActive={isActive(requestsUrl)}
                className="justify-center border bg-sidebar-accent/60 font-medium"
                render={<Link href={requestsUrl} />}
              >
                <RiSendPlaneLine />
                <span>Request Beam</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}

        {workspace.isStaff ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Staff admin"
                isActive={pathname.startsWith("/admin")}
                render={<Link href="/admin" />}
              >
                <RiShieldUserLine />
                <span>Admin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}

        <AuthUserControl />
      </SidebarFooter>
    </Sidebar>
  )
}
