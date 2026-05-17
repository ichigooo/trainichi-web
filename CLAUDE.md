# Aretē Web - Project Context

> Marketing site, owner dashboard, and public feedback for the Aretē fitness app
> (app rebrand from "Trainichi" in progress — domain is still trainichi.app).

## Tech Stack
- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Data**: Supabase (shared project `fhihhkkcauotipxqqpii`, same as the app),
  accessed server-side via `lib/supabaseServer.ts` with the service-role key.
  The Express backend in workout-planner is NOT used by this site.
- **Hosting**: Vercel · **Domain**: trainichi.app

## Design system
Cream palette mirroring the app (`workout-planner/mobile/src/theme.ts`):
cream backgrounds, chocolate ink `#2A1C12`, butter-yellow accent `#E8C34A`.
Tailwind tokens under the `cream-*` namespace in `tailwind.config.ts`.
DM Sans for UI/wordmark, Fraunces for marketing display headings only.
Never white text on the yellow accent. Light-only. The "Aretē" macron (ē)
needs the `latin-ext` font subset — and Fraunces mis-positions it, so the
wordmark uses DM Sans.

## Routes
- `/` — minimal one-screen marketing page (`components/marketing/*`: SiteHeader,
  Hero, SiteFooter). Deliberately short; product context lives in
  `workout-planner/docs/product-overview.md`.
- `/feedback` — public feedback form → `app/api/feedback/route.ts` → `feedback` table.
- `/manage/*` — password-gated owner dashboard (improvements / todos / feedback),
  CRUD over the `improvements` / `todos` / `feedback` Supabase tables.
- `/oembed-test` + `/api/meta/oembed` — Meta oEmbed demo (see META_OEMBED_REVIEW.md).

## Auth (owner dashboard)
- `middleware.ts` gates `/manage/:path*` and `/api/admin/:path*`.
- Single shared passcode in `ADMIN_PASSWORD`; login sets an httpOnly cookie
  holding a sha256-derived token (`lib/auth.ts`). Rotating `ADMIN_PASSWORD`
  invalidates all sessions.

## Environment (`.env.local`, mirror in Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase access
- `ADMIN_PASSWORD` — `/manage` passcode
- `INSTAGRAM_ACCESS_TOKEN` — Meta oEmbed route

## Quick Commands
```bash
npm run dev          # local dev
npm run build        # production build (don't run while `npm run dev` is live —
                     # they share .next and the build corrupts the dev cache)
git push origin main # auto-deploys via Vercel
```

## Related Repos
- **Mobile app**: `/Users/linnawang/dev/workout-planner` (Expo React Native)
