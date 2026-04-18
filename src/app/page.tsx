import Link from "next/link"
import { redirect } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth
    .getUser()
    .catch(() => ({ data: { user: null } }))

  if (data.user) {
    redirect("/dashboard")
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">OurLife</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            A shared home for budgets, hobbies, and journaling.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for two people who want to stay aligned on money, goals, and
            the day-to-day.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Create account
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Login
            </Link>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Phase 1</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Supabase email/password auth</li>
            <li>Protected pages & dashboard shell</li>
            <li>Dark mode + toasts + shadcn UI</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Next up: database schema + real trackers.
          </p>
        </div>
      </div>
    </div>
  )
}
