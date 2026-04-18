import { redirect } from "next/navigation"

import { CreateHouseholdForm, JoinHouseholdForm } from "./onboarding-forms"
import { getHouseholdIdForUser } from "@/lib/household"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const existing = await getHouseholdIdForUser(user.id)
  if (existing) {
    redirect("/dashboard")
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Set up your household
        </h1>
        <p className="mt-2 text-muted-foreground">
          Share one budget with your partner. Create a new household or join
          with an invite code from them (only one household per account).
        </p>
      </div>

      <CreateHouseholdForm />
      <JoinHouseholdForm />
    </div>
  )
}
