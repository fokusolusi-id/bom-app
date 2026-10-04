# BOM App

Next.js 16 (App Router) + Tailwind v4 + shadcn-style components + Supabase, deployed on Vercel. Dark-only, tiger orange.

## Local
```
cp .env.example .env.local   # fill Supabase URL + anon key
npm install
npm run dev
```
Without env vars the app runs on mock data.

## Supabase setup
1. Create a project at supabase.com.
2. SQL editor: run `supabase/migrations/0001_init.sql` then `0002_hardening.sql` (tables, RLS, constraints, `bump_score`, `finish_match`). Optional dev data: `supabase/seed.sql`.
3. Auth > Users: create your admin user (email + password).
4. SQL editor: `insert into public.admins (user_id) select id from auth.users where email = 'YOUR_EMAIL';`
5. Settings > API: copy Project URL and anon/publishable key into `.env.local`.

## Vercel deploy
1. Push this folder to a GitHub repo.
2. vercel.com > Add New Project > import the repo (framework auto-detects Next.js).
3. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production + Preview).
4. Deploy. Then Supabase > Auth > URL Configuration: set Site URL to your Vercel domain.
(Or use the Vercel Supabase integration from the Vercel marketplace to inject the env vars automatically.)

## Scripts
`npm run lint`, `npm run typecheck`, `npm test` (domain unit tests; set `SMOKE_URL=http://localhost:3000` to also run route smoke tests), `npm run build`. SQL tests: `supabase test db` (`supabase/tests`).

## Structure
- `src/domain` pure rules (tiers, scoring, input validation). Single source of truth for points.
- `src/server` repositories (Supabase and in-memory) and the admin session guard.
- `src/app` routes. `src/lib/content.ts` static page copy.

## Routes
- `/` landing, `/kompetisi`, `/komunitas`, `/mulai`, `/leaderboard` (from DB, revalidates every 30s)
- `/login`, `/admin` create match, +/- score, finish match (awards points: win +30, loss +10, x2 for Cup/Major/Championship)

## Security model
Anon key is public by design. All writes are blocked by RLS unless the user is in `admins`. `finish_match` is security definer and re-checks `is_admin()`.
