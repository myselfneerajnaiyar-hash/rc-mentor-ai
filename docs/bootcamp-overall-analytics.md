# Boot Camp overall analytics and multi-day readiness

## Inspection and scope

The student app already consumes generic Days 1–50 through `adaptDay`, stable source IDs, enrichment keyed by target IDs, immutable attempt snapshots, and the fixed October 1–November 19 curriculum mapping. Existing Day 1 compatibility routes remain aliases. The daily analytics component had a hardcoded Day 01 label; it now receives the actual day number.

There was no overall analytics route. Recharts was already installed. Raw Boot Camp question outcomes and snapshot type/skill metadata are suitable for aggregates. Positive active_ms is approximate question-view time, not passage-reading time. Saved-answer and block-finish timestamps support observed activity, but not a complete historical event log. No new database table, view, function or migration was necessary.

Read-only live inventory on September 24, 2026: Day 1 and Day 2 are enriched, each with 25 questions. Days 3–10 are absent. No curriculum, attempts, Content Engine, legacy product, subscription or scoring data was changed. Synthetic curriculum exists only inside isolated test databases.

## Files

New:
- `lib/bootcamp/overall.mjs`: pure aggregate and safe browser projection; reuses generic trainer windows.
- `lib/bootcamp/clock.mjs`: strict development-only release-date override.
- `app/api/bootcamp/analytics/route.js`: authenticated overall endpoint.
- `app/boot-camp/analytics/page.jsx`: separate student journey route.
- `components/bootcamp/BootCampOverallAnalytics.jsx` and `overall.module.css`: Overview, Performance, Skills and Consistency views.
- `tests/bootcamp-overall.test.mjs`, `tests/bootcamp-overall.browser.mjs`.

Updated: `lib/bootcamp/service.mjs`, `api.mjs`, `server.js`; `BootCampArena.jsx`, `BootCampDayReport.jsx`, `BootCampReportAnalytics.jsx`; `package.json` test scripts; this report and the calendar documentation reference.

## Queries and ownership

`getBootCampOverallAnalytics(userId)` reads the authenticated user's `bootcamp_enrollments` row, selects at most 50 owned `bootcamp_day_attempts` IDs, then calls existing ownership-checking `bootcamp_read` in batches of five. That RPC rehydrates `bootcamp_block_attempts` and `bootcamp_question_attempts`. `bootcamp_days` supplies the published/released question denominator. Existing snapshots override mutable source counts for already-started days.

Only aggregate counts, dates, approved taxonomy names and evidence-based text leave the server. No source text, answer keys, individual responses, student IDs, lock tokens or snapshot revisions are exposed. No legacy tables, cached reports or generated AI summaries participate. The read never commits, expires a session, starts coaching, or changes attempts. Day 50 is included without extending the history RPC's exclusive boundary.

## Calculations and reliability

- Performance uses fully completed day attempts with all five blocks completed. Partial days are shown separately with saved-answer counts and resume links.
- Attempted = correct + incorrect. Accuracy = total correct / total attempted, not average of daily percentages. No attempts yields null, displayed as a dash.
- RC includes only rc1–rc3; VA only va. Warm-up is separate in RC/VA comparisons and included in overall/type/skill profiles.
- Completed days / 50 gives curriculum progress. Started requires actual block start or saved response, not just opening the mission. RC passages, VA answered questions, and warm-ups are counted within completed days.
- Question-type/skill bars require at least four answered questions across two completed curriculum days. Sample sizes are visible.
- Direction compares the latest three completed curriculum days with the preceding three, ordered by curriculum number. Each window needs four answers across two days. A 10 percentage-point change is descriptive, not a significance test or equal-difficulty comparison. Catch-up order does not reorder curriculum-day comparisons.
- Timing averages positive finite active_ms on answered questions only; counts show timing coverage. It excludes unobserved time and passage reading. Zero/missing timing is not treated as a zero-second attempt.
- Activity/streaks use actual India-calendar saved-answer and block-finish dates, never login or curriculum number. Several catch-up days completed on one date count as one active date. Current streak ends today or yesterday; best streak spans consecutive observed dates. The schema retains only the latest save per question, so these are lower bounds. Recorded dates outside the 50 curriculum dates remain available in the activity disclosure.
- Birbal's read is deterministic structured interpretation, not a new LLM call: observed totals, supported improvements, sufficiently sampled below-overall skills, and review focus. Improving skills are excluded from the watch list. Existing generic current-day trainer context still supplies owned prior history, recent windows and current content to Boot Camp coaching/chat.

Hidden: insufficient-sample profile categories, unsupported direction arrows, invented missing-day points, reading-speed claims, accuracy/speed quadrants, statistical significance, and controlled long-term improvement claims. No scatter chart is justified by current timing quality.

## Deployment prerequisite

No NEW migration is required for this feature. The previous multi-day/calendar work still requires these existing migrations, in order:
1. `supabase/migrations/202609230001_bootcamp_trainer_history.sql`
2. `supabase/migrations/202609230002_bootcamp_fixed_calendar.sql`

Read-only live check still returns PGRST202 for bootcamp_history. The configured service-role REST client cannot execute DDL; these were not applied. Run them through the project's normal authorized Supabase migration workflow before testing live Day 2+. Do not rerun the original create-table migration. This feature cannot make unpublished Days 3–10 available.

## Local date testing

The prior code had a test-harness clock but no BOOTCAMP_TEST_DATE integration. The new server-only clock accepts that variable only when NODE_ENV is development. Production/test mode ignore it, including invalid values. Invalid development dates fail explicitly. No URL/query/browser date can override release decisions. Database timer deadlines and subscription expiry continue using real time.

Stop the existing local server first, then PowerShell:

```powershell
$env:BOOTCAMP_TEST_DATE = '2026-10-01'
npm run dev -- --port 3000
```

To change days, stop with Ctrl+C, set the next date, and restart the same command. Do not run build and a server against the same .next directory concurrently. `npm run start` is production and deliberately ignores this override.

1. Deploy the existing prerequisite migrations and publish finalized Days 3–10 through the unchanged Content Engine workflow when ready. Do not replace final Day 1 or create fake student attempts.
2. Sign in with an entitled student. Oct 1: complete Day 1; all later days remain locked.
3. Advance to Oct 2 and Oct 3; complete each. Verify the same generic blocks/review/report flow and one official attempt per day.
4. Advance directly to Oct 5. Day 4 is open backlog, Day 5 is today, Day 6+ locked. Complete Day 5.
5. Complete Day 6. On Oct 7, save an answer and leave partway through. Refresh and verify resume.
6. Advance to Oct 8–10, completing available days. Day 11 remains locked on Oct 10.
7. Open `/boot-camp/analytics`: completed-day points only; Day 4 absent, Day 7 partial; actual weighted totals, sample counts and taxonomy bars. View Day 10's daily report separately.
8. Return to Day 4 and finish it; it adds its own curriculum-day point. Resume/finish Day 7; it joins completed performance. Reopening completed days must show the official report, not retry.
9. Because the override changes release dates only, testing all days in one real sitting does NOT fabricate ten activity dates or a ten-day streak.
10. Remove the variable after testing: `Remove-Item Env:BOOTCAMP_TEST_DATE`, then restart. The real calendar applies again.

## Validation

Browser suites run against the built app with intercepted test authentication/API and isolated PostgreSQL running real Boot Camp migrations/services. They do not authenticate a real student or seed Supabase. Run suites sequentially.

```powershell
npm run test:bootcamp
npm run lint:bootcamp
npx tsc --noEmit --incremental false
npm run build
# Start built server separately before browser checks
$env:BOOTCAMP_TEST_BASE_URL = 'http://localhost:3000'
npm run test:bootcamp:overall:browser
npm run test:bootcamp:browser
npm run test:bootcamp:calendar:browser
npm run test:bootcamp:trainer:browser
```

Artifacts are under the OS temp `auctor-bootcamp-overall-acceptance` directory. Final execution results are recorded below after validation completes.

### Final results — September 24, 2026

- 37 unit/SQL/service tests passed.
- 33 overall-analytics browser checks passed: empty/single/multi-day profiles, tooltip, owned history, ten-day journey with a missing and a partial day, no retry, resume, error/retry recovery, correct Day 10 label, and all four views at 1440/390/320px with no overflow.
- 232 existing Boot Camp browser checks passed, including all reviews, scoring outcomes, refresh, timeouts, chat evidence and report continuation.
- 67 fixed-calendar browser checks and 31 trainer-history browser checks passed.
- Total: 363 browser checks; no browser runtime exceptions.
- Scoped lint, explicit TypeScript check and final production build passed. Existing unrelated leaderboard static-render diagnostics remain nonfatal.
- Both live published documents passed adaptDay validation (five blocks / 25 questions) read-only. No live writes or Content Engine changes occurred.
- Initial browser test locators needed correction for a Unicode arrow, case-sensitive tab name and Next's separate route-announcer alert. Final runs pass; these were harness locator issues.
- Screenshots were visually inspected for desktop overview, mobile performance, and desktop consistency. All four views were captured at three widths.
- App left running at http://localhost:3000 using the built production server. This deliberately ignores BOOTCAMP_TEST_DATE; stop it before starting the development command above.
- Remaining live readiness limits: Days 3–10 unpublished; previous history/calendar migrations not deployed (history RPC PGRST202). No authorized SQL connection is configured here for applying DDL. The new analytics endpoint itself needs no additional migration.
