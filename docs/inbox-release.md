# Auctor Inbox release notes

This is a permanent in-product Inbox. It has no dependency on WhatsApp consent,
queues, templates or configuration. No migration or production job was run during implementation.

## Release preparation and post-deployment smoke tests

1. Migration 202609130002_harden_auctor_inbox.sql is already applied in production, as confirmed by the owner. Do not replay it. Production read-only schema probes confirm proactive_date, rule_key and inbox_generation_runs. Checking actual policy, privilege, index and trigger definitions is a post-deployment verification task when SQL/admin access is available. Run tests/inbox-security.sql in a SQL session and compare its output with migration 002. Do not replay either migration blindly.
2. Verify real authenticated ownership isolation and concurrent daily-cap enforcement in staging. The Node tests use a database test double; they do not execute PostgreSQL policies or triggers.
3. Local production-build browser verification is available with node tests/inbox.browser.mjs (start Next on localhost:3107 first; CHROME_PATH can override Chrome). Its 17 checks use intercepted API requests backed by actual Inbox handlers and an in-memory database. It never writes production data. Real production login, actions and logout/login are post-deployment smoke tests requiring an authorized test session.
4. After deployment, confirm CRON_SECRET and deployment runtime limits when Vercel access is available. Do not seek credentials or secrets during release preparation. The local schedule remains 02:30 UTC / 08:00 IST, with a 300-second generator and 60-second mutation route. Production exposes the generator route and rejects unauthenticated requests; successful scheduled execution is not verified. The production ledger probe returned no runs.
5. Review the isolated Inbox diff before release. This pass performs no commit, push, deployment or database mutation. Observe the first scheduled generation after the approved release; reruns require separate authorization.

## Daily rules and policy

Rules are evaluated in order, choosing at most one daily message:

- Exact 7-, 14-, or 28-day streak milestones ending yesterday, using distinct completed-learning calendar days. A 29th lookback day distinguishes longer streaks, preventing repeated 28-day messages. Keys identify the streak start and threshold event.
- 100 or more measured questions completed yesterday: a daily achievement, never described as a lifetime total.
- Module improvement: previous seven days versus last seven days, at least 20 questions in each, at least five percentage points of improvement, and no progress message in the last seven days.
- Yesterday's performance: measured questions, weighted accuracy, distinct practice sessions. Timing is displayed only for the subset with positive recorded duration; the timed-question denominator is included.
- Recommendation: a module with at least 20 recent questions and accuracy below 65%; includes a weak question type if at least five measured questions support it. Seven-day cooldown; CAT-only destinations follow existing exam capabilities.
- Inactivity: no recorded activity for seven days, account at least seven days old, fourteen-day cooldown.
- If the learner has already returned today, suppress recommendations/inactivity. Otherwise create nothing. Chat/editorial engagement is never reported as completed question performance.

Every chosen daily message has user-scoped daily idempotency and proactive_date.
The unique daily index prevents different producers from creating two proactive
messages on that date. An insert trigger binds proactive messages to their actual IST creation day,
including future producers that omit the date. Distinct account/system/achievement producers may use the
creation service with their own idempotency/rule key and no proactive date.
Archived and deleted notifications still participate in frequency controls.

## Activity semantics

All windows are half-open IST calendar intervals. Daily RC/workout/grammar use
completed_at. RC/Precision use rc_questions submission timestamps, not the earlier
Precision session start; question rows are grouped into distinct sessions. Ordinary RC completion-time session rows provide a deduplicated fallback when
question analytics are absent. Legacy Precision sessions lacking submission analytics
cannot supply a trustworthy completion date or skill metrics.
Vocabulary, speed and sectionals write their session row on completion and use
created_at. Word Hunt uses its explicit attempt_date as the activity calendar date,
not the UTC date of an IST boundary. Chat/editorial records are engagement only.
No duration is invented for sources without reliable recorded seconds. Attempt-year
is not used to infer an exam deadline because no authoritative deadline exists here.

## Operation and failure visibility

Profiles are keyset-paginated in batches of 50. Activity is queried by batches of
users, bounded from 29 days ago through the start of the current run; every source is itself paginated. Previously
created daily messages are checked before activity reads. Inserts use concurrency
five. At 529 users, a normal run needs roughly 121 base activity queries plus profile,
history and eligible insertion queries, instead of twenty activity queries per user.
Large source histories add pages; this is not a fixed query count.

inbox_generation_runs records start/finish, outcome, counts and last user ID.
Individual creation failures do not stop other users. A failing activity source
fails its batch visibly rather than generating false inactivity reminders. Other
batches continue. Partial runs return 503; fatal initialization errors return 500.
Do not assume Vercel automatically retries these responses. Investigate failures
and authorize any rerun separately. Each history/activity page honors cancellation, and session/network/body/query waits have actual deadlines even if a dependency ignores abort. Generator work has a 240-second budget, activity/history batches 30 seconds, and inserts 15 seconds. Ledger finalization has two bounded 15-second attempts outside the work budget. The next invocation marks running records older than ten minutes failed; this recovers process-killed executions without affecting live runs. Retrying starts from the beginning,
skips already-created daily messages and safely retries remaining decisions.

## API contract

GET /api/inbox accepts folder=INBOX|ARCHIVE|TRASH, filter, search (120 characters),
pageSize (1–50), and opaque nextCursor from the preceding response. Cursors are
bound to folder/filter/search. Order: priority DESC, created_at DESC, id DESC.
Newer messages are visible on refresh; inserts cannot shift an existing cursor.

PATCH accepts action plus 1–5000 UUID ids, or action=read/all=true. Selections are
processed in batches of 100, never truncated. updated contains actual writes;
current/missingIds reconcile concurrent changes; unreadCount is read from storage.
Partial failures are explicit. Mark-all-read applies to the whole Inbox, not just
its current search/category. Archive/trash restoration preserves original content.

Successful selected read/unread, archive/unarchive and trash/restore actions offer Undo for acknowledged changes. Undo includes the mutation timestamp, so a subsequent edit cannot be overwritten. Partial/uncertain outcomes and mark-all-read are excluded; the latter explicitly directs users to select messages and mark unread. Automatic reader marking is reversed using Mark unread.

GET /api/inbox/[id] is now read-only. The UI marks a successfully opened message
read with PATCH and cancels stale detail requests. Soft-deleted messages remain
available to their owner in Trash; restore returns them to their previous folder.

## Rollback

If application rollback is necessary, keep the additive schema and stored messages.
Stop the Inbox cron only through an approved configuration change if it causes a
production problem. Do not roll back unrelated schedules or restore broad user
UPDATE privileges. Investigate failed run records before authorizing a rerun.
