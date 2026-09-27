# Auctor RC: mobile activation audit

Audit date: 26 September 2026. Scope: current working tree, including existing uncommitted work. Production application code was not changed.

## 1. Executive summary

**The current mobile experience is not reliable enough for a new student to discover, start, complete, and repeat practice without significant friction. Mobile UX is a plausible contributor to low activation; this audit does not establish how many users abandon because of it.**

This is more than a responsive styling problem:

- At **390 × 844**, the CAT dashboard places **Start Challenge at y=3,249px** and **Start Workout at y=3,586px**. A fresh student first sees a greeting, zero-valued statistics, and the beginning of a test-series promotion. The free learning actions are approximately four viewport heights from the page origin.
- A mobile navigation bar already exists. It actually shows **Home / Practice / Profile**, not the intended additional CAT destination. Its caller omits `capabilities`. At **800px**, neither the desktop sidebar nor the mobile navigation appears.
- The Daily RC question footer extends beyond narrow screens. At **320px**, Next starts at x=323px, entirely outside the viewport. The global overflow rules conceal this rather than providing a usable horizontal page scroll. Programmatic `scrollIntoView` can reveal Next by shifting the clipped panel, but then clips the left side of the question/options; this is not a usable mobile navigation solution.
- On the mobile Birbal screen, the floating Birbal avatar covers Send. A browser hit test at the Send button's center hit the avatar image instead of Send.
- Opening Workout from the scrolled dashboard retains the previous body's scroll position: the new page's heading and tabs are above the viewport. Switching views also does not create browser-history entries.
- Workout failures can leave an indefinite preparation screen. Expired users can tap dashboard practice cards or Birbal and silently return to Home.
- A completed fixture workout led to a substantial report and solutions, but no explicit next learning activity. The product asks students to rediscover what to do next.

**Recommendation:** repair interaction and recovery defects first; put one immediately available learning action above the fold; then consolidate navigation and activity progression. A new visual theme is unnecessary.

### Evidence and limits

The audit combines source tracing, browser interaction, DOM geometry, screenshots, loading/error fixtures, and a shortened successful workout journey. It inventories **39 App Router page files**, the authentication callback, and important views that share `/`.

Browser coverage used local Chromium and the actual Next application, with synthetic users and intercepted data. All browser API requests were intercepted; external browser requests were blocked. No real account signup, payment, message, student attempt, or production record was created. Fake workout save responses verify UI transitions, not backend persistence.

Core screens were checked at **320, 360, 375, 390, and 414px**, using a consistent **844px height** to isolate width effects. The dashboard was also checked at 800 and 1440px. An additional 390 × 500 check models a short visible area; it is not an actual mobile-keyboard test. CAT premium, expired access, and non-CAT fixtures were included. This is Chromium viewport testing, not certification on physical iOS Safari, Android Chrome, or the Capacitor app.

Full successful live Daily RC, generated RC, sectional, editorial OCR, payment, and Boot Camp sessions were not exercised against production services. Their paths and states were traced in code; available entry, empty, and error screens were rendered. Populated longitudinal charts and every possible generated passage remain validation gaps. No production analytics dataset or database query timing was accessed. These limits must remain attached to the findings.

Evidence files:

- [Verified viewport measurements](../exports/mobile-ux-audit/verified/measurements.json)
- [Workout completion and entitlement journey](../exports/mobile-ux-audit/journey/measurements.json)
- [Additional entry/state checks](../exports/mobile-ux-audit/extra/measurements.json)
- [Initial route survey](../exports/mobile-ux-audit/measurements.json)
- [Dashboard first screen](../exports/mobile-ux-audit/verified/home-390.png), [Workout entry](../exports/mobile-ux-audit/verified/workout-ready-390.png), [Vocab clipping](../exports/mobile-ux-audit/verified/vocab-320.png), [Birbal overlap](../exports/mobile-ux-audit/verified/birbal-390.png)

The `verified` screenshots are viewport captures. Initial survey full-page screenshots have blank regions because the body is the scroll container; use the verified captures and body measurements. `documentElement.scrollHeight` alone misleadingly reports 844px: **body.scrollHeight is the useful measure**. The audit produced 157 state/viewport captures (36 initial survey, 74 verified, 21 journey, 26 additional). The journey file named `speed-second-intro` actually captures the failed-generation blank state; the filename is not evidence of a second start screen. Coordinates are measured from the top with scroll reset unless the capture explicitly tests retained scrolling. Hidden headings in raw DOM output are not counted as visible evidence.

## 2. Mobile UX risk assessment

| Activation stage | Supported mechanism | Risk |
|---|---|---|
| Signup → authenticated arrival | Email confirmation switches context; password recovery text is not actionable; profile setup can await messaging requests before navigation | P1 |
| Dashboard → first activity | Paid test-series content precedes free practice; no single recommended action; zero scores before first success | P1 |
| Discovery → start | Practice opens RC instead of a feature directory; Workout, RC Generator and Speed have lengthy introductions before their actual start controls | P1 |
| Start → completion | Clipped Daily RC controls, timed-task navigation escape, no consistent resume, preparation/save failure handling | P1 |
| Completion → second activity | Reports emphasize diagnosis without a prominent next task; navigation requires reorientation | P1 |
| Return visit | Browser Back does not follow local views; history/progress is split among modules; expired access can look like a broken click | P1 |

There is **no confirmed platform-wide P0 outage**. Several P1 defects block particular actions or make core learning unusually difficult. Avoid treating a missing secondary destination or a long page as proof that all mobile learning is impossible.

To establish business impact, compare mobile and desktop cohorts through signup, dashboard view, first CTA impression/click, activity start, successful save, review, second completed activity, and day-1/day-7 return. Segment exam, trial/premium/expired/institute, acquisition source, width, browser and network. Use medians and tail latency for time-to-first-action, not conversion alone. Exclude audit/internal traffic.

Existing instrumentation helps: `lib/learningAnalytics.js`, `TodayActivity`, `WorkoutEngine`, and Daily RC track dashboard/CTA/activity events. However, shared activity events are not uniformly wired across all modules. `second_activity_started` uses a local-storage first-activity key and a date-based activity identity; another day's workout can qualify as a second activity. It does not require first completion and is not a cross-device first-ten-minutes funnel. Pageview analytics cannot distinguish most `/` views. Correct these definitions before attributing an activation change to UI changes.

## 3. Complete route and feature audit

### Navigation model and access

The platform has two structures: local-state views within `app/page.js`, and separate App Router pages. The root sidebar/bottom bar is owned by the root page, **not a shared authenticated layout**, so separate pages do not inherit it.

Desktop sidebar: Boot Camp, Home, Daily Workout, RC, Precision Training, CAT (CAT capability), Vocab, Speed, Word Hunt, Ask Birbal, Premium (non-institute), Profile. Grammar is feature-flagged off there.

Mobile bottom bar: Home, Practice, Profile; intended CAT tab is absent because `capabilities` is not passed. Practice changes the view to RC. A separate horizontally scrollable switcher offers RC, Vocab, Speed, Precision and Grammar. Grammar is therefore reachable on mobile despite the desktop flag. No full-feature hamburger/More drawer exists.

Access is not uniformly enforced by route middleware: `middleware.js` passes requests through. Root authentication redirects guests to `/preview`; `TenantProvider` resolves tenant/session access; Daily RC-related layouts use `CapabilityGuard`; Boot Camp additionally enforces entitlement through its API. “Authenticated-purpose route” below describes product intent, not a claim that middleware protects it. Diagnostic/demo pages are listed separately so they are not mistaken for supported student features.

Legend: **E** Easy, **M** Moderate, **D** Difficult, **H** Effectively hidden/unlinked in normal navigation. **B** Browser-rendered state; **S** source-traced only for that route/state. Recommendations reference the prioritized findings below. Scroll estimates are fixture-dependent, not universal limits.

### Root views: real features without individual URLs

| Route / view | Purpose; primary CTA | Secondary actions | Desktop entry | Mobile entry / discovery | Mobile scroll, clipping, recommendation | Evidence |
|---|---|---|---|---|---|---|
| `/`, home | Learning dashboard; several competing start actions | Tour, Inbox, Boot Camp, test series, premium, boards, reading profile | Home | Home, E | ~9,510px body at 390; free starts at 3,249/3,586px. Make one available mission primary | B |
| `/`, workout | Daily five-module workout; Start Workout | Analytics, History, Performance, report/solutions | Daily Workout | Home activity card, D | Actual start y=1,604 after entering; centered tabs clipped; retained body scroll; #1/#5/#8 | B: success + failure |
| `/`, rc | Generate or paste RC; Generate Passage / Explain paragraph | Test, RC Profile, RC History, plan/adaptive features | RC | Practice, E for entry; M/D for subfeatures | Start y=1,180; wrapped/clipped sub-tabs; use compact mode selector | B entry; S generated flow |
| `/`, vocab | Word bank, drills, lessons; add/lookup word or lesson action | Vocab Profile, drawer, revision | Vocab | Practice → Vocab or deep Home card, M | Four-tab row clips; new bank requires building vocabulary before revision; #8 | B entry |
| `/`, speed | Timed comprehension/speed drill; Start Drill | Speed Profile, review, restart | Speed | Practice → Speed, M | Start y=1,956, then automatic generation. Failed generation leaves blank content; collapse scoring tutorial and add retry | B entry; S full drill |
| `/`, precision | Focused weak-skill training; Start Precision Drill | Choose skill, answers, report | Precision Training | Practice switcher horizontal scroll / Home, D | Start about y=952 in survey; initially offscreen switcher item; promote clear task | B entry; S attempt |
| `/`, grammar | Topic/mixed grammar sessions | History/review | Hidden by `SHOW_GRAMMAR_LAB=false` | Switcher far right, D | Mobile exposes disabled desktop feature. Align availability policy | B entry; S attempt |
| `/`, hangman | Daily Word Hunt; guess letters | Next word, result/streak | Word Hunt | Third daily card, D | No bottom destination; missing puzzle can remain loading; use Practice directory | S active game |
| `/`, mentor | Birbal chat; Send | Quick prompts, voice, close | Ask Birbal or floating chat | Unlabelled avatar, M | Avatar covers Send; narrow composer; expired click silently returns Home; #4/#7 | B |
| `/`, profile | Account and module summaries; Edit Profile | RC/Vocab/Speed/sectional details, subscription, logout, Home | Profile | Profile, E | ~2,650px body; top link only 23px high; module summaries deep; separate Progress | B entry |
| `/?view=cat` and `&free=1` | CAT test catalogue / sectional flow; choose a test | Instructions, diagnosis, result, exit | CAT, sidebar; Home hero | Home hero, M; no intended bottom CAT tab | Nested horizontal padding leaves narrow content; separate mobile test renderer; #2/#5 | B empty catalogue; S populated test |

Only the CAT view query is explicitly restored by root search-parameter handling. Do not describe `/?view=vocab` or `/?view=speed` as working deep links. Daily Workout at root is **not** the standalone `/workout` implementation.

### All remaining App Router pages

| Route | Purpose / primary CTA; secondary actions | Desktop reach | Mobile reach / discovery | Scroll, hidden controls, states and proposed treatment | Coverage |
|---|---|---|---|---|---|
| `/daily-challenge` | Today's RC; Start Today's RC; Previous RCs, Analytics, Dashboard | Home daily card | Same card, D from Home / E once reached | Start y=753 at 390; failure replaces navigation with message. Compact entry + retry | B |
| `/daily-challenge/instructions` | Read rules; Start Challenge; Back to Arena | Previous CTA | Same, M | Start y=1,019; duplicate scoring explanation and 40px padding. Short checklist | B |
| `/daily-challenge/test` | Timed RC; select answers/submit; numbered palette, previous/clear/next | Instructions | Same, M | Passage precedes questions; clipped Next at narrow widths; no consistent recovery/resume. #3/#5/#6 | B fixture attempt |
| `/daily-challenge/result?attemptId=…` | Result; diagnosis and detailed review; Arena/history return | Submission | Same, M | Integrated collapsible diagnosis/review is helpful; missing-ID/error route rendered; populated sections traced | B error; S populated |
| `/detailed-review?attemptId=…` | Detailed Daily RC review; question/passage tabs | Review flow / saved link | Same, M within review | Shared review workspace; no shared global mobile shell; retain explicit return and next activity | B missing-ID; S populated |
| `/cognition-diagnosis?attemptId=…` | Cognitive diagnosis | Result / saved link | Same, M within review | Long explanatory state; shared navigation and selected-question context needed | B missing-ID; S populated |
| `/rc-history` | Daily RC attempt history; open attempt; Back | Daily RC/history links | Through RC area, D globally | Large title; empty state present; preserve identity as Daily RC History vs generated RC History | B empty |
| `/rc-session/[attemptId]` | Saved Daily RC result/review | History attempt | Same, M | Reuses DailyRCResult; error links to history. Keep URL-backed review | B invalid-ID; S populated |
| `/arena/result/[attemptId]` | Saved sectional result; diagnosis; exit to CAT | Sectional history/result links | Same, D globally | Missing attempt remains “Loading Result…”; add not-found/error/retry | B invalid-ID |
| `/birbal-v2` | Current editorial decoder; scan/upload/analyze; History | Home editorial card | Deep Home card, D | Upload section below large hero (~y=668 at 390); Analyze/History only, no Home. #2 | B upload entry |
| `/birbal-v2/[id]` | Redirect to saved editorial `?session=id` | Saved URL | Same, M with link | Route redirect, no independent UI. Preserve return location | S |
| `/history` | Editorial session history; reopen analysis | Decoder History | Decoder History, D globally | Analyze/History navigation only; failed request can resemble empty history; add recovery/Home | B empty/error fixture |
| `/birbal-editorial-decoder` | Older parallel editorial implementation; upload/analyze | No current main entry found | H | Similar large upload hero, duplicate experience. Redirect or explicitly retire after dependency check | B entry |
| `/boot-camp` | 50-day calendar; enter/continue day; trainer chat, analytics, Home | Sidebar + Home card | Home card, M | Before Oct 1, no available daily mission; currently promoted above free activities. Keep calendar, avoid primary activation placement before availability | B upcoming fixture; S service |
| `/boot-camp/analytics` | Overall training analytics; section tabs; navigation | Boot Camp link | Same, M | Existing loading/error/retry model is better than older modules; populated charts need fixture review | B error; S populated |
| `/boot-camp/day/1` | Explicit Day 1 session route | Calendar | Same, M | Warm-up → RC1–3 → VA with review; saved session architecture supports resume | S |
| `/boot-camp/day/[day]` | Other training days | Calendar | Same, M | Availability varies by date/content/access; mobile review uses fixed action footer; validate 320px and keyboard | S |
| `/boot-camp/day/1/report` | Explicit Day 1 report; debrief/analytics; trainer, overall analytics, calendar | Completion/calendar | Same, M | Clear saved report and return links; long analysis; preserve strengths | S |
| `/boot-camp/day/[day]/report` | Other day reports | Completion/calendar | Same, M | Same shared report components; adaptive mission link when appropriate | S |
| `/inbox` | Messages/recommendations; open message/action | Header Inbox | Header Inbox, E | Independent mobile detail/filter UI; retries, pagination, pending states already present; not a full feature directory | B error; S populated |
| `/pricing` | Plans/coupon/checkout; purchase; Back Home | Premium and locks | Practice lock, Home offer, Profile, M | ~4,235px body; first six-month CTA y=2,032 in fixture. Preserve prior activity through checkout | B; no purchase |
| `/payment-success` | Success message; automatic Home redirect after 2.5s | Payment flow | Same, M | Does not restore selected activity; add verified-access state and explicit Continue | S |
| `/login` | Email/password or Google login; signup | Public navigation | Same, E | 50px inputs/button; form fits 390 × 844. Forgot password is a span, not recovery | B form; S authentication |
| `/signup` | Email/Google signup; login | Public CTA | Same, E | Confirmation alert then login; no persistent check-email/resend step here. #10 | B form; S authentication |
| `/welcome` | Name/exam/year/phone/consent wizard; continue | Post-authentication | Same, E but mandatory steps | Trial setup and downstream messaging can delay arrival; no robust inline save/error state | B first step; S later/save |
| `/preview` | Public marketing landing; Start Free Trial; external contact/navigation | Guest root redirect | Same, E | Long marketing page is separate from dashboard; simplify path to signup, preserve intent | B entry |
| `/preview-ad` | Alias of marketing landing | Campaign/direct link | Same, M | Same implementation as preview; avoid treating as separate learning module | S alias |
| `/preview/pricing` | Public plan presentation; login | Public nav/link | Same, M | Separate pricing implementation; ensure consistent entitlements and return intent | S |
| `/about` | Public information | Public links | Same, M | Low activation priority; no authenticated navigation responsibility | S |
| `/contact` | Public contact information | Public links | Same, M | Keep support reachable from recovery states; detailed mobile rendering not verified | S |
| `/workout` | Legacy timed workout demonstration | No main navigation entry found | H | Hard-coded passage then “Vocab section coming next”; no actual completed learning journey. Do not link it as Daily Workout | B |
| `/hangman` | Static puzzle implementation | No main navigation entry found | H | Uses first bundled puzzle rather than current daily flow. Consolidate/retire | S |
| `/rc/drill` | Placeholder RC mini-test | No main navigation entry found | H | Both modes lead to placeholder; Finish points to nonexistent `/rc/profile`. Redirect/retire | B entry; S finish |
| `/rc-session/test` | Diagnostic page: “It works.” | No main entry found | H | Not a student review. Remove from public product surface / guard | B |
| `/result-preview` | Hard-coded sectional result preview | No main entry found | H | Diagnosis/Exit callbacks are no-ops. Guard diagnostic surface | S |
| `/test-diagnosis` | Hard-coded test diagnosis | No main entry found | H | Server reads a fixed test ID and supplies sample metrics. Not a student workflow | S; not requested from server |
| `/birbal-test` | Birbal API testing UI | No main entry found | H | Developer utility, not mentor entry point | S |
| `/shadow-test` | Precision shadow drill test utility | No main entry found | H | Developer utility, not Precision Training | S |

Additional user-facing handler: `/auth/callback` exchanges an OAuth code and redirects to `/welcome` with `next/free`. Real provider/session handoff was not verified; the handler has no visible exchange-error recovery. API endpoints, sitemap/robots and non-App-Router files are not additional student pages. `cat-arena/result-preview/page.jsx` lies outside `app`, so it does not create an App Router route.

### Feature/component inventory beyond route names

- **Dissect Mode:** no current source match for a separately named “Dissect” feature. The closest active equivalent is RC → Paste your passage → paragraph explanations and checks (`MentorView`, `RCView`). Do not invent a standalone destination; confirm naming before IA implementation.
- **RC Generator / Practice:** one RC workflow, not two unrelated primary modules. `RCView` owns its own generation state. The Home generator CTA also calls root `startAdaptiveRC`, whose state is not passed to `RCView`; this can produce a request without presenting its result. Treat as a source-supported P2 wiring defect to reproduce with generation fixtures.
- **Speed Gym / Speed Drill:** one entry with a long introduction followed by automatic generation, plus Speed Profile. A failed generation sets an unrendered `intro` state and leaves the activity blank.
- **Vocabulary:** WordBank, Vocab Drills, Learn, Profile, manual lookup/add/enrichment, `WordDrawer`, lesson/test/result. Empty-bank revision has an enrichment threshold; offer an immediate beginner lesson as the empty-state action.
- **Progress:** dashboard `ReadingProfile`/`BirbalCoachReport`, account `ProfileView`, `RCProfile`/`PlanTab`, `RCHistory`, `SpeedDashboard`, `VocabProfile`, Workout Analytics/History/Performance, Daily RC Analytics, CAT analytics and diagnosis, Boot Camp analytics. There is no unified `/analytics` route.
- **Competition:** `LeaderboardSection` embeds Daily RC, Workout, Word Hunt and Weekly Challenge tabs. Streaks are dashboard/module indicators, not a dedicated route. They are deep Home content, not persistent destinations.
- **Assessment/review:** `WorkoutEngine`, `WorkoutShell`, `WorkoutReport`, `DetailedSolutions`; `RCExperience`; shared `review/DetailedRCReview`; DailyRCResult/diagnosis; sectional V2 container/test, `MobileRCSectional`, palette and submit modal; Boot Camp activity/review/report/chat components.
- **Discovery/onboarding:** public preview, auth screens, welcome wizard, optional Driver product tour, dashboard feature cards, floating Birbal, Inbox recommendations. `todayMission` is calculated in `ShadowHomeView` but not rendered as the main mission UI.
- **Global states:** `TenantProvider` loading/access errors, capability guard, entitlement checks; per-component loading/errors. No route-specific `loading`, `error` or `not-found` files were found in the page inventory. Do not confuse module recovery with a comprehensive application-wide boundary.

## 4. Top 10 mobile problems

Complexity is an estimate for implementation plus focused validation, not a delivery commitment. S ≈ 0.5–2 days; M ≈ 3–7 days; L ≈ 1–3 weeks. Shared work should not be added twice.

| # / priority | Exact problem and evidence | Why it matters | Recommended solution | Complexity |
|---|---|---|---|---|
| **1 / P1** | Home free actions buried; `ShadowHomeView` renders Header → TestSeriesHero → BootCampHomeCard → TodayActivity. 390px start positions 3,249/3,586. Workout start then y=1,604; Speed y=1,956 | Student may perceive a sales/statistics screen rather than an immediately usable learning product | First-screen available mission and one Start/Resume; move test-series detail, mock interface, plan promotion, boards and long instructions behind compact links/disclosures | M |
| **2 / P1** | `app/page.js:955` omits capabilities passed to `MobileBottomNav`; at 800px root `<900` sidebar rule and `md:hidden` mobile rule both hide navigation. Separate routes lack root shell | Missing CAT shortcut, no full feature map, no consistent cross-module movement | Repair prop/breakpoint, then shared mobile shell with Practice directory and More drawer; include named Home on editorial/history | S repair; M shell |
| **3 / P1** | `daily-challenge/test/page.jsx` passage and questions stack; footer at ~line 1069 has three nonwrapping actions. Next x=323,w=90 at 320/360/375/390; synthetic 490-word passage produces ~3,946px body at 390 | Timed task hides questions and navigation, repeated passage/question scrolling consumes exam time | Mobile Passage/Questions control, remembered passage scroll, compact persistent timer and reachable footer; preserve palette and accessible submit | M |
| **4 / P1** | `BirbalFloatingButton` sets mobile view to mentor but leaves `chatOpen=false`; button remains mounted at bottom-right. Send center hit test returns avatar. Composer also exceeds 320px | Help surface cannot reliably send; tapping Send appears to do nothing | Hide launcher in mentor view; dedicated bounded chat screen; shrinkable input; keyboard-aware viewport; one visible send/close | S + device check |
| **5 / P1** | Root view state is not URL/history-backed; body scroll persists (Workout opens with body scrollTop=968). `mainRef.scrollTop=0` targets the wrong scroller and only some views. Home click during active workout unmounts it without prompt | Disorientation, accidental lost work, unreliable Back/reload | Central navigation and scroll/focus policy; URL-backed destinations; intentional assessment exit; durable drafts/resume where product allows | S scroll; L persistence |
| **6 / P1** | `DailyWorkoutFlow:54–59` returns on failed load without leaving `building`; missing session does likewise. `WorkoutEngine:185` logs save failure without student recovery. Speed generation failure sets an unrendered `intro` state, leaving blank content. Missing sectional result similarly stays loading | Student waits indefinitely or believes unsaved work was retained | Explicit loading/error/empty/saving/saved states, retry and safe navigation; retain answers until confirmed save; distinguish content absent from network failure | M |
| **7 / P1** | `PremiumFeatures` and mobile Birbal call `setView` directly; root locked-view effect resets Home. Expired fixtures reproduce silent no-op; bottom Practice instead sends pricing. Premium sales remain for premium B2C users | Inconsistent locks look like broken features; paid user messaging is confusing | One entitlement-aware action helper; named lock reason, free alternative and upgrade/return intent; hide irrelevant upgrade promotion | S–M |
| **8 / P1** | `TabGroup.js` inline-flex has no constrained overflow/wrap; Vocab Profile is cut off at 320. Workout TabsList inherits `justify-center`: Start x=-39 at 320, -4 at 390. Practice switcher has 390px minimum total child widths | Features exist in DOM but cannot be discovered/selected comfortably | Start-aligned contained scrolling with edge cues or responsive select; avoid multi-line tab labels; unify active semantics and availability flags | S–M |
| **9 / P1** | Completed `WorkoutReport` offers Overview/Performance/Section Analysis/Insights/Solutions but no recommended next activity. “Continue Workout” Home text leads to “Attempt Exhausted” for already-completed workouts | First success does not convert naturally into second success; completion feels like a stop | Report: success summary, review one mistake, then one available next activity. Completed Home card should say View Report | M |
| **10 / P1** | Login's Forgot password is a `<span>` (`login/page.jsx:117`). Signup uses alert + login for confirmation. `welcome.finishProfile` throws errors without inline recovery and awaits optional WhatsApp enrollment/welcome email before final routing | Authentication/onboarding interruptions prevent reaching learning and frustrate return visits | Working recovery/confirmation routes, resend and progress states; resilient idempotent profile save; notification delivery separated from reaching dashboard | M |

### Additional prioritized findings

| ID / priority | Finding | Action |
|---|---|---|
| A1 / P2 | Progress is distributed; account profile uses local-storage vocab/sectional counts alongside DB RC statistics (`ProfileView`). Device changes can change what students see | Unified Progress with explicit sources, consistent saved data and module links |
| A2 / P2 | New dashboard shows Reading IQ 0, accuracy 0%, speed 0 WPM; “Unlock” upsell visible for premium B2C fixtures | “Complete one activity to establish your baseline”; entitlement-aware copy |
| A3 / P2 | Daily RC entry failure has no Retry/Home; editorial history suppresses response failure into empty array; Weekly Challenge keeps loading on failed responses | Use the Inbox/Boot Camp explicit-recovery pattern across older modules |
| A4 / P2 | Daily RC flag icon has no handler or accessible label. Some cards are clickable divs; generic tabs lack selected semantics; nested Link/button elements appear in instructions | Semantic link/button controls, meaningful status and usable focus; remove nonfunctional affordances |
| A5 / P2 | Several key controls under the project's proposed 44px minimum: Daily Home starts 36px, Daily RC entry link 28px, profile Back 23px, quick prompts ~29px | Adopt consistent 44–48px primary touch target policy; validate spacing and zoom |
| A6 / P2 | Word drawer uses fixed h-screen and z=50 beneath root mobile nav z=1000; no dialog role/focus containment in its source | Shared accessible drawer/dialog primitive, safe viewport height and reserved actions |
| A7 / P2 | Legacy/demo routes remain addressable, including placeholder `/workout`, `/rc/drill` and nonexistent `/rc/profile` target | Audit inbound links, redirect obsolete product routes, guard/remove diagnostics |
| A8 / P2 | Main client entry statically imports many major feature graphs; dashboard performs overlapping profile/context/coach requests; vocabulary fetches full banks | Lazy-load nonactive modules, consolidate overview data, paginate banks and defer secondary content |
| A9 / P2 | Root adaptive-generation request and child RC generation state are separate; Home CTA can perform work without showing its result | Route to a single generator owner with explicit intent and loading/result state |
| A10 / P2 | Boot Camp is advertised above free practice while the current calendar is upcoming; CLAT fixture also sees this CAT/VARC-oriented card | Show only an appropriate available mission; present upcoming programs as secondary discovery |
| A11 / P3 | Oversized headings, repeated explanatory cards, motion and decorative shadows increase density | Reduce decoration after structural fixes; respect reduced motion consistently |

## 5. Desktop versus mobile navigation and functionality

| Feature | Desktop | Mobile | Problem / severity | Recommended solution |
|---|---|---|---|---|
| Core navigation | Sidebar names most modules | Three bottom destinations, no complete menu | P1: loss of feature map; 768–899px gap | Shared shell + More + one breakpoint |
| Workout | One sidebar click | Deep dashboard card | P1: discoverability and scroll | Mission + Practice directory |
| RC | Direct RC entry | Practice implicitly means RC | P2: ambiguous label | Practice hub, then RC modes |
| Vocab/Speed/Precision | Direct sidebar entries | Secondary horizontal switcher | P1: hidden/clipped choices | Directory + accessible module switcher |
| Grammar | Flag hides sidebar item | Switcher exposes it | P2: availability mismatch | Single route registry/flag policy |
| CAT sectionals | Direct CAT item | Home promotion; missing CAT tab | P1: lost shortcut | Repair now; group under Practice later |
| Daily RC | Home card; separate page | Same but much greater vertical depth | P1: delayed first free task | Available daily mission |
| Birbal | Sidebar and larger overlay | Avatar opens inline view and covers Send | P1: functional loss | Dedicated mobile mentor destination |
| Editorial | Home card, Analyze/History | Deep card, no shared Home | P1: navigation dead-end feeling | Practice/Birbal directory and shared return |
| Progress | Sidebar Profile plus module tabs | Profile tab; deeply nested module details | P2: no unified outcome view | Progress hub |
| Leaderboards/streaks | Wider grouped content | Deep Home sections; tabs | P2: poor discovery, excess Home length | Progress/More links, compact Home summary |
| Inbox | Header button | Header button, readable independent flow | Existing positive; keep | Retain shared header shortcut |
| Boot Camp | Sidebar + card; multi-panel reviews | Card/calendar, stacked review and fixed action footer | P2: available-state hierarchy; populated mobile review still to validate | Resume-first card + calendar secondary |
| Account/subscription | Profile / Premium | Profile, offers and lock redirects | P1 inconsistent locks; P2 long pricing | More → Account/Subscription, preserve intent |

A drawer alone would restore a feature list but would still hide frequent actions. Replacing the bottom bar without changing the dashboard would leave the biggest activation problem intact.

## 6. Scroll and responsive-layout findings

### Measured CTA offsets, pixels from top

All measurements use 844px height. CAT fixture has no completed activities; backend-dependent overview sections are empty or explicit failure fixtures. Name length, live content and entitlements can shift positions.

| Width | Home Start Challenge | Home Start Workout | Workout actual Start | Speed first Start | Home body height |
|---|---:|---:|---:|---:|---:|
| 320 | 3,617 | 3,978 | 1,880 | 2,259 | 10,396 |
| 360 | 3,405 | 3,766 | 1,764 | 2,019 | 9,928 |
| 375 | 3,341 | 3,702 | 1,656 | 1,998 | 9,782 |
| 390 | 3,249 | 3,586 | 1,604 | 1,956 | 9,510 |
| 414 | 3,160 | 3,497 | 1,556 | 1,851 | 9,229 |

At 390, Challenge's origin is 3.85 viewport heights down. To fully reveal its 36px button above the bottom nav requires approximately **2,505px of scroll**, about three viewport heights. Workout's equivalent is about 2,842px. These are offsets, not a measured number of thumb swipes. **Do not claim there are no meaningful controls before them:** Product Tour, navigation, test-series CTA and Boot Camp appear earlier.

Non-CAT reduces the CAT marketing block but does not fully solve hierarchy: CLAT fixture Start Workout is y=1,248; Home body is 7,142px at 390. CAT desktop at 1440 has daily starts around y=1,880, but a sidebar provides a direct Workout entry.

Other observations:

- 390px Workout report overview is approximately 3,033px high; Insights/Solutions are horizontally offscreen in the report tab row. Unlike generic TabGroup, this row supports overflow scrolling. Add a cue and put review/next action near the summary.
- Daily RC's synthetic 490-word passage produced ~3,946px total height at 390 and ~4,930px at 320. Actual passages will vary. The single-column passage followed by questions, 18px text and ~38.7px line spacing make repeated reference expensive.
- RC Generator has two navigation rows, a large explanatory block and configuration before Generate; Speed has explanation, five instruction rows, formulas and an example before Start.
- Pricing's ~4,235px fixture page and dashboard's full plan promotion are inappropriate prerequisites for basic learning discovery, though detailed comparison can remain on a dedicated purchase screen.
- `html,body { height:100%; overflow-x:hidden }` creates a body scroller and masks overflowing children. A passing document-width check is **not** proof that controls fit.
- The floating assistant occupies reading/action space even on ordinary feature pages. It is not a substitute for visible, named navigation.

Collapse repeated “how it works,” score formulas, mock interfaces and detailed statistics. Preserve passage readability; do not solve scroll by shrinking all educational text.

## 7. Discoverability, states, accessibility and performance

### Discoverability summary

Easy: Home, Profile, initial Practice entry, Inbox once on root. Moderate: Vocab/Speed after discovering Practice; CAT via the prominent Home promotion; Birbal if the avatar is recognized; Boot Camp card. Difficult: free Daily RC/Workout from the CAT Home scroll, Precision/Grammar in the switcher, editorial, Word Hunt, weekly competition, most analytics. Effectively hidden: obsolete/demo routes and a separately named Dissect Mode that does not exist in current source.

The optional Product Tour highlights existing dashboard cards, including offscreen cards. It cannot replace a useful first screen or stable navigation, and its completion does not start a learning activity. Use contextual explanation attached to the first task rather than making a tour a prerequisite.

### Important loading, empty, error and locked states

| Area | Current state behavior | Priority / recommendation |
|---|---|---|
| Tenant/auth bootstrap | Full-screen portal loading; root returns null while auth loads; denied tenant has explanation/link | P2: avoid blank intermediate screen; network rejection must resolve into retry |
| Workout | Animated five-step preparation adds 5 × 500ms even after data arrives; load error stays building; already attempted says Attempt Exhausted | P1: real progress/retry; completed report + next task |
| Daily RC | Loading screen; load failure only message; missing/review errors vary | P1/P2: keep Home/Back and Retry available |
| RC/Speed generation | Pending labels; Speed alert then blank activity on failure (`intro` has no render branch); independent generation flows | P1 for blank Speed failure: inline retry preserving settings; maintain one start action |
| Vocabulary | Empty bank + enrichment threshold; active practice separate under Learn/Drills | P2: one beginner lesson action and distinguish no words from fetch failure |
| Workout analytics | Requires at least two workouts | P2: link directly to available next workout/review, avoid dead text |
| Daily analytics | Skeleton and explanatory empty state with Start Today's RC; injected 503 also displays that empty state | P2: keep useful empty CTA, but distinguish failed fetch from no activity |
| Profile | Returns null before profile is available | P2: skeleton/error instead of blank module |
| Boot Camp / Inbox | Explicit requests, busy/error handling, retry patterns; date/access restrictions | Positive patterns to reuse; test locked/unavailable wording against actual account |
| Expired practice | Sidebar/bottom lock navigates pricing; Home cards/avatar silently bounce | P1: uniform lock explanation and free alternative |
| Sectional result | Missing attempt remains Loading Result | P1 recovery defect; show not-found and return path |

### Accessibility and mobile-browser considerations

This was a targeted accessibility inspection, not a full conformance audit or assistive-technology certification.

- Auth forms have visible labels and 50px fields; workout answer cards have a minimum 56px height and focus styles. Boot Camp uses labelled dialogs and keyboard handling; Inbox includes recovery feedback. Preserve these strengths.
- Clickable Home tool divs lack native keyboard/link semantics. Give them real links/buttons. Mobile navigation indicates current view visually but lacks an explicit `aria-current` state.
- Generic TabGroup buttons do not expose tab selection; Workout's Radix controls and Daily RC's explicit tabs are better foundations. Ensure focus remains visible when horizontal scrolling.
- Daily RC flag is a nonfunctional icon control; remove it or implement marked state with an accessible name.
- Profile edit modal and WordDrawer need systematic focus-entry/trap/return and background-inert validation. The WordDrawer source does not implement these patterns.
- Auth inputs use 14px text; evaluate at 16px on physical iOS to reduce focus-zoom risk. Browser keyboard, safe-area and rotating-device behavior remain unverified.
- Slate-500 text on slate-900 is used for small metadata. The opaque pair is approximately 3.7:1 by color calculation, so normal-size text needs higher contrast; gradients/opacity require element-specific checking. Avoid low-contrast disabled-looking text for discoverable paid actions.
- Fixed/sticky controls use several different offsets, `100vh`, and z-index systems. Standardize ownership of viewport height and safe-area padding. At 320 Birbal Send extends to x=351 and below the bottom bar; the shorter viewport needs real keyboard validation.
- A 44–48px target is the proposed product touch-size policy here, not a claim that every smaller control automatically fails a particular standard.

### Performance investigation

Confirmed source findings, with production effects still to measure:

1. **P2, initial JavaScript scope:** `app/page.js` statically imports RC, vocabulary, sectional, chat, profile and other feature trees. Recharts/Nivo, animation and analytics dependencies are present in the project. No production bundle measurement was made, so package presence is not proof that every dependency ships on Home. Measure route chunks, then dynamically import unused feature screens and heavy charts.
2. **P2, dashboard fetching:** multiple effects query profiles separately, call Birbal coach/context, load streaks, then check daily attempts sequentially. TenantProvider requests public context then authenticated context, and subscribes to auth changes. Deduplicate bootstrap/summary work and cache appropriately; defer leaderboards and coach detail until needed.
3. **P2, data growth:** VocabLab selects all master vocabulary and user words; RCProfile and ProfileView select question histories; Birbal context/coach select broad histories. Bound fields/date ranges and aggregate server-side. **No slow Supabase query is proven** without row counts, timings and query plans.
4. **P2, avoidable perceived wait:** Workout deliberately adds 2.5 seconds to preparation. Remove artificial delays; keep honest skeletons and show ready when data is ready.
5. **P2, image payload:** `public/birbal.png` is ~1.06MB and used as a small raw `<img>` in BootCampShell. Floating Next Image uses `fill` without a small rendered-size hint; inspected markup advertises `sizes="100vw"` for a ~64px avatar. Supply appropriately sized assets and hints. Public marketing videos are approximately 6.8–12.7MB; audit loading policy separately before claiming initial transfer cost.
6. **P2, main-thread/render work:** greeting updates each minute; root view state owns many feature states; weekly board polls every 30s and updates a countdown each second while mounted. Measure real interactions before adding broad memoization. Defer nonvisible sections and isolate active timers.
7. **P2, layout stability:** profile/coach/credit content arrives independently; sidebar depends on post-mount width detection. Reserve space and use a consistent CSS layout boundary. These are layout-shift risks; no CLS number was measured.
8. System fonts are configured in globals, so there is no evidenced custom-font download bottleneck in the audited shell. No hydration crash appeared in the main verified and shortened-workout fixture runs; this does not cover every data-dependent route.

Do not use local Next dev compile times, blocked analytics requests, or synthetic API responses as production speed benchmarks. Follow-up performance acceptance should use a production build, cold/warm runs, throttled network/CPU, real asset sizes and route-specific request counts.

## 8. Student journey: first ten minutes and beyond

Tap counts below exclude typing and optional exploration. They describe visible controls/code paths, not measured population behavior. Scroll counts use the 844px test height. Completing a stated 25–30 minute Workout is not a sensible first-ten-minute success target.

| Step | What student sees / can do | Obvious next action, taps and scroll | Ambiguity / dead end | Better pattern |
|---|---|---|---|---|
| Public arrival | Marketing, free-trial CTA | One CTA to signup; landing position varies | Offer versus daily practice unclear | Preserve chosen task through auth |
| Signup | Email/password + Google | Fill 2 fields, Create; email context switch then login for email route | Confirmation alert disappears; no persistent resend flow | Check-email screen with return/resend |
| Login | Form, Google, Forgot password text | Login → Welcome | Forgot password cannot be clicked | Actual recovery |
| Welcome | Profile wizard: name, exam/year, phone/consent | Multiple form steps, final save | Notification request failures can interrupt arrival | Essential profile only, explicit save/retry, then first task |
| Dashboard: “what now?” | Greeting, 0 IQ/accuracy/speed/streak, promotion; bottom Home/Practice/Profile | Tour or Practice are initially visible; free Workout button requires ~3.4 viewport-height scroll to reveal | No single recommended free success; upcoming Boot Camp competes | One eligible mission, time estimate, Start |
| Enter Workout | Heading/tabs + another hero and module cards | Home Start Workout + actual Start = 2 taps; own CTA y=1,604 from clean entry | Retained scroll can land midway; network failure may spin forever | Compact briefing, immediate Start/Resume |
| Workout speed → vocab → RC1 → RC2 → micro | Timer, one question/options, section controls | Answer taps plus Submit Section; speed advances by timer | Global Home can discard active session; long RC pane nested scroll | Deliberate exit/resume; clear module progress |
| Complete / review | Score report, horizontally scrolling report tabs | Solutions tab, section card, review: typically 2 taps from overview | No prominent next activity; review tab offscreen | Review one error and Continue recommendation |
| Return Home | Existing bottom Home | 1 tap | Old view state/history/scroll handling varies; completed card says Continue | Stable Home top/restore policy; View Report label |
| Discover Daily RC | Home daily card below promotions | Start Challenge → Start Today's RC → Start Challenge: 3 taps to timed route, plus Home/instructions scrolling | Challenge/Arena naming, repeated briefing | Mission CTA → compact ready sheet → start |
| Attempt Daily RC | Fixed timer, progress/Submit, full passage, questions below | Passage scroll then options; palette or Next | At 320 Next entirely clipped; submit far from reading position | Passage/Question switch, usable footer |
| Daily RC review | Result with diagnosis and review sections | Open relevant section / choose question | No stable global Practice route; full successful fixture not exercised | Return + next available activity |
| Vocabulary | Practice opens RC; Vocab in second row | 2 taps from Home; direct Home card is deep | WordBank not an immediate lesson; Profile tab clipped | Practice directory → Learn today |
| Speed | Practice → Speed, then long tutorial | 2 navigation taps + Start Drill; start ~2.3 viewport heights down | Formulas before participation; failed generation blanks activity | One briefing/start with optional explanation |
| Sectional | No bottom CAT tab | Home → Explore Test Series → test selection → instruction/start | Feature available but shortcut missing; actual catalogue requires data | Named Sectional Tests card under Practice |
| Progress | Profile or per-module analytics | Profile 1 tap; Workout Analytics requires entering Workout then tab; other paths vary | “Profile” mixes account and progress; no unified “did I improve?” | Progress overview linking source reports |
| Birbal | Floating avatar | 1 tap to mentor; type then Send | Send covered; expired access no explanation | Named Birbal entry, clear composer/lock |
| Return tomorrow | Dashboard and scattered completion/history states | Re-discover daily action | No consistent second/return task; session views not restorable | Available mission + saved recent review + next-day reminder |

Successful browser sequence completed: Home → Workout → speed answer → vocabulary → RC1 → RC2 → micro → report → Solutions → detailed review → Home → Practice → Speed. One fixture question per workout module was used; it validates transitions and UI, not full-length timing or real save correctness. Daily RC passage/question layout was rendered with synthetic questions; submission/review persistence remains an explicit gap.

## 9. Recommended mobile information architecture

**Use bottom navigation plus a complete More drawer, a real Practice directory, and a mobile-first Home hierarchy.** This extends existing root navigation and feature components; it does not require rewriting every activity at once.

### Persistent navigation

| Destination | Contents / reason |
|---|---|
| **Home** | One available Start/Resume mission, next task, recent completion. Answers what to do now |
| **Practice** | Free Daily Workout; Daily RC when exam permits; RC Generate/Paste; Vocabulary; Speed; Precision; Grammar only when enabled; Sectional Tests when eligible; Word Hunt; Boot Camp availability. Gives a complete named feature map |
| **Progress** | Saved recent results, overall activity/streak summary, links to Workout/RC/Speed/Vocab/Sectional/Boot Camp analytics. Progress is distinct from account settings |
| **Birbal** | Chat with an accessible composer; Editorial Decoder as a named tool/history link. Different mentor capabilities stay explicit |
| **More** | Account/edit/exam, subscription/access, Inbox, leaderboards/weekly competition, help/tour/support, logout. Include an All features link so discovery does not depend on category knowledge |

Home and Practice should never be blanket paywalls. Show each feature's eligibility, estimated duration and lock reason before the student starts. Keep free alternatives available. Apply exam, institute and feature flags from one registry to desktop and mobile.

For active assessments, replace ordinary global navigation with task-specific chrome: timer, progress, passage/question navigation and a deliberate Exit. Explain whether leaving saves a draft or ends the attempt. Restore global navigation on report screens. Daily RC's no-pause policy should remain explicit; implementing resume does not imply resetting its deadline.

### Home order

1. Compact identity/greeting with Inbox/account access.
2. **Today's practice:** one available task with time estimate, Start/Resume, and explanation of why it is recommended. For CAT, the existing 8-minute Daily RC is a better first-ten-minute target than a 30-minute Workout, once its mobile defects are fixed. Offer a short starter task for non-CAT students rather than pretending the full Workout is short.
3. Compact follow-up: Review your last result or the next available task. Show saved/completed state accurately.
4. Small Practice shortcuts; visible All practice link.
5. Compact progress/streak after a baseline exists; “Your first activity creates your baseline” before it does.
6. Secondary Boot Camp availability, test series, competition and relevant upgrade links. Full sales/sample-report content belongs on its dedicated screen.

Do not introduce a separate Today’s Mission tracking system while existing completion state is inconsistent. First derive the recommendation from actual eligibility, availability and saved completion. Boot Camp can become the mission for enrolled/eligible users on an open day; before October 1 it should not displace today's usable practice.

### Options evaluated

- **Bottom navigation only:** insufficient unless Practice exposes all activities; five direct activity tabs still cannot cover the platform.
- **Drawer only:** complete inventory but weak repeat-use access and weak first-action guidance.
- **Bottom navigation + More:** best fit for existing navigation; pair with URL-backed destinations and a shared layout.
- **Mobile dashboard:** necessary alongside navigation; existing desktop promotional composition should not simply stack.
- **Today's Mission:** valuable if actionable, available and short enough; avoid decorative checklists or competing with an inaccessible Boot Camp day.

This ordering uses product relationships and the observed student journey, **not claimed usage rankings**. Revisit destination prominence after valid usage/funnel data is available.

## 10. Recommended fixes by size

### Quick wins: 1–2 day changes each or a tightly scoped batch

- Pass capabilities to mobile nav; unify breakpoint behavior; align Grammar feature flag.
- Hide Birbal launcher when mentor is open; fix composer min-width and Send reachability.
- Make Daily RC footer wrap/reflow; make all question navigation visible at 320px.
- Start-align Workout tabs and constrain generic tabs to a usable scrolling region.
- Correct actual body scroll reset/focus on view change.
- Add Workout load retry, route error return links, completed-card View Report copy; remove the artificial preparation delay.
- Move the existing daily-action section ahead of the large promotion as a first hierarchy improvement; place start actions above their optional instructions.
- Give clickable feature cards native semantics and consistent lock feedback.

### Medium changes: 3–7 days

- Shared mobile shell, feature registry, Practice directory and complete More drawer.
- Mobile Home mission hierarchy and entitlement-aware recommendations.
- Daily RC reading/question navigation and footer redesign.
- Report → review → next-activity flow, consistent saved/error states.
- Password recovery/confirmation, resilient welcome save and return intent.
- Lazy feature loading, dashboard summary consolidation and vocabulary pagination.

### Larger changes: 1–3 weeks

- URL-backed feature navigation and durable attempt drafts/resume across older modules, respecting timers and exam rules.
- Unified Progress backed by consistent saved server data; remove conflicting local-only counts.
- Consolidate legacy routes/duplicate implementations and shared activity/review primitives.
- Cross-browser/real-device assessment, keyboard, accessibility and production performance acceptance matrix.

## 11. Exact implementation order and acceptance gates

1. **Preserve baseline evidence and correct the funnel definition.** Add view/entry/lock/error dimensions while preserving existing event names; define first/second completed activity and time window explicitly.
2. **Repair directly blocked controls:** Birbal overlap/narrow composer; Daily RC footer; clipped tabs. Gate: visible and clickable at all five widths, keyboard reachable, including long labels.
3. **Repair navigation consistency:** capability prop, breakpoint, Grammar flag, real scroll container. Gate: 320–899px always has a deliberate navigation path; new view heading visible; no silent scroll jump.
4. **Repair recovery and locks:** Workout preparation/save, invalid result IDs, expired card actions, working password recovery. Gate: offline/401/402/500/empty each gives a useful action; no indefinite loading; unsaved state explicit.
5. **Reorder Home and activity briefings:** eligible task first, reduce repeated briefings, collapse optional explanations. Gate: one available learning CTA visible at 320 × 568 and 390 × 844; no unearned zero-score judgment; upcoming program secondary.
6. **Protect active attempts:** deliberate exit, preserved draft or explicit no-resume warning as applicable, timer policy. Gate: Home/Back/reload/backgrounding have defined outcomes and do not silently erase answers.
7. **Introduce the shared shell + Practice/More directory and URL state.** Gate: all supported features reachable in at most two discovery taps from the shell; Back/reload restores destination; focused test mode remains deliberate.
8. **Connect completion to review and second activity.** Gate: successful save → visible review/next task, completed Home labels accurate, already-completed tasks not recommended as new.
9. **Consolidate Progress and performance work.** Gate: metrics match saved data across devices; measure production JS/request/timing before and after; avoid regression in first-action time.
10. **Retire diagnostics/legacy entry points; complete real-device and cohort validation.** Gate: supported deep links redirect meaningfully; iOS/Android keyboard and safe areas pass; compare funnel cohorts without claiming causality from raw before/after percentages.

Use the audit fixtures as reproducible examples, not as an exhaustive acceptance suite. Add focused regression coverage for the repaired behavior. No implementation was performed during this audit.

## 12. Files/components likely to change

| Work area | Existing files |
|---|---|
| Navigation, URL state, scroll, availability | `app/page.js`, `app/components/MobileBottomNav.jsx`, `components/PracticeSwitcher.jsx`, `app/layout.js`, `app/globals.css`, `lib/tenant/capabilities.js`, `components/providers/TenantProvider.jsx` |
| Home hierarchy, entitlement, mission | `components/home-v2/ShadowHomeView.jsx`, `Header.jsx`, `TodayActivity.jsx`, `TestSeriesHero.jsx`, `PremiumFeatures.jsx`, `PremiumCTA.jsx`, `LeaderboardSection.jsx`, `ReadingProfile.jsx`, `BirbalCoachReport.jsx`, `components/bootcamp/BootCampHomeCard.jsx` |
| Birbal/mobile overlays | `components/home-v2/BirbalFloatingButton.jsx`, `components/ChatMentor.jsx`, `components/WordDrawer.jsx`, `components/bootcamp/BootCampChat.jsx`, dialog CSS |
| Auth/onboarding | `app/login/page.jsx`, `app/login/login.css`, `app/signup/page.jsx`, `app/welcome/page.jsx`, `app/welcome/welcome.module.css`, `app/auth/callback/route.js` |
| Workout start/save/review | `components/DailyWorkoutContainer.jsx`, `DailyWorkoutFlow.jsx`, `WorkoutEngine.jsx`, `components/assessment/WorkoutShell.jsx`, `WorkoutReport.jsx`, `DetailedSolutions.jsx`, `components/daily/*` |
| Daily RC | `app/daily-challenge/page.jsx`, `instructions/page.jsx`, `test/page.jsx`, `components/DailyRCResult.jsx`, `DailyRcAnalytics.jsx`, `components/review/DetailedRCReview.jsx`, `lib/dailyRc/useReview.js` |
| Practice and progress | `components/RCView.jsx`, `MentorView.jsx`, `RCProfile.jsx`, `RCHistory.jsx`, `PlanTab.jsx`, `VocabLab.jsx`, `VocabProfile.jsx`, `SpeedContainer.jsx`, `SpeedGym.jsx`, `SpeedDashboard.jsx`, `PrecisionTraining.jsx`, `GrammarLab.jsx`, `ProfileView.jsx`, `TabGroup.js`, `components/ui/tabs.tsx`, `components/ui/button.tsx` |
| Sectionals | `cat-arena/CATArenaLandingV2.jsx`, `cat-arena/rc/RCSectionalContainerV2.jsx`, `cat-arena/CATArenaTestViewV2.jsx`, `app/components/MobileRCSectional.jsx`, `cat-arena/components/SubmitModal.jsx`, `app/arena/result/[attemptId]/page.jsx` |
| Standalone navigation / duplicates | `app/birbal-v2/page.jsx`, `app/history/page.jsx`, `app/birbal-editorial-decoder/page.js`, `app/pricing/page.jsx`, `app/payment-success/page.js`, legacy/demo routes listed above |
| Data loading / measurement | `lib/learningAnalytics.js`, `components/PostHogProvider.jsx`, `lib/birbalContext.js`, `app/api/birbal-context/route.js`, `app/api/birbal-coach/route.js`, module fetch layers, relevant public images |

Proposed new responsibilities: shared authenticated mobile shell, centralized feature registry/navigation helper, Practice/Progress destinations, common recovery and accessible overlay primitives. Their final filenames should follow the implementation plan rather than being imposed during this audit.

**Audit conclusion:** a student can plausibly sign up, see a crowded mobile dashboard, miss the free task, encounter an apparently broken action, and leave. The evidence supports prioritizing these activation defects. It does not establish actual abandonment rates. Stop here for review before implementation.
