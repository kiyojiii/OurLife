"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { createHouseholdAction, joinHouseholdAction } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CreateHouseholdForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a household</CardTitle>
        <CardDescription>
          You&apos;ll be the admin and can invite your partner with a code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              const res = await createHouseholdAction(fd)
              if (res?.error) {
                toast.error(res.error)
                return
              }
              router.push("/dashboard")
              router.refresh()
            })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Household name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Our place"
              required
              autoComplete="organization"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create household"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function JoinHouseholdForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join with invite code</CardTitle>
        <CardDescription>
          Enter the 8-character code your partner generated (valid for 7
          days, one use).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              const res = await joinHouseholdAction(fd)
              if (res?.error) {
                toast.error(res.error)
                return
              }
              router.push("/dashboard")
              router.refresh()
            })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="code">Invite code</Label>
            <Input
              id="code"
              name="code"
              placeholder="ABCD1234"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending ? "Joining…" : "Join household"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
