import Link from "next/link"
import { Menu } from "lucide-react"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Button, buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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
          <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
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
          {email ? (
            <Sheet>
              <SheetTrigger
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon",
                  className: "md:hidden",
                })}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>OurLife</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 grid gap-2 text-sm">
                  <Link className="py-2" href="/dashboard">
                    Dashboard
                  </Link>
                  <Link className="py-2" href="/budget">
                    Budget
                  </Link>
                  <Link className="py-2" href="/hobbies">
                    Hobbies
                  </Link>
                  <Link className="py-2" href="/journal">
                    Journal
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          ) : null}
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

