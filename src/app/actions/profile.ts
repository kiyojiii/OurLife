"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ProfileActionResult = { error?: string; ok?: boolean }

export async function updateMyDisplayName(
  formData: FormData
): Promise<ProfileActionResult> {
  const raw = String(formData.get("displayName") ?? "").trim()

  if (raw.length > 60) {
    return { error: "Display name must be 60 characters or fewer." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not signed in." }
  }

  const { error } = await supabase.rpc("update_my_display_name", {
    p_display_name: raw,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/budget")
  revalidatePath("/settings")
  return { ok: true }
}
