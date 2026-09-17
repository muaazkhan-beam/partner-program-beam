import { LoginScreen } from "@/components/login-screen"

export const metadata = { title: "PwC sign in" }

export default function PwcLoginPage() {
  return <LoginScreen returnTo="/w/pwc-me/home" workspaceSlug="pwc-me" />
}
