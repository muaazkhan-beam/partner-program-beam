"use client"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    active: boolean
    badge?: string
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.active}
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
