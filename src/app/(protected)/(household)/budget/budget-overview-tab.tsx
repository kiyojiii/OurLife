"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { CategoryOverview, MonthlySpend } from "@/types/budget"

type Props = {
  categoryOverview: CategoryOverview[]
  monthlyTotals: MonthlySpend[]
  spentThisMonth: number
  split: { you: number; partner: number }
}

export function BudgetOverviewTab({
  categoryOverview,
  monthlyTotals,
  spentThisMonth,
  split,
}: Props) {
  const pieData = categoryOverview
    .filter((c) => c.spent > 0)
    .map((c) => ({
      name: c.name,
      value: c.spent,
      color: c.color,
    }))

  const hasPartner = split.partner > 0 || split.you > 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Spent this month</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatCurrency(spentThisMonth)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Includes all categories for the current calendar month.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Split (who paid)</CardDescription>
            <CardTitle className="text-lg">
              You {formatCurrency(split.you)}
              {hasPartner ? (
                <span className="text-muted-foreground">
                  {" "}
                  / Partner {formatCurrency(split.partner)}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Totals are based on the &quot;paid by&quot; field on expenses this
            month.
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Budget vs spent (this month)</h3>
        <div className="space-y-4">
          {categoryOverview.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            categoryOverview.map((row) => {
              const pct =
                row.budget > 0
                  ? Math.min(100, Math.round((row.spent / row.budget) * 100))
                  : row.spent > 0
                    ? 100
                    : 0
              const barPct = Math.min(
                100,
                row.budget > 0 ? (row.spent / row.budget) * 100 : row.spent > 0 ? 100 : 0
              )
              return (
                <div key={row.categoryId} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(row.spent)} / {formatCurrency(row.budget)}{" "}
                      {row.budget > 0 ? (
                        <span className="text-foreground">({pct}%)</span>
                      ) : (
                        <span className="text-xs">(no budget set)</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">This month by category</CardTitle>
            <CardDescription>Share of spending (categories with spend only)</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing spent yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value ?? 0))
                    }
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Last 6 months</CardTitle>
            <CardDescription>Total spending per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTotals}>
                <CartesianGrid
                  stroke="hsl(var(--border))"
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat(undefined, {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(v as number)
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value ?? 0))
                  }
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="total"
                  radius={[6, 6, 0, 0]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
