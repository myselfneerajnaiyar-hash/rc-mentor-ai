# Review freeze and mobile layout fixes — 28 September 2026

## Diagnosis

Detailed Review in Daily RC opens a report accordion (`DailyRCResult`) and mounts `DetailedRCReview`; the standalone `/detailed-review?attemptId=...` route opens the same section. The report fetches one authenticated attempt through `useDailyRcReview`. Section switches reuse that loaded data.

The reproduced freeze was scroll containment: both passage and argument panes had `overflow-y-auto overscroll-contain`. At phone widths the panes expand to fit content, but still intercept gestures and suppress scroll chaining to the document. At 375/390/430, a 500px wheel gesture over the passage left document scroll unchanged. Removing containment and using visible overflow for the mobile panes allowed the same gesture to advance the document by 500px. No body-scroll-lock effect, blocking modal, or infinite render loop was found on this path.

Workout's Performance tab occupied x=298..419 at 375px, exceeding the viewport. The scroll strip also inherited a fixed 36px TabsList height while triggers were 40px tall, and hid its scrollbar. The mobile-only two-column layout removes that clipping and makes all four tabs 48px tall while keeping Radix keyboard behavior.

## Changes

- `components/review/DetailedRCReview.jsx`: remove scroll containment; add scoped review/navigation classes.
- `app/mobile.css`: normal document scrolling for phone review panes, wrapping review section controls, normal-flow review question footer above the shared bottom-nav reservation; mobile Workout tab grid and spacing.
- `components/DailyWorkoutContainer.jsx`: scoped layout classes, retaining desktop tab styling.
- `components/DailyRCResult.jsx`: retry error state and visible history exit during loading.
- `lib/dailyRc/useReview.js`: retry dependency, clear pending data, reuse bounded request helpers, preserve cancellation/ownership checks. This is network recovery protection, separate from the CSS freeze fix.
- `app/daily-challenge/test/page.jsx`: restore pane scroll after React commits the selected pane using useLayoutEffect, avoiding the prior animation-frame timing race. Existing unified header, Submit Answers actions, and mobile spacing fixes were preserved.
- `tests/daily-rc-review.test.mjs`: retry and stale-request coverage.
- `tests/review-layout.browser.mjs`: fixture-based mobile/desktop interaction regression.

Existing Homepage/Pricing, MobileShell, TenantProvider, and earlier mobile test changes were preserved. No payment or authentication logic was changed. No commits or pushes.

## Verification

- Full Node suite: 264 passed, 0 failed (`tests.txt`).
- Review suite after adding retry assertions: 15 passed, 0 failed (`review-tests.txt`).
- TypeScript: exit 0 (`typecheck.txt`).
- Configured Boot Camp lint and explicit shared review component lint: exit 0 (`lint.txt`, `review-lint.txt`).
- Diff whitespace check: exit 0.

Build and final browser results are recorded separately below once complete. No user screenshot files were attached; only the pasted request was available. Physical iOS/Android gesture and safe-area testing remains necessary.

- Isolated production build: exit 0 (exports/review-layout-fixes/build-isolated.txt). Standard build compiled but failed during page-data collection with missing /_document; isolated source copy completed successfully. Existing prerender network/dynamic-route diagnostics remain.
- Production browser regression: exit 0 at 375x844, 390x844, 430x844 and 1440x844 (exports/review-layout-fixes/browser.txt). Review scroll chaining, all review sections without repeated requests, question navigation, closing/returning, failed-load retry and leaving while loading passed. All four Workout tabs and keyboard activation passed. Daily RC panel width, top placement, selected-answer preservation and unobscured submit controls passed. Database/API traffic was intercepted with fixtures.
- Screenshots inspected: workout-tabs-375.png, review-last-action-375.png, daily-rc-390.png. Evidence directory: exports/review-layout-fixes/.
- Full application diff: exports/review-layout-fixes/changes.diff; includes retained earlier Daily RC layout changes. No changes committed, pushed or deployed.
