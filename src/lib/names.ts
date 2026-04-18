export function firstNameFromEmail(
  email: string | null | undefined
): string | null {
  if (!email) {
    return null
  }
  const local = email.split("@")[0] ?? ""
  const cleaned = local.replace(/[._-]+/g, " ").trim()
  if (!cleaned) {
    return null
  }
  const first = cleaned.split(" ")[0] ?? ""
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

export function resolveDisplayName(
  displayName: string | null | undefined,
  email: string | null | undefined,
  fallback = "Member"
): string {
  if (displayName && displayName.trim()) {
    return displayName.trim()
  }
  return firstNameFromEmail(email) ?? fallback
}
