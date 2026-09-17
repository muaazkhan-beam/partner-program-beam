"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { usePathname } from "next/navigation";

import { api } from "@partner/convex/_generated/api";
import { AccessDenied } from "@/components/access-denied";
import { AdminSidebar } from "@/components/admin-sidebar";
import { LoginScreen } from "@/components/login-screen";
import { authBypass, convexReady } from "@/components/providers";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (authBypass) {
    return <AccessDenied />;
  }
  if (!convexReady) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Authentication is not configured.
        </p>
      </main>
    );
  }
  return <StaffAdminInner>{children}</StaffAdminInner>;
}

function StaffAdminInner({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.auth.getCurrentUser, {});
  const ensureStaffSession = useMutation(api.partner.ensureStaffSession);
  const [initialized, setInitialized] = useState(false);
  const [initializationFailed, setInitializationFailed] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    void ensureStaffSession({ name: user.name, now: Date.now() }).then(
      () => setInitialized(true),
      () => setInitializationFailed(true),
    );
  }, [ensureStaffSession, user?.email, user?.name]);

  if (user === undefined) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Verifying staff access…</p>
      </main>
    );
  }
  if (user === null) {
    return <LoginScreen returnTo="/admin" staffOnly />;
  }
  if (!user?.email || initializationFailed) {
    return <AccessDenied email={user?.email} />;
  }
  if (!initialized) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Verifying staff access…</p>
      </main>
    );
  }
  return <AdminChrome email={user.email}>{children}</AdminChrome>;
}

function AdminChrome({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const section = pathname.split("/").filter(Boolean).at(-1);
  const title =
    section === "admin" || section === "partners"
      ? "Partner spaces"
      : section === "new"
        ? "New partner space"
        : section === "invitees"
          ? "People & access"
          : section === "content"
            ? "Content"
            : section === "requests"
              ? "Requests"
              : "Partner overview";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
    >
      <AdminSidebar variant="inset" email={email} />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center border-b bg-background/90 backdrop-blur-xl">
          <div className="flex w-full items-center gap-2 px-4 sm:px-5 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-1 h-4 data-vertical:self-auto"
            />
            <h1 className="text-sm font-medium sm:text-base">{title}</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col p-4 sm:p-5 lg:p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
