import Link from "next/link"
import {
  ArrowRight,
  BookOpenText,
  Heart,
  PiggyBank,
  Sparkles,
  Wallet,
} from "lucide-react"
import * as Icons from "lucide-react"
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns"

import { HouseholdInviteCard } from "@/components/household-invite-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { getHouseholdContext } from "@/lib/household"
import { firstNameFromEmail } from "@/lib/names"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const PH_TIMEZONE = "Asia/Manila"

function getManilaHour() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIMEZONE,
    hour: "numeric",
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0"
  const hour = Number.parseInt(hourPart, 10)
  return Number.isFinite(hour) ? hour : 0
}

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) {
    return { greeting: "Good morning", emoji: "☀️" }
  }
  if (hour >= 12 && hour < 17) {
    return { greeting: "Good afternoon", emoji: "🌤️" }
  }
  if (hour >= 17 && hour < 21) {
    return { greeting: "Good evening", emoji: "🌙" }
  }
  return { greeting: "Hi", emoji: "✨" }
}

function vibeLineFor(hour: number, hasPartner: boolean) {
  if (hour >= 5 && hour < 12) {
    return hasPartner
      ? "Hope your day starts soft and slow — together."
      : "Hope your day starts soft and slow."
  }
  if (hour >= 12 && hour < 17) {
    return "A little check-in on your shared world."
  }
  if (hour >= 17 && hour < 21) {
    return "Wind down together — here's where you left off."
  }
  return "Late-night thoughts? Drop them in your space."
}

function CategoryGlyph({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const map = Icons as unknown as Record<string, typeof Icons.Circle>
  const Icon = map[name] ?? Icons.Circle
  return <Icon className={className ?? "h-4 w-4"} aria-hidden />
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const ctx = await getHouseholdContext()

  const hour = getManilaHour()
  const { greeting, emoji } = greetingFor(hour)

  const myName =
    ctx.displayName?.trim() ||
    firstNameFromEmail(ctx.user?.email) ||
    null
  const partnerName = ctx.partnerDisplayName?.trim() || null
  const hasPartner = Boolean(ctx.partnerUserId)
  const vibeLine = vibeLineFor(hour, hasPartner)

  const greetingNamePart = (() => {
    if (myName && partnerName) {
      return `, ${myName} & ${partnerName}`
    }
    if (myName) {
      return `, ${myName}`
    }
    return ""
  })()

  let householdName: string | null = null
  let spentThisMonth = 0
  let expensesThisMonthCount = 0
  let recentExpenses: Array<{
    id: string
    amount: number
    date: string
    description: string | null
    paid_by_user_id: string
    category: { name: string; icon: string; color: string } | null
  }> = []

  if (ctx.householdId) {
    const now = new Date()
    const start = format(startOfMonth(now), "yyyy-MM-dd")
    const end = format(endOfMonth(now), "yyyy-MM-dd")

    const [{ data: household }, { data: monthExpenses }, { data: latest }] =
      await Promise.all([
        supabase
          .from("households")
          .select("name")
          .eq("id", ctx.householdId)
          .maybeSingle(),
        supabase
          .from("expenses")
          .select("amount")
          .eq("household_id", ctx.householdId)
          .gte("date", start)
          .lte("date", end),
        supabase
          .from("expenses")
          .select(
            "id, amount, date, description, paid_by_user_id, categories ( name, icon, color )"
          )
          .eq("household_id", ctx.householdId)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5),
      ])

    householdName = household?.name ?? null

    if (monthExpenses) {
      expensesThisMonthCount = monthExpenses.length
      spentThisMonth = monthExpenses.reduce(
        (sum, e) => sum + Number.parseFloat(e.amount ?? "0"),
        0
      )
    }

    if (latest) {
      recentExpenses = latest.map((row) => {
        const cat = Array.isArray(row.categories)
          ? row.categories[0]
          : row.categories
        return {
          id: row.id as string,
          amount: Number.parseFloat((row.amount ?? "0") as string),
          date: row.date as string,
          description: (row.description ?? null) as string | null,
          paid_by_user_id: row.paid_by_user_id as string,
          category: cat
            ? {
                name: (cat.name ?? "—") as string,
                icon: (cat.icon ?? "Circle") as string,
                color: (cat.color ?? "#94a3b8") as string,
              }
            : null,
        }
      })
    }
  }

  function payerLabel(payerId: string) {
    if (payerId === ctx.user?.id) {
      return myName ?? "You"
    }
    if (ctx.partnerUserId && payerId === ctx.partnerUserId) {
      return partnerName ?? "Partner"
    }
    return "Member"
  }

  const monthLabel = format(new Date(), "MMMM yyyy")
  const namePromptNeeded = !ctx.displayName?.trim()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      {/* Greeting hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-amber-50 via-background to-rose-50 p-6 shadow-sm dark:from-amber-950/30 dark:via-background dark:to-rose-950/30 sm:p-10">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-rose-300/30 blur-3xl dark:bg-rose-500/10"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
              {householdName ? householdName : "Your shared space"}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              <span aria-hidden className="mr-2">
                {emoji}
              </span>
              {greeting}
              {greetingNamePart}.
            </h1>
            <p className="max-w-md text-base text-muted-foreground sm:text-lg">
              {vibeLine}
            </p>
            {namePromptNeeded ? (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Set your display name
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : null}
          </div>

          <div className="relative w-full max-w-xs rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur sm:w-auto sm:max-w-none">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Spent in {monthLabel}
            </div>
            <div className="mt-1.5 text-3xl font-semibold tracking-tight">
              {formatCurrency(spentThisMonth)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {expensesThisMonthCount === 0
                ? "No expenses logged yet — add your first."
                : `${expensesThisMonthCount} ${
                    expensesThisMonthCount === 1 ? "entry" : "entries"
                  } so far`}
            </div>
            <Link
              href="/budget"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Open budget
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent expenses */}
      <section className="mt-8">
        <Card className="bg-card/70">
          <CardHeader className="flex flex-row items-end justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg">Recent expenses</CardTitle>
              <CardDescription>The last few entries in your budget.</CardDescription>
            </div>
            <Link
              href="/budget"
              className="text-xs font-medium text-primary hover:underline"
            >
              See all
            </Link>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                Nothing yet. Add an expense to see it appear here.
              </div>
            ) : (
              <ul className="divide-y">
                {recentExpenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        color: e.category?.color ?? "var(--muted-foreground)",
                        backgroundColor: e.category?.color
                          ? `${e.category.color}1a`
                          : undefined,
                      }}
                    >
                      <CategoryGlyph
                        name={e.category?.icon ?? "Circle"}
                        className="h-4 w-4"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {e.description?.trim() || e.category?.name || "Expense"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {format(parseISO(e.date), "MMM d")} · {payerLabel(e.paid_by_user_id)}
                        {e.category?.name && e.description?.trim()
                          ? ` · ${e.category.name}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatCurrency(e.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {ctx.role === "admin" ? (
        <div className="mt-8">
          <HouseholdInviteCard />
        </div>
      ) : null}

      {/* Section cards — warm Fraunces palette */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/budget" className="group block">
          <Card className="h-full border-transparent bg-card/60 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.92_0.05_140)] text-[oklch(0.40_0.07_150)] dark:bg-[oklch(0.30_0.05_150)] dark:text-[oklch(0.85_0.07_140)]">
                <PiggyBank className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3">Budget</CardTitle>
              <CardDescription>Track shared spending</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Expenses, categories, and month-to-month overview.
            </CardContent>
          </Card>
        </Link>
        <Link href="/hobbies" className="group block">
          <Card className="h-full border-transparent bg-card/60 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.92_0.07_40)] text-[oklch(0.45_0.13_35)] dark:bg-[oklch(0.32_0.08_35)] dark:text-[oklch(0.85_0.10_45)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3">Hobbies</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Keep streaks and plan time for what you both enjoy.
            </CardContent>
          </Card>
        </Link>
        <Link href="/journal" className="group block">
          <Card className="h-full border-transparent bg-card/60 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.94_0.06_80)] text-[oklch(0.45_0.10_75)] dark:bg-[oklch(0.32_0.07_75)] dark:text-[oklch(0.88_0.10_85)]">
                <BookOpenText className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3">Journal</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Write daily entries and reflect together.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
