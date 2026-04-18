"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function createHouseholdAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) {
    return { error: "Please enter a household name." }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc("create_household", {
    p_name: name,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
}

export async function joinHouseholdAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const code = String(formData.get("code") ?? "").trim()
  if (!code) {
    return { error: "Please enter an invite code." }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc("accept_household_invite", {
    p_code: code,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
}
