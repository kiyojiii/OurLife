import Link from "next/link"
import { Menu, Settings } from "lucide-react"

import { getHouseholdContext } from "@/lib/household"
import { firstNameFromEmail } from "@/lib/names"
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
  const ctx = await getHouseholdContext()

  const email = ctx.user?.email ?? null
  const householdId = ctx.householdId
  const showAppNav = Boolean(email && householdId)
  const displayName =
    ctx.displayName?.trim() || firstNameFromEmail(email) || email

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link
          href={showAppNav ? "/dashboard" : email ? "/onboarding" : "/"}
          className="font-semibold"
        >
          OurLife
        </Link>

        {showAppNav ? (
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
        {email && !householdId ? (
          <Link
            href="/onboarding"
            className="hidden text-sm font-medium text-primary underline-offset-4 hover:underline md:inline"
          >
            Finish setup
          </Link>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {showAppNav ? (
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
                  <Link className="py-2" href="/settings">
                    Settings
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          ) : null}
          {email && !householdId ? (
            <Link
              href="/onboarding"
              className={`${buttonVariants({ variant: "outline", size: "sm" })} md:hidden`}
            >
              Setup
            </Link>
          ) : null}
          <ThemeToggle />
          {email ? (
            <>
              {showAppNav ? (
                <Link
                  href="/settings"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                    className: "hidden md:inline-flex",
                  })}
                  aria-label="Settings"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              ) : null}
              <span
                className="hidden max-w-[180px] truncate text-sm text-muted-foreground sm:inline"
                title={email}
              >
                {displayName}
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
