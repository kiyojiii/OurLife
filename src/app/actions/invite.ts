"use server"

import { getHouseholdContext } from "@/lib/household"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function generateHouseholdInviteCode(): Promise<
  { code: string } | { error: string }
> {
  const ctx = await getHouseholdContext()
  if (!ctx.user || !ctx.householdId) {
    return { error: "Not signed in or no household." }
  }
  if (ctx.role !== "admin") {
    return { error: "Only household admins can create invite codes." }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("generate_household_invite", {
    p_household_id: ctx.householdId,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: "Could not generate invite code." }
  }

  return { code: data }
}
