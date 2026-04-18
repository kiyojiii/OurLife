export type CategoryRow = {
  id: string
  household_id: string
  name: string
  icon: string
  color: string
  monthly_budget: string
  created_at: string
}

export type ExpenseRow = {
  id: string
  household_id: string
  category_id: string
  paid_by_user_id: string
  amount: string
  description: string | null
  date: string
  created_at: string
}

export type MemberRow = {
  user_id: string
  display_name: string | null
  email?: string | null
}

export type MonthlySpend = {
  key: string
  label: string
  total: number
}

export type CategoryOverview = {
  categoryId: string
  name: string
  color: string
  budget: number
  spent: number
}
