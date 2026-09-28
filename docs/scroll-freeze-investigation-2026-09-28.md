# Scroll freeze investigation — 28 September 2026

## Observed causes and limits

The audit covered app/components/lib scroll/style mutations, global CSS, MobileShell, assessment mode, Driver.js tours, native premium dialogs, chat, inbox, and preview video overlays. Three application code paths independently wrote body overflow. No application touchmove/wheel preventDefault handler was found blocking these routes. Native dialogs and Driver.js keep their own interaction/cleanup mechanisms.

Two defects were reproduced before editing:

1. `components/home-v2/BirbalFloatingButton.jsx`: the lock effect depended on `chatOpen`, but rendering depended on `chatOpen && !isMobile`. Opening chat at desktop width and resizing to 390px removed the visible chat without releasing `overflow:hidden`. Home and subsequent Practice navigation stayed at scroll 0. The new hidden-chat regression was run against the previous production snapshot and failed on exactly that hidden overflow value (`regression-before.txt`).
2. `components/ChatMentor.jsx`: both the messages effect and each 10ms typing iteration called `bottomRef.scrollIntoView()`. In the inline Decoder chat this scrolls ancestors, including the document. During an upward touch gesture, document position instead advanced 12929 -> 12977 -> 13002 while typing continued. The message pane also used overscroll containment even when embedded in a scrolling page.

Direct loads of the current local Detailed Review and Decoder did NOT reproduce the reported universal freeze: initial touch gestures moved 435–700px. The runtime records show document/window scrolling on phones and body scrolling on desktop; desktop review additionally owns inner passage scrolling. Therefore there is no evidence for claiming one common cause of every reported production freeze. The URL, browser/device, deployed version and preceding sequence were requested but were not supplied during this run. Local fixes are not a deployment claim.

The earlier fix removed one review-pane overscroll trap. Its checks did not cover hidden desktop-chat state after resizing or Decoder's per-character document autoscroll. It did not establish that the deployed/device-specific incident was fixed.

## Files changed in this investigation

- `lib/ui/bodyScrollLock.mjs`: shared ownership tokens; only the last owner restores the original inline overflow and priority; releases are idempotent and independent by document.
- `components/home-v2/BirbalFloatingButton.jsx`: own a lock only while the chat is visible; close/release on mobile resize, route/view changes, assessment entry, and unmount. A closed launcher never clears another overlay's lock.
- `components/inbox/InboxApp.jsx`: replace captured-overflow restoration with an owned release token; retain focus, keyboard, and dialog behavior.
- `app/preview/page.js`: same owned token for video open/close/Escape/unmount.
- `components/ChatMentor.jsx`: autoscroll only the message pane; stop following when the reader scrolls back; stop simulated typing on unmount. Inline contextual chat reuses the existing 650px chat size capped to 75dvh, providing a real inner scroll viewport. It permits scroll chaining into the document; overlay chat retains containment. No global overflow override or touch-event suppression was introduced.
- `tests/body-scroll-lock.test.mjs`: multiple owners, cleanup orders, repeated releases, preserved original inline priority, effect replay, independent documents.
- `tests/scroll-p0.browser.mjs`: touch/runtime evidence, hidden-chat regression, three review/decoder open/scroll/exit cycles at each width, inbox-to-review cleanup, tour close, reply typing and navigation cleanup.
- `tests/scroll-overlays.browser.mjs`: repeated preview video close/Escape, post-close gestures, tour cleanup on client navigation.

All pre-existing workspace changes were preserved, including prior review, Workout, TenantProvider, and tests. No commit, push, payment changes, or deployment.

## Verification actually run

- `node --test tests/*.test.mjs`: 267 passed, 0 failed.
- `npx tsc --noEmit`: exit 0.
- `npm run lint:bootcamp`: exit 0.
- Targeted ESLint via `exports/scroll-p0/eslint.config.mjs` on the five changed application files: exit 0. This uses recommended rules with unused-variable checks disabled for legacy JSX and allows existing empty catches; an initial strict run reported the pre-existing empty catch in InboxApp.
- `npm run build --prefix exports/scroll-p0/workspace`: exit 0 against an isolated source snapshot. Existing dynamic-route/prerender diagnostics were emitted. Isolation avoids concurrent writes to the main workspace .next output.
- `MOBILE_TEST_URL=http://localhost:3116 node tests/scroll-p0.browser.mjs`: exit 0, 375/390/430/1440 × 844. Chromium touch input was dispatched through CDP, with actual scroll movement assertions and runtime snapshots.
- `MOBILE_TEST_URL=http://localhost:3116 node tests/scroll-overlays.browser.mjs`: exit 0, all four widths. Video dialogs repeated three times each; tour navigation cleanup checked.
- `MOBILE_TEST_URL=http://localhost:3116 node tests/review-layout.browser.mjs`: exit 0. This includes a normal desktop browser context, review sections/loading/retry/exit, all Workout tabs and keyboard behavior, and Daily RC answer preservation/layout.
- `MOBILE_TEST_URL=http://localhost:3116 node tests/mobile-rc-fixes.browser.mjs`: exit 0, including submission cancellation/loading/failure/retry/success, desktop submission and simulated safe-area insets.

Example after-fix movement:

- 375px review long passage: 8840 -> 10411 -> 9725 (down then up).
- 375px Decoder: 0 -> 1849 -> 1139; bottom chat area 15307 -> 14872.
- Desktop review inner passage: 0 -> 1200 -> 600.
- Decoder while typing: 12644 -> 12034 -> 12031. Typing no longer pulls the document to the chat.
- Home after leaving an active reply: 0 -> 959 -> 365.

Evidence lives in `exports/scroll-p0/`: `before.txt`, `locks-before.txt`, `regression-before.txt`, direct-load/lock runtime JSON, final `runtime.json`, `overlay-runtime.json`, `after.txt`, `overlays.txt`, build/test/lint logs and screenshots. Runtime data includes html/body dimensions, inline/computed overflow, position/top/height/touch-action, window/body scroll, main/inner panes, ancestors of the hit-tested touch point, and fixed overlays. All user/API/database records in these runs are fixtures; no real student records or writes were used.

## Remaining physical-device verification

These are Chromium simulations, not physical iOS Safari/Android WebView proof. On the failing deployed URL, record device/browser/version and reproduce the exact preceding interaction. On each physical device: open review, swipe through the passage and questions, close/reopen three times, then open Decoder, scroll both directions and to the bottom, send a chat message and scroll away during typing, exit; repeat after closing a tour/inbox/video. Confirm bottom actions are reachable with browser bars and the keyboard shown. For desktop-to-mobile/responsive WebView transitions, open desktop chat before crossing 900px and verify its hidden state releases the background.

Until the reported environment is matched, the production incident itself remains unconfirmed despite passing local regression coverage.

Additional boundary regression: tests/scroll-boundaries.browser.mjs passed at all four widths. Input scrolling reached the full long-review document bottom on phones and the inner passage bottom on desktop; upward input moved away from each boundary. See exports/scroll-p0/boundaries.txt and boundary-runtime.json.
