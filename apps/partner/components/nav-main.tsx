"use client"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  active: boolean
  badge?: string
  children?: Omit<NavItem, "children">[]
}

export type NavSection = {
  /** Names what the group is for, not what the pages are called. */
  label: string
  items: NavItem[]
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto rounded-full border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {children}
    </span>
  )
}

/**
 * Two groups, not one flat list: the pages a partner works through, and the
 * pages they look things up in. A partner arriving mid-deal should be able to
 * tell at a glance which half they need.
 */
export function NavMain({ sections }: { sections: NavSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.active}
                    render={<Link href={item.url} />}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    {item.badge ? <Badge>{item.badge}</Badge> : null}
                  </SidebarMenuButton>

                  {item.children?.length ? (
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            isActive={child.active}
                            render={<Link href={child.url} />}
                          >
                            {child.icon}
                            <span>{child.title}</span>
                            {child.badge ? <Badge>{child.badge}</Badge> : null}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
