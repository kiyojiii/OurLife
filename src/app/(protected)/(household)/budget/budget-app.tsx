"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  CategoryOverview,
  CategoryRow,
  ExpenseRow,
  MemberRow,
  MonthlySpend,
} from "@/types/budget"

import { BudgetCategoriesTab } from "./budget-categories-tab"
import { BudgetExpensesTab } from "./budget-expenses-tab"
import { BudgetOverviewTab } from "./budget-overview-tab"

export type BudgetAppProps = {
  householdName: string
  userId: string
  partnerUserId: string | null
  role: "admin" | "member"
  categories: CategoryRow[]
  expenses: ExpenseRow[]
  members: MemberRow[]
  monthlyTotals: MonthlySpend[]
  categoryOverview: CategoryOverview[]
  spentThisMonth: number
  split: { you: number; partner: number }
}

export function BudgetApp(props: BudgetAppProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
        <p className="mt-1 text-muted-foreground">{props.householdName}</p>
      </div>

      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories &amp; budgets</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <BudgetExpensesTab
            categories={props.categories}
            expenses={props.expenses}
            members={props.members}
            userId={props.userId}
            partnerUserId={props.partnerUserId}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <BudgetCategoriesTab categories={props.categories} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <BudgetOverviewTab
            categoryOverview={props.categoryOverview}
            monthlyTotals={props.monthlyTotals}
            spentThisMonth={props.spentThisMonth}
            split={props.split}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
