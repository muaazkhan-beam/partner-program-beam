import { LoginScreen } from "@/components/login-screen"

export const metadata = { title: "Roland Berger sign in" }

export default function RolandBergerLoginPage() {
  return (
    <LoginScreen
      returnTo="/w/roland-berger/home"
      workspaceSlug="roland-berger"
    />
  )
}
