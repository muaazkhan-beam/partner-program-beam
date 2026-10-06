import { LoginScreen } from "@/components/login-screen"

export const metadata = { title: "NetApp sign in" }

export default function NetAppLoginPage() {
  return <LoginScreen returnTo="/w/netapp/home" workspaceSlug="netapp" />
}
