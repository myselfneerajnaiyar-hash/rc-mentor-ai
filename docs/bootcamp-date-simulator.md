# Boot Camp date simulator

The deployed simulator runs only on Vercel Preview deployments, for signed-in Supabase emails listed in the Preview-only `BOOTCAMP_PREVIEW_USERS` environment variable. Keep Vercel Deployment Protection enabled for Preview deployments and limit it to the team; invite the cofounder to the Vercel team. The normal Supabase login, tenant, entitlement, and attempt ownership checks still apply. Production ignores the `testDate` parameter and retains the official October 5, 2026 calendar.

Use the same existing Supabase project for Preview by making its existing Supabase URL, anon key, and service-role key available to Preview deployments. This keeps the cofounder's real account data visible. Preview attempts write to the existing database, so use test accounts and do not create attempts you do not want saved.

Set `BOOTCAMP_PREVIEW_USERS` in Vercel's **Preview** environment to the exact comma-separated Supabase login emails for the two testers. Do not set this variable in Production. Vercel provides `VERCEL_ENV=preview` automatically; the code requires it as well as the email allowlist. No database change or test-date environment variable is needed.

Open the protected Preview deployment URL at `/boot-camp?testDate=2026-10-10`. A date selector appears for allowlisted accounts. Changing it reloads the simulated calendar. The selected date is kept in the browser session while navigating through the calendar, workout pages, reports, analytics, and leaderboard. To clear it, open `/boot-camp?testDate=`; to reset the date manually, remove the site's `bootcamp-test-date` session-storage item.

On October 10, the calendar presents Days 1–5 (October 5–9) as earlier days, Day 6 as today, and later days locked. Published earlier workouts can be opened from the calendar; completed attempts link to their reports. Catch-up status, today's mission, analytics calendar projections, and leaderboard date windows use the simulated date. The actual attempt timestamps and recorded activity dates stay unchanged, so a leaderboard only includes genuine completed attempts whose saved completion dates meet its existing on-time rules.

For the new-student view, use an account with valid tenant access and Boot Camp entitlement but no Boot Camp attempts. For the returning-student view, use an entitled account that already has actual saved attempts. The app does not create example scores or leaderboard entries.
