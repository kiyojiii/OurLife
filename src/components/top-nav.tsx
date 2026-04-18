import Link from "next/link"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Button, buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export async function TopNav() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  const email = data.user?.email ?? null

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link href={email ? "/dashboard" : "/"} className="font-semibold">
          OurLife
        </Link>

        {email ? (
          <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/budget" className="hover:text-foreground">
              Budget
            </Link>
            <Link href="/hobbies" className="hover:text-foreground">
              Hobbies
            </Link>
            <Link href="/journal" className="hover:text-foreground">
              Journal
            </Link>
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {email ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {email}
              </span>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Login
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

