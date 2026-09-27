# Boot Camp fixed-calendar release

## Inspection

The existing calendar visually mapped 50 days from October 1, 2026, but the application chose the next incomplete day and required every preceding day to be completed. `bootcamp_create` repeated that sequential restriction. Report navigation checked content availability without checking its release date. The calendar also displayed non-current days as locked even where a link was available.

Existing Boot Camp enrollment/day/block/question tables already support one official attempt per enrollment/day, serialized creation, immutable source snapshots and finalized answers, block checkpoints, question saves, and timer-preserving resume. No duplicate attempt or per-user scheduling model is required.

Boot Camp authentication previously enforced identity and tenant membership but did not use the existing payment entitlement helper. The new Boot Camp access wrapper reuses that helper without changing its subscription, premium, trial or institute rules. Expired subscriptions are not silently extended through January.

Live read-only inspection found the final `Auctor_Boot_Camp_Day_1_FINAL_VALID_FORMAT_v2.docx` document, enriched with 25 questions and 28 enrichment entries. There were three enrollments, three day attempts, fifteen block attempts and seventy-five question attempts. The earlier `bootcamp_history` RPC was absent (PGRST202). No live content or attempt was changed.

## One mapping and access policy

`lib/bootcamp/calendar.mjs` exports the single deterministic 50-row content/date mapping. No enrollment dates or completion order affect it. Calendar interpretation uses Asia/Kolkata, consistent with existing app date features.

| Period | Behavior |
|---|---|
| Before October 1, 2026 | Upcoming; all curriculum days locked |
| October 1-November 19 | Day 1-Day 50, one release each date |
| November 20-29 | Ten buffer/catch-up dates, no new content days |
| November 30-January 31, 2027 | Same open practice library |
| After January 31 | Practice access closed; historical records retained |

Release and progress are distinct. A completed or in-progress day can still be today's mission. Published content availability is also distinct from calendar release: a released day without content shows Preparing, never substitutes an older day for today's mission.

All student API paths that access a day use server-time validation: start, selected-day home, attempt read/resume, mutation, review, coaching and chat. Client dates cannot unlock future days. SQL RPCs remain service-role-only. The authenticated service applies the release rule; the database create function retains locking and uniqueness but no longer imposes preceding-day completion. No second content-to-date mapping exists in SQL.

Completed start requests return the existing report state and ID, never create/reset an attempt. No redo/reset action is exposed. Existing intra-day completion and scoring behavior is unchanged.

The landing screen retains the left mission/right October-November calendar. Today is primary even with backlog or a completed result. Previous days have Open/In progress/Completed labels and are accessible in any order. Ten November buffer cells are labelled without Day 51-60. Buffer/library periods provide a calendar browsing CTA. Counts use neutral completed/catch-up language. Backlog reports link back to today's mission rather than unlocking a future day.

The calendar service exposes `calendar.todayDay`, `daysToExam`, and `nudge` data for manual broadcasts. No authoritative CAT date configuration was found, so the live countdown stays null and no date is guessed. The service supports an explicitly supplied exam date when a product-authoritative configuration is established. No notification infrastructure changed.

## Database deployment

No new table, scheduling row, content write, attempt reset, or data backfill is needed.

Apply these existing/new migrations in order in Supabase SQL Editor:

1. `supabase/migrations/202609230001_bootcamp_trainer_history.sql` (missing prerequisite on the inspected live database): enables Days 1-50 and adds protected history reconstruction.
2. `supabase/migrations/202609230002_bootcamp_fixed_calendar.sql`: replaces only `bootcamp_create` to remove sequential gating, keeping its identity, enrollment lock, existing-attempt return and permissions.

Do not rerun the original create-table migration. The configured service-role HTTP API cannot execute DDL and there are no database connection credentials configured. Local PostgreSQL tests execute all three migrations in sequence; live application of the two pending migrations requires the SQL Editor. Until then, live starts beyond Day 1 remain unavailable independently of the date policy.

## Changed files

- `lib/bootcamp/calendar.mjs`: mapping, access states, periods, server-date metadata and buffer cells.
- `lib/bootcamp/service.mjs`: centralized release checks, today's mission/catalog, catch-up counts and nudge projection.
- `lib/bootcamp/access.mjs`, `server.js`: Boot Camp-only integration with existing entitlements.
- `components/bootcamp/BootCampArena.jsx`, `arena.module.css`: calendar/mission presentation and compact status labels.
- `BootCampSession.jsx`: locked/unavailable states, access error links, server-date refresh, report destination wiring.
- `BootCampHomeCard.jsx`, `BootCampDayReport.jsx`: current-calendar messaging and links.
- The new SQL migration above.
- `tests/bootcamp-calendar.test.mjs`, `tests/bootcamp-calendar.browser.mjs`; existing Boot Camp test fixtures and expectations updated for fixed dates; `package.json` test commands.

Content Engine, `bootcamp_days`, legacy Daily RC/Sectional/RC Practice/Workout/shared Birbal code, scoring and analytics were not modified for this change. Pre-existing unrelated working-tree edits were left in place.

## Verification

`npm run test:bootcamp` includes pure calendar dates, timezone boundaries, subscription states, SQL-backed late join and arbitrary backlog starts, two-block resume, final result preservation, no duplicate attempt, future direct-route rejection, and January access boundaries.

`npm run test:bootcamp:calendar:browser` exercises the six specified dates with real UI/handlers and isolated PostgreSQL. It also checks a late join, a missed date, two-block resume after navigation/refresh, completed-report reopening, today's mission after backlog, buffer/library/prelaunch states, and 1440/390/320px layouts. The browser test injects its server date through its isolated harness. Local development now also supports BOOTCAMP_TEST_DATE; production ignores that variable. See bootcamp-overall-analytics.md for the exact steps.

Other checks: existing Boot Camp browser regression suite, trainer browser suite, scoped lint, TypeScript check and production build. Browser tests intercept test authentication and use local PostgreSQL; no live student attempt is simulated or modified.

## Final results (September 24, 2026)

- 33 service/calendar/history tests passed.
- 67 calendar browser checks passed for all six requested dates, late join/gap, arbitrary backlog, two-block resume, report/no-retry, prelaunch and January boundaries, plus desktop and 390/320px mobile layouts.
- 232 existing Boot Camp browser regression checks passed.
- 31 trainer-history browser checks passed with the test clock advancing through October 1-3.
- Scoped lint, explicit TypeScript check and production build passed. Existing unrelated leaderboard/cron build diagnostics remain; Node also reports the existing entitlement module's unspecified module type when imported by the test runner.
- Concurrent browser runs initially timed out; all three suites passed independently with no application changes after the build.
- Final Day 1 content, document metadata, lock token and update timestamp exactly matched the read-only pre-test snapshot. No live content or attempt writes occurred.
- The local unauthenticated Boot Camp API returns 401. Entitlement states are covered by unit tests; browser suites use intercepted authentication and isolated PostgreSQL.
- At final readback, the live history prerequisite still returned PGRST202. Both pending SQL migrations above must be applied in order before live later-day starts can work. No live SQL migration was applied by this task.
- App left running at http://localhost:3000. With the real September 24 date, the program correctly shows Upcoming and locks all content until October 1.

For local PowerShell browser checks, set `$env:BOOTCAMP_TEST_BASE_URL='http://localhost:3000'` before running the corresponding npm script. Browser artifacts are in the OS temp `auctor-bootcamp-calendar-acceptance` directory. Published/enriched content must exist for a calendar-open day; unpublished days are shown as Preparing. The CAT countdown remains unset until an authoritative exam date is supplied, and January practice access remains subject to existing entitlement rules.

