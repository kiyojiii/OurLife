import Link from "next/link"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back{user?.email ? `, ${user.email}` : ""}.
      </h1>
      <p className="mt-2 text-muted-foreground">
        This is your shared space for budgets, hobbies, and journaling.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/budget" className="block">
          <Card className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle>Budget</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
        <Link href="/hobbies" className="block">
          <Card className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle>Hobbies</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
        <Link href="/journal" className="block">
          <Card className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle>Journal</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
      </div>
    </div>
  )
}

