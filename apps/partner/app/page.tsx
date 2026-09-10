import { redirect } from "next/navigation"

export default function RootPage() {
  if (
    process.env.NEXT_PUBLIC_PREVIEW_AUTH_BYPASS === "true" &&
    process.env.NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE
  ) {
    redirect(`/w/${process.env.NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE}/home`)
  }

  redirect("/login")
}
