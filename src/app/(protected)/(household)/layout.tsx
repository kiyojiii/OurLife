import { redirect } from "next/navigation"

import { getHouseholdIdForUser } from "@/lib/household"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function HouseholdLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const householdId = await getHouseholdIdForUser(user.id)

  if (!householdId) {
    redirect("/onboarding")
  }

  return children
}
