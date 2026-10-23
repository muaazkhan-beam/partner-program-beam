import { LoginScreen } from "@/components/login-screen"

export const metadata = { title: "Cisco sign in" }

export default function CiscoLoginPage() {
  return <LoginScreen returnTo="/w/cisco/home" workspaceSlug="cisco" />
}
