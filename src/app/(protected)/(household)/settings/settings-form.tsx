"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { updateMyDisplayName } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  initialDisplayName: string
  email: string | null
}

export function DisplayNameForm({ initialDisplayName, email }: Props) {
  const [value, setValue] = useState(initialDisplayName)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateMyDisplayName(formData)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Display name saved")
    })
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="displayName" className="text-sm font-medium">
          Display name
        </label>
        <Input
          id="displayName"
          name="displayName"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What should your partner see you as?"
          maxLength={60}
        />
        <p className="text-xs text-muted-foreground">
          Shown in greetings, expense lists, and the budget split.
          {email ? (
            <>
              {" "}You're signed in as <span className="font-medium">{email}</span>.
            </>
          ) : null}
        </p>
      </div>
      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  )
}
