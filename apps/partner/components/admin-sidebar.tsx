"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import {
  RiAddLine,
  RiBuildingLine,
  RiFileTextLine,
  RiHome5Line,
  RiLogoutBoxLine,
  RiSendPlaneLine,
  RiUserAddLine,
} from "@remixicon/react";

import { api } from "@partner/convex/_generated/api";
import { BeamLogo } from "@/components/beam-logo";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const spaceNavigation = [
  { title: "Overview", segment: "", icon: RiHome5Line },
  { title: "People & access", segment: "invitees", icon: RiUserAddLine },
  { title: "Content", segment: "content", icon: RiFileTextLine },
  { title: "Requests", segment: "requests", icon: RiSendPlaneLine },
];

export function AdminSidebar({
  email,
  ...props
}: React.ComponentProps<typeof Sidebar> & { email: string }) {
  const pathname = usePathname();
  const workspaces = useQuery(api.partner.listWorkspacesForStaff, {});
  const segments = pathname.split("/").filter(Boolean);
  const workspaceSlug =
    segments[0] === "admin" &&
    segments[1] === "partners" &&
    segments[2] &&
    segments[2] !== "new"
      ? decodeURIComponent(segments[2])
      : null;
  const activeWorkspace = workspaces?.find(
    (workspace) => workspace.slug === workspaceSlug,
  );

  async function signOut() {
    await authClient.signOut();
    window.location.replace("/admin");
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:px-2"
              render={<Link href="/admin/partners" />}
            >
              <BeamLogo className="size-8 rounded-lg" />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">Beam Partner</span>
                <span className="truncate text-xs text-muted-foreground">
                  Staff admin
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Partner spaces"
                  isActive={pathname === "/admin/partners"}
                  render={<Link href="/admin/partners" />}
                >
                  <RiBuildingLine />
                  <span>Partner spaces</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="New partner space"
                  isActive={pathname === "/admin/partners/new"}
                  render={<Link href="/admin/partners/new" />}
                >
                  <RiAddLine />
                  <span>New partner space</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {workspaceSlug ? (
          <SidebarGroup>
            <SidebarGroupLabel>
              {activeWorkspace?.displayName ?? workspaceSlug}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {spaceNavigation.map((item) => {
                  const href = `/admin/partners/${workspaceSlug}${item.segment ? `/${item.segment}` : ""}`;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === href}
                        render={<Link href={href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{email}</p>
            <p className="truncate text-xs text-muted-foreground">Beam staff</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={signOut}
            aria-label="Sign out"
          >
            <RiLogoutBoxLine />
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
