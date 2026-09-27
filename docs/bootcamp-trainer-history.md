> Calendar update: sequential unlocking described in this historical implementation report has been replaced by the fixed-date policy in [bootcamp-fixed-calendar.md](bootcamp-fixed-calendar.md). Apply its additional migration after the trainer-history migration.

﻿# Boot Camp trainer history

## Existing data and the smallest extension

`bootcamp_enrollments` owns the program. `bootcamp_day_attempts` stores an immutable content snapshot, source revision, state checkpoints and report. Its state deliberately excludes blocks. `bootcamp_block_attempts` stores each block and timestamps, excluding questions. `bootcamp_question_attempts` stores the individual saved responses, outcomes and active-view timing. `bootcamp_read` reconstructs that hierarchy with ownership checks.

The former day constraint and start function allowed only Day 1. Previous history read day-state JSON directly, although its blocks live in separate tables. Reading cached reports or AI commentary also cannot reliably reflect corrected raw question records.

The migration widens the day range to 1..50, generalizes the existing create function, and adds `bootcamp_history`. Creation remains serialized on enrollment, requires all earlier days complete, and resumes an existing attempt without replacing its immutable source. History is restricted to the authenticated service's student and Boot Camp enrollment, before the requested day, and rehydrates the original block/question records. Browser roles cannot execute it.

## Derivation

`createService(...).getBootCampTrainerContext(studentId, currentDay)` loads the current Content Engine day (or the immutable snapshot of an existing attempt), then builds history from all prior owned attempts. There are no per-day prompts, memory tables, aggregate writes or calendar-based assumptions about abandonment.

`lib/bootcamp/trainer.mjs` reuses the existing outcome metrics. Completed days require completed blocks. It calculates:

- Overall results, completed days, attempted/correct/incorrect/skipped/not-reached/timed-out, coverage, training duration and observed active time.
- Last three and five completed days; the preceding three completed days form a non-overlapping comparison window.
- Actual authored question types, primary skills, block results and selected distractor categories. An offered trap and a selected trap are different counts; the prompt states the denominator explicitly.
- Improving, persistent, emerging, active and provisional patterns, with up to two current-content-relevant focus items. Improving items leave the watch list.
- Partial, explicitly abandoned and unstarted days as participation evidence, excluded from completed-day cognitive metrics. Completion consistency means completed/started, not attendance.

Trend labels require at least four attempted questions across two attempted days in EACH window. Changes of ten percentage points are descriptive thresholds, not significance tests or equal-difficulty comparisons. Counts, denominators and both windows remain available. Skips and unreached questions never become incorrect answers. Timing is observed active-view time, not reading speed.

The context revision hashes raw prior records and the current snapshot. Mission reads regenerate from those records, so corrections change the briefing without rebuilding a manually maintained memory. Historical AI summaries and cached report totals are not the source of these aggregates.

## Current workout and briefing

The server context retains the actual current passage text, question text/types, skills, difficulty where supplied, and approved passage metadata. The opening briefing is generated deterministically from evidence into What I've noticed / What's changed / Today I'm watching / Today's workout / Today's mission. It starts immediately and does not require a remote AI call.

Conversational Birbal and report coaching receive the compact history projection and current workout metadata. They continue to receive full authored source/enrichment for completed blocks through the existing protected review context. Unfinished questions, answer keys and future passage analysis are not sent to chat or exposed by mission UI. Previous-day raw passages and full answer histories never enter prompts; at most three recent wrong-answer examples are included. Finite authored taxonomies bound the summary; participation is bounded by the 50-day program.

Generic day/start/report routes and catalog navigation cover 1..50. Existing Day 1 URLs remain compatible. Review navigation, timers, scoring, analytics and shared Birbal components were not changed by this history work.

## Day 2 content

Original sample source is retained in Content Engine:

- `C:\Projects\auctor-content-engine\docs\samples\Auctor_Boot_Camp_Day_2_SAMPLE.docx`
- Matching `.txt` source alongside it.

The DOCX was submitted to the same `/api/bootcamp` handler used by `/upload-bootcamp`: DOCX extraction -> source/structure validation -> all 28 enrichments -> atomic Supabase save. Live result: 5 warm-ups, 12 RC questions across three passages, 8 VA questions, zero QA warnings. The student adapter accepted the saved day. A readback matched Day 1 exactly to its pre-upload snapshot. No content is hardcoded in the student app.

Day 3 browser content is an isolated test fixture, not a published curriculum day. The sample is original authored demonstration content; automated enrichment/QA is not a claim of human editorial certification.

## Deployment prerequisite

Run `supabase/migrations/202609230001_bootcamp_trainer_history.sql` in the project's Supabase SQL Editor before enabling later-day student attempts. The migration is transaction-wrapped and preserves existing Day 1 records and scoring policies. It has been executed in local PostgreSQL tests with the original migration, ownership checks and complete Day 1 -> Day 2 -> Day 3 transitions.

The configured service-role HTTP API cannot run DDL. No database connection credentials, management token or SQL execution tool is configured in this workspace. The live history RPC returned PGRST202 on verification, so live later-day attempts remain blocked until this migration is applied. Day 2 content publication is already complete and should not be repeated or replaced.

## Files in this change

- New `lib/bootcamp/trainer.mjs` and `supabase/migrations/202609230001_bootcamp_trainer_history.sql`.
- Boot Camp `service.mjs`, `content.mjs`, `session.mjs` (day-number projection only), `api.mjs`, `chat.mjs`, `coach.mjs`, `server.js`.
- Generic `app/boot-camp/day/[day]/page.jsx`, its `report/page.jsx`, and `app/api/bootcamp/days/[day]/start/route.js`.
- Boot Camp Session, Mission, Arena, HomeCard, Activity, ReviewWorkspace, Chat, DayReport, Shell components and `bootcamp.module.css`. Outside the mission, changes are day-number/navigation wiring; the stats redesign remains intact.
- `tests/helpers/bootcamp-db.mjs`, new trainer unit/browser tests, `package.json` test commands and this document.
- The two Day 2 sample source files in Content Engine. No Content Engine application code changed.

Pre-existing dirty legacy files were left alone.

## Verification commands

- `npm run test:bootcamp`: existing service/state-machine tests plus trainer aggregation and SQL integration tests.
- `npm run lint:bootcamp`
- `npx tsc --noEmit --incremental false`
- `npm run build`
- `BOOTCAMP_TEST_BASE_URL=http://localhost:3000 npm run test:bootcamp:browser`
- `BOOTCAMP_TEST_BASE_URL=http://localhost:3000 npm run test:bootcamp:trainer:browser`

For actual-content browser verification, set `BOOTCAMP_SOURCE_FILE` to the read-only Day 1 source snapshot and `BOOTCAMP_DAY2_SOURCE_FILE` to the saved Day 2 snapshot. Browser tests use actual handlers plus isolated local PostgreSQL, intercepted authentication and mocked chat generation; they do not alter live student attempts or claim to test live student authentication. Screenshots/results are written under the OS temp `auctor-bootcamp-trainer-acceptance` directory.

Stop the app's dev servers before a production build: concurrent dev/build processes share `.next` and can cause missing JS/CSS. One production server on port 3000 is sufficient for browser checks. Existing unrelated leaderboard/cron build diagnostics are outside this change.

## Verified results (2026-09-23)

- 23 service/history tests passed, including real PostgreSQL migration and progression.
- 232 existing Boot Camp browser regression checks passed.
- 31 trainer browser checks passed on the final production build with saved Day 1 and Day 2 content; Day 3 used local fixture content. All five Day 2 reviews rendered, Continue advanced correctly, refresh resumed each review, and Day 3 incorporated both prior days. No browser exceptions or protected answer-field leaks.
- 38 Today at a Glance browser checks passed, including unchanged counts, zero/nonzero timeout display, and 320/390/768/1440px layouts.
- Scoped lint, explicit TypeScript check, and production build passed. The build still prints unrelated existing leaderboard static-render and cron configuration diagnostics.
- Content Engine browser re-upload confirmed that identical Day 2 content was already saved, without duplication or browser errors.
- Local app left running at http://localhost:3000. Content Engine is at http://localhost:3113/upload-bootcamp.
- Live history migration was still absent at the last read-only check (PGRST202). No live student completion was simulated or modified.

PowerShell browser setup: `$env:BOOTCAMP_TEST_BASE_URL='http://localhost:3000'` before running the browser test commands. The two optional source-file variables must point to JSON content rows exported from the existing Content Engine table.
