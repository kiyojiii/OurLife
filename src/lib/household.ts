import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getHouseholdIdForUser(userId: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .maybeSingle()

  return data?.household_id ?? null
}

export async function getHouseholdContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      householdId: null,
      role: null,
      partnerUserId: null,
      displayName: null as string | null,
      partnerDisplayName: null as string | null,
    }
  }

  let membershipHouseholdId: string | null = null
  let membershipRole: "admin" | "member" | null = null
  let myDisplayName: string | null = null

  // Try the richer query first (with display_name). If the column doesn't
  // exist yet (migration not applied), fall back to the minimal query so the
  // user is never wrongly kicked back to onboarding.
  const fullMembership = await supabase
    .from("household_members")
    .select("household_id, role, display_name")
    .eq("user_id", user.id)
    .maybeSingle()

  if (fullMembership.error) {
    const fallback = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .maybeSingle()

    if (fallback.data) {
      membershipHouseholdId = fallback.data.household_id
      membershipRole = fallback.data.role as "admin" | "member"
    }
  } else if (fullMembership.data) {
    membershipHouseholdId = fullMembership.data.household_id
    membershipRole = fullMembership.data.role as "admin" | "member"
    myDisplayName = fullMembership.data.display_name ?? null
  }

  if (!membershipHouseholdId) {
    return {
      user,
      householdId: null as string | null,
      role: null as "admin" | "member" | null,
      partnerUserId: null as string | null,
      displayName: null as string | null,
      partnerDisplayName: null as string | null,
    }
  }

  let partnerUserId: string | null = null
  let partnerDisplayName: string | null = null

  const fullMembers = await supabase
    .from("household_members")
    .select("user_id, display_name")
    .eq("household_id", membershipHouseholdId)

  if (fullMembers.error) {
    const fallback = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", membershipHouseholdId)
    const partner = fallback.data?.find((m) => m.user_id !== user.id) ?? null
    partnerUserId = partner?.user_id ?? null
  } else {
    const partner =
      fullMembers.data?.find((m) => m.user_id !== user.id) ?? null
    partnerUserId = partner?.user_id ?? null
    partnerDisplayName = partner?.display_name ?? null
  }

  return {
    user,
    householdId: membershipHouseholdId,
    role: membershipRole ?? "member",
    partnerUserId,
    displayName: myDisplayName,
    partnerDisplayName,
  }
}
