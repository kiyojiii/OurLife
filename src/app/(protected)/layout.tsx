import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth
    .getUser()
    .catch(() => ({ data: { user: null } }))

  if (!data.user) {
    redirect("/login")
  }

  return children
}

