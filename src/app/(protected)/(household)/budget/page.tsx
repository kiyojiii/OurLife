import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns"
import { redirect } from "next/navigation"

import { getHouseholdContext } from "@/lib/household"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
  CategoryOverview,
  CategoryRow,
  ExpenseRow,
  MemberRow,
  MonthlySpend,
} from "@/types/budget"

import { BudgetApp } from "./budget-app"

function parseAmount(value: string) {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

export default async function BudgetPage() {
  const ctx = await getHouseholdContext()
  if (!ctx.user?.id || !ctx.householdId) {
    redirect("/onboarding")
  }

  const supabase = await createSupabaseServerClient()

  const [
    { data: categories, error: catErr },
    { data: expenses, error: expErr },
    { data: members },
    { data: household },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", ctx.householdId)
      .order("name"),
    supabase
      .from("expenses")
      .select("*")
      .eq("household_id", ctx.householdId)
      .order("date", { ascending: false })
      .limit(5000),
    supabase
      .from("household_members")
      .select("user_id, display_name")
      .eq("household_id", ctx.householdId),
    supabase.from("households").select("name").eq("id", ctx.householdId).maybeSingle(),
  ])

  if (catErr || expErr) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-destructive">
        {catErr?.message ?? expErr?.message ?? "Could not load budget data."}
      </div>
    )
  }

  const categoryRows = (categories ?? []) as CategoryRow[]
  const expenseRows = (expenses ?? []) as ExpenseRow[]
  const memberRows = (members ?? []) as MemberRow[]

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const rangeStart = subMonths(monthStart, 5)
  const monthKeys = eachMonthOfInterval({
    start: rangeStart,
    end: monthStart,
  }).map((d) => format(d, "yyyy-MM"))

  const monthlyTotals: MonthlySpend[] = monthKeys.map((key) => {
    const [y, m] = key.split("-").map(Number)
    const start = new Date(y, m - 1, 1)
    const end = endOfMonth(start)
    const total = expenseRows.reduce((sum, e) => {
      const d = parseISO(e.date)
      if (d >= start && d <= end) {
        return sum + parseAmount(e.amount)
      }
      return sum
    }, 0)
    return {
      key,
      label: format(start, "MMM yyyy"),
      total,
    }
  })

  const categoryOverview: CategoryOverview[] = categoryRows.map((c) => {
    const budget = parseAmount(c.monthly_budget)
    const spent = expenseRows.reduce((sum, e) => {
      if (e.category_id !== c.id) {
        return sum
      }
      const d = parseISO(e.date)
      if (d < monthStart || d > monthEnd) {
        return sum
      }
      return sum + parseAmount(e.amount)
    }, 0)

    return {
      categoryId: c.id,
      name: c.name,
      color: c.color,
      budget,
      spent,
    }
  })

  const spentThisMonth = expenseRows.reduce((sum, e) => {
    const d = parseISO(e.date)
    if (d >= monthStart && d <= monthEnd) {
      return sum + parseAmount(e.amount)
    }
    return sum
  }, 0)

  let youSpent = 0
  let partnerSpent = 0
  for (const e of expenseRows) {
    const d = parseISO(e.date)
    if (d < monthStart || d > monthEnd) {
      continue
    }
    const amt = parseAmount(e.amount)
    if (e.paid_by_user_id === ctx.user.id) {
      youSpent += amt
    } else {
      partnerSpent += amt
    }
  }

  return (
    <BudgetApp
      householdName={household?.name ?? "Household"}
      userId={ctx.user.id}
      partnerUserId={ctx.partnerUserId}
      role={ctx.role ?? "member"}
      categories={categoryRows}
      expenses={expenseRows}
      members={memberRows}
      monthlyTotals={monthlyTotals}
      categoryOverview={categoryOverview}
      spentThisMonth={spentThisMonth}
      split={{ you: youSpent, partner: partnerSpent }}
    />
  )
}
