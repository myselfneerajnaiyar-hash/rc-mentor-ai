# Boot Camp 45-day rollout

## Curriculum mapping

The scheduled calendar now contains 45 training dates, October 5 through November 18, 2026. Each personal curriculum day uses the same numbered published source (`bootcamp-day-N`) as before. Personal Day 1 therefore loads the actual `bootcamp-day-1` source; content is never relabeled from the current global date.

A read-only inventory of `bootcamp_days` found enriched rows for Days 1–16. Each has 3 passages, 12 RC questions, 5 warm-ups, and 8 VA questions. There are no rows for Days 17–45 yet. The UI keeps those sessions unavailable until content is published. Rows 46–50 and any attempts/snapshots that refer to them are retained; no content or attempt rows were changed.

## Personal sequence and old enrollments

The `sequence_mode` migration defaults existing enrollments to `calendar`. A newly created enrollment is marked `personal`, and the service selects the earliest incomplete personal day. New personal attempts must proceed in order from Day 1 through Day 45. The service-only `bootcamp_create` RPC locks the enrollment and checks the preceding attempts before creating a new personal day. The existing unique enrollment/day key still makes duplicate starts idempotent.

Daily and weekly leaderboards keep their existing scheduled-date eligibility: a completed attempt counts only if its saved completion date matches that day's fixed calendar date. A personal catch-up attempt does not become leaderboard-eligible solely because it was completed. Streaks and consistency continue to use actual saved activity dates. Ten buffer dates now run November 19–28. The existing absolute access end remains February 4, 2027 (the expiry timestamp is February 5 at 00:00 IST).

## Pricing

`lib/payments/pricing.js` is the Boot Camp checkout source: ₹999 reference price and ₹799 payable price (`99900` and `79900` paise). The existing free-first-access claim and Auctor subscription, three-day trial, and CAT Test Series rules are unchanged.

The migration changes schema and a service-only function only. It does not update student, enrollment, content, attempt, payment, or entitlement rows. It was manually applied in production and its `202610090001` version was recorded in the production migration ledger after verifying the live column, constraint, function definition, and permissions.
