"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getHouseholdIdForUser } from "@/lib/household"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const expenseCreateSchema = z.object({
  amount: z.coerce.number().nonnegative(),
  categoryId: z.string().uuid(),
  description: z.string().optional().nullable(),
  date: z.string().min(1),
  paidByUserId: z.string().uuid(),
})

const expenseUpdateSchema = expenseCreateSchema.extend({
  id: z.string().uuid(),
})

const categorySchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().min(1).max(40),
  color: z.string().min(1).max(32),
  monthlyBudget: z.coerce.number().nonnegative(),
})

const categoryUpdateSchema = categorySchema.extend({
  id: z.string().uuid(),
})

async function requireHousehold() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { supabase, user: null, householdId: null as string | null }
  }
  const householdId = await getHouseholdIdForUser(user.id)
  return { supabase, user, householdId }
}

export type ActionResult = { error?: string }

export async function createExpense(input: unknown): Promise<ActionResult> {
  const ctx = await requireHousehold()
  if (!ctx.user || !ctx.householdId) {
    return { error: "Not signed in or no household." }
  }

  const parsed = expenseCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(", ") }
  }

  const { error } = await ctx.supabase.from("expenses").insert({
    household_id: ctx.householdId,
    category_id: parsed.data.categoryId,
    paid_by_user_id: parsed.data.paidByUserId,
    amount: String(parsed.data.amount),
    description: parsed.data.description ?? null,
    date: parsed.data.date,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/budget")
  return {}
}

export async function updateExpense(input: unknown): Promise<ActionResult> {
  const ctx = await requireHousehold()
  if (!ctx.user || !ctx.householdId) {
    return { error: "Not signed in or no household." }
  }

  const parsed = expenseUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(", ") }
  }

  const { error } = await ctx.supabase
    .from("expenses")
    .update({
      category_id: parsed.data.categoryId,
      paid_by_user_id: parsed.data.paidByUserId,
      amount: String(parsed.data.amount),
      description: parsed.data.description ?? null,
      date: parsed.data.date,
    })
    .eq("id", parsed.data.id)
    .eq("household_id", ctx.householdId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/budget")
  return {}
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  const ctx = await requireHousehold()
  if (!ctx.user || !ctx.householdId) {
    return { error: "Not signed in or no household." }
  }

  const id = z.string().uuid().safeParse(expenseId)
  if (!id.success) {
    return { error: "Invalid expense id." }
  }

  const { error } = await ctx.supabase
    .from("expenses")
    .delete()
    .eq("id", id.data)
    .eq("household_id", ctx.householdId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/budget")
  return {}
}

export async function createCategory(input: unknown): Promise<ActionResult> {
  const ctx = await requireHousehold()
  if (!ctx.user || !ctx.householdId) {
    return { error: "Not signed in or no household." }
  }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(", ") }
  }

  const { error } = await ctx.supabase.from("categories").insert({
    household_id: ctx.householdId,
    name: parsed.data.name.trim(),
    icon: parsed.data.icon,
    color: parsed.data.color,
    monthly_budget: String(parsed.data.monthlyBudget),
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/budget")
  return {}
}

export async function updateCategory(input: unknown): Promise<ActionResult> {
  const ctx = await requireHousehold()
  if (!ctx.user || !ctx.householdId) {
    return { error: "Not signed in or no household." }
  }

  const parsed = categoryUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(", ") }
  }

  const { error } = await ctx.supabase
    .from("categories")
    .update({
      name: parsed.data.name.trim(),
      icon: parsed.data.icon,
      color: parsed.data.color,
      monthly_budget: String(parsed.data.monthlyBudget),
    })
    .eq("id", parsed.data.id)
    .eq("household_id", ctx.householdId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/budget")
  return {}
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const ctx = await requireHousehold()
  if (!ctx.user || !ctx.householdId) {
    return { error: "Not signed in or no household." }
  }

  const id = z.string().uuid().safeParse(categoryId)
  if (!id.success) {
    return { error: "Invalid category id." }
  }

  const { error } = await ctx.supabase
    .from("categories")
    .delete()
    .eq("id", id.data)
    .eq("household_id", ctx.householdId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/budget")
  return {}
}
