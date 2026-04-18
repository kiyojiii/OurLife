import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getHouseholdContext } from "@/lib/household"
import { firstNameFromEmail } from "@/lib/names"

import { DisplayNameForm } from "./settings-form"

export const metadata = {
  title: "Settings · OurLife",
}

export default async function SettingsPage() {
  const ctx = await getHouseholdContext()

  const initial =
    ctx.displayName ?? firstNameFromEmail(ctx.user?.email) ?? ""

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Personalize how you appear in your shared space.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            How your name shows up across OurLife.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DisplayNameForm
            initialDisplayName={initial}
            email={ctx.user?.email ?? null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
