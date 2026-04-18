"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as Icons from "lucide-react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  createCategory,
  deleteCategory,
  updateCategory,
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
import { formatCurrency } from "@/lib/format"
import type { CategoryRow } from "@/types/budget"

const ICON_OPTIONS = [
  "ShoppingCart",
  "Home",
  "Zap",
  "UtensilsCrossed",
  "Car",
  "Ticket",
  "Heart",
  "Plane",
  "Coffee",
  "Dumbbell",
  "Baby",
  "Dog",
  "Shield",
  "Wifi",
  "Smartphone",
  "Circle",
] as const

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  icon: z.string().min(1),
  color: z.string().min(1),
  monthlyBudget: z.number().nonnegative(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

type Props = {
  categories: CategoryRow[]
}

function CategoryGlyph({ name }: { name: string }) {
  const map = Icons as unknown as Record<string, typeof Icons.Circle>
  const Icon = map[name] ?? Icons.Circle
  return <Icon className="h-4 w-4" aria-hidden />
}

export function BudgetCategoriesTab({ categories }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      icon: "Circle",
      color: "#64748b",
      monthlyBudget: 0,
    },
  })

  function openCreate() {
    setEditing(null)
    form.reset({
      name: "",
      icon: "Circle",
      color: "#6366f1",
      monthlyBudget: 0,
    })
    setOpen(true)
  }

  function openEdit(row: CategoryRow) {
    setEditing(row)
    form.reset({
      name: row.name,
      icon: row.icon,
      color: row.color,
      monthlyBudget: Number.parseFloat(row.monthly_budget || "0"),
    })
    setOpen(true)
  }

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      const base = {
        name: values.name,
        icon: values.icon,
        color: values.color,
        monthlyBudget: values.monthlyBudget,
      }
      const res = editing
        ? await updateCategory({ ...base, id: editing.id })
        : await createCategory(base)

      if (res.error) {
        toast.error(res.error)
        return
      }

      toast.success(editing ? "Category updated" : "Category added")
      setOpen(false)
    })
  }

  function confirmDelete() {
    if (!deleteId) {
      return
    }
    startTransition(async () => {
      const res = await deleteCategory(deleteId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Category deleted")
      setDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No categories yet. Default categories are created when your household
          is set up — or add your own.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4"
            >
              <div className="flex gap-3">
                <span style={{ color: c.color }} className="mt-0.5">
                  <CategoryGlyph name={c.icon} />
                </span>
                <div>
                  <p className="font-medium leading-none">{c.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Monthly budget {formatCurrency(Number.parseFloat(c.monthly_budget || "0"))}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(c)}
                  aria-label="Edit category"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(c.id)}
                  aria-label="Delete category"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit category" : "Add category"}
            </DialogTitle>
            <DialogDescription>
              Icons are Lucide names; pick a color for charts and lists.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) => onSubmit(v))}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <div className="grid grid-cols-8 gap-1.5">
                {ICON_OPTIONS.map((iconName) => {
                  const selected = form.watch("icon") === iconName
                  const map = Icons as unknown as Record<string, typeof Icons.Circle>
                  const Icon = map[iconName]
                  if (!Icon) {
                    return null
                  }
                  return (
                    <button
                      key={iconName}
                      type="button"
                      title={iconName}
                      onClick={() => form.setValue("icon", iconName)}
                      className={`flex h-9 items-center justify-center rounded-md border text-muted-foreground transition-colors ${
                        selected
                          ? "border-primary bg-muted text-foreground"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium">Color</label>
                <Input type="color" className="h-10 p-1" {...form.register("color")} />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium">Monthly budget</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("monthlyBudget", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              You cannot delete a category that still has expenses. Remove or
              re-categorize those expenses first.
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
