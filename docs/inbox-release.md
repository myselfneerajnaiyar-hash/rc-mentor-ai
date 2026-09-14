# Auctor Inbox release notes

This is a permanent in-product Inbox. It has no dependency on WhatsApp consent,
queues, templates or configuration. No migration or production job was run during implementation.

## Release gates

1. Keep this feature separate from the uncommitted Daily RC review change. Review only Inbox paths, the small login/welcome redirects, navigation and the existing Inbox-only cron addition.
2. Inspect production migration history and the actual inbox_notifications schema, grants, RLS and indexes. The table already exists; do not replay 202609130001 blindly. Record/repair migration history only through the team's approved migration procedure after comparing definitions.
3. Review and apply 202609130002_harden_auctor_inbox.sql through that procedure. It adds two nullable columns, unique/index constraints, an insert trigger, and a private run ledger. It removes direct user UPDATE access; authenticated server APIs handle state changes. It neither replaces the existing Inbox table nor deletes its data.
4. Before production rollout, execute tests/inbox-security.sql against the migrated staging database and verify authenticated users can read only their own rows, cannot insert/update/delete directly, and cannot access the generation ledger. Verify the actual daily unique index with concurrent staging insert transactions. The local Node suite uses a database test double; it is not a live RLS/SQL test.
5. In staging, check desktop/mobile Inbox, keyboard focus, login return (existing and newly completed profiles), multi-tab badges, search, >100 selected actions, Archive/Trash restoration, and request cancellation. There is no existing browser automation harness in this repository. SSR rendering and state helpers are covered locally.
6. Confirm the deployment permits the configured 300-second generator and 60-second bulk API duration. Confirm CRON_SECRET already exists; do not print or rotate it. The existing local Inbox schedule is 02:30 UTC / 08:00 IST. Leave all other schedules unchanged.
7. Only after explicit approval: commit the isolated feature, apply the reviewed migration, then deploy the application and its Inbox cron. Observe the next scheduled run; do not manually invoke it as part of this work.

## Daily rules and policy

Rules are evaluated in order, choosing at most one daily message:

- 7-, 14-, or 28-day streak ending yesterday, using distinct completed-learning calendar days.
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
users, bounded from 28 days ago through the start of the current run; every source is itself paginated. Previously
created daily messages are checked before activity reads. Inserts use concurrency
five. At 529 users, a normal run needs roughly 121 base activity queries plus profile,
history and eligible insertion queries, instead of twenty activity queries per user.
Large source histories add pages; this is not a fixed query count.

inbox_generation_runs records start/finish, outcome, counts and last user ID.
Individual creation failures do not stop other users. A failing activity source
fails its batch visibly rather than generating false inactivity reminders. Other
batches continue. Partial runs return 503; fatal initialization errors return 500.
Do not assume Vercel automatically retries these responses. Investigate failures
and authorize any rerun separately. A running row older than the configured
execution limit indicates an interrupted run. Retrying starts from the beginning,
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

GET /api/inbox/[id] is now read-only. The UI marks a successfully opened message
read with PATCH and cancels stale detail requests. Soft-deleted messages remain
available to their owner in Trash; restore returns them to their previous folder.

## Rollback

If application rollback is necessary, keep the additive schema and stored messages.
Stop the Inbox cron only through an approved configuration change if it causes a
production problem. Do not roll back unrelated schedules or restore broad user
UPDATE privileges. Investigate failed run records before authorizing a rerun.
