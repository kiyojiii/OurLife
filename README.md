OurLife is a personal tracker web app for couples (budget, hobbies, daily journal).

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth + Postgres
- Dark mode via `next-themes`

## Prerequisites

- Node.js LTS
- npm
- A Supabase project

## Setup

Create `.env.local` in the repo root:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_PUBLISHABLE_KEY"
```

In Supabase Dashboard:

- Authentication → URL Configuration
  - Site URL: `http://localhost:3000`
  - Redirect URLs: add `http://localhost:3000/auth/callback`

## Run locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Routes (Phase 1)

- `/login`, `/signup`
- Protected: `/dashboard`, `/budget`, `/hobbies`, `/journal`

## Notes

- This repo intentionally ignores `.env.local` (see `.gitignore`).
- For local dev on a different port (e.g. `3001`), add that port to Supabase Redirect URLs too.

