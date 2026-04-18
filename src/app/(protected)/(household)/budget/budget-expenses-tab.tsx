"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns"
import * as Icons from "lucide-react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/app/actions/budget"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import type { CategoryRow, ExpenseRow, MemberRow } from "@/types/budget"

type Props = {
  categories: CategoryRow[]
  expenses: ExpenseRow[]
  members: MemberRow[]
  userId: string
  partnerUserId: string | null
}

function parseAmountString(value: string) {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function CategoryGlyph({ name }: { name: string }) {
  const map = Icons as unknown as Record<string, typeof Icons.Circle>
  const Icon = map[name] ?? Icons.Circle
  return <Icon className="h-4 w-4" aria-hidden />
}

const expenseSchema = z.object({
  amount: z.number().nonnegative(),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  date: z.string().min(1),
  paidByUserId: z.string().uuid(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

const monthOptions = Array.from({ length: 24 }).map((_, i) => {
  const d = subMonths(startOfMonth(new Date()), i)
  return {
    value: format(d, "yyyy-MM"),
    label: format(d, "MMMM yyyy"),
  }
})

export function BudgetExpensesTab({
  categories,
  expenses,
  members,
  userId,
  partnerUserId,
}: Props) {
  const [monthFilter, setMonthFilter] = useState(monthOptions[0]?.value ?? "")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [paidByFilter, setPaidByFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  )

  const categoryFilterItems = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories]
  )

  const categoryFormItems = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  )

  const paidByFilterItems = useMemo(
    () => [
      { value: "all", label: "Everyone" },
      ...members.map((m) => ({
        value: m.user_id,
        label: labelForPayer(m.user_id),
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, userId, partnerUserId]
  )

  const paidByFormItems = useMemo(
    () =>
      members.map((m) => ({
        value: m.user_id,
        label: labelForPayer(m.user_id),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, userId, partnerUserId]
  )

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const d = parseISO(e.date)
      const [y, m] = monthFilter.split("-").map(Number)
      const start = new Date(y, m - 1, 1)
      const end = endOfMonth(start)
      if (d < start || d > end) {
        return false
      }
      if (categoryFilter !== "all" && e.category_id !== categoryFilter) {
        return false
      }
      if (paidByFilter !== "all" && e.paid_by_user_id !== paidByFilter) {
        return false
      }
      return true
    })
  }, [expenses, monthFilter, categoryFilter, paidByFilter])

  const monthTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + parseAmountString(e.amount), 0),
    [filtered]
  )

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.user_id, m])),
    [members]
  )

  function labelForPayer(payerId: string) {
    if (payerId === userId) {
      return "You"
    }
    const m = memberMap.get(payerId)
    if (m?.display_name && m.display_name.trim()) {
      return m.display_name.trim()
    }
    if (partnerUserId && payerId === partnerUserId) {
      return "Partner"
    }
    return "Member"
  }

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      categoryId: categories[0]?.id ?? "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      paidByUserId: userId,
    },
  })

  function openCreate() {
    setEditing(null)
    form.reset({
      amount: 0,
      categoryId: categories[0]?.id ?? "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      paidByUserId: userId,
    })
    setDialogOpen(true)
  }

  function openEdit(row: ExpenseRow) {
    setEditing(row)
    form.reset({
      amount: parseAmountString(row.amount),
      categoryId: row.category_id,
      description: row.description ?? "",
      date: row.date,
      paidByUserId: row.paid_by_user_id,
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: ExpenseFormValues) {
    startTransition(async () => {
      const payload = {
        amount: values.amount,
        categoryId: values.categoryId,
        description: values.description || null,
        date: values.date,
        paidByUserId: values.paidByUserId,
        ...(editing ? { id: editing.id } : {}),
      }

      const res = editing
        ? await updateExpense(payload)
        : await createExpense(payload)

      if (res.error) {
        toast.error(res.error)
        return
      }

      toast.success(editing ? "Expense updated" : "Expense added")
      setDialogOpen(false)
    })
  }

  async function confirmDelete() {
    if (!deleteId) {
      return
    }
    startTransition(async () => {
      const res = await deleteExpense(deleteId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Expense deleted")
      setDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Month total (filtered)</p>
            <p className="text-2xl font-semibold tracking-tight">
              {formatCurrency(monthTotal)}
            </p>
          </div>
          <Button onClick={openCreate} size="sm" disabled={categories.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add expense
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Month
            </label>
            <Select
              value={monthFilter}
              onValueChange={(v) => {
                if (v) {
                  setMonthFilter(v)
                }
              }}
              items={monthOptions}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                if (v) {
                  setCategoryFilter(v)
                }
              }}
              items={categoryFilterItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilterItems.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Paid by
            </label>
            <Select
              value={paidByFilter}
              onValueChange={(v) => {
                if (v) {
                  setPaidByFilter(v)
                }
              }}
              items={paidByFilterItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Paid by" />
              </SelectTrigger>
              <SelectContent>
                {paidByFilterItems.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add categories first in the Categories tab.
        </p>
      ) : null}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Paid by</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[1%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No expenses match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const cat = categoryMap.get(row.category_id)
                return (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(row.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat?.color }}>
                          {cat ? <CategoryGlyph name={cat.icon} /> : null}
                        </span>
                        <span>{cat?.name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(parseAmountString(row.amount))}
                    </TableCell>
                    <TableCell>{labelForPayer(row.paid_by_user_id)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {row.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row)}
                          aria-label="Edit expense"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(row.id)}
                          aria-label="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit expense" : "Add expense"}
            </DialogTitle>
            <DialogDescription>
              Record spending for your household. Amounts are shared between you
              and your partner.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit((vals) => onSubmit(vals))}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={form.watch("categoryId")}
                onValueChange={(v) => {
                  if (v) {
                    form.setValue("categoryId", v)
                  }
                }}
                items={categoryFormItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryFormItems.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" {...form.register("date")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Paid by</label>
              <Select
                value={form.watch("paidByUserId")}
                onValueChange={(v) => {
                  if (v) {
                    form.setValue("paidByUserId", v)
                  }
                }}
                items={paidByFormItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Paid by" />
                </SelectTrigger>
                <SelectContent>
                  {paidByFormItems.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input {...form.register("description")} placeholder="Optional" />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? (
                  "Save"
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
