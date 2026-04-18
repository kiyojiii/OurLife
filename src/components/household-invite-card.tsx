"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { generateHouseholdInviteCode } from "@/app/actions/invite"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function HouseholdInviteCard() {
  const [code, setCode] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onGenerate() {
    startTransition(async () => {
      const res = await generateHouseholdInviteCode()
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      setCode(res.code)
      toast.success("Invite code created")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invite your partner</CardTitle>
        <CardDescription>
          Generate a one-time code (valid 7 days). Your partner enters it on
          onboarding to join this household.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={onGenerate} disabled={isPending} type="button">
          {isPending ? "Generating…" : "Generate invite code"}
        </Button>
        {code ? (
          <code className="rounded-md bg-muted px-3 py-2 text-lg font-semibold tracking-widest">
            {code}
          </code>
        ) : (
          <p className="text-sm text-muted-foreground">
            Codes are single-use and expire after 7 days.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
