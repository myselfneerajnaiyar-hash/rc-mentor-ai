# Auctor Labs — product demo brief and storyboard

## Product and source
Auctor is the student-facing CAT VARC practice app shown in `app/page.js`, `components/home-v2/TodayActivity.jsx`, `components/DailyWorkoutFlow.jsx`, `components/assessment/RCExperience.jsx`, `components/VocabLab.jsx`, and `components/ChatMentor.jsx`. This is a product demo of real screens, labels and captured UI states, not a narrative ad.

## Creative direction
Premium SaaS launch motion: an editorial ink-blue app canvas, crisp white typography, restrained cyan/indigo/orange accents, generous negative space and deliberate, element-by-element entrances. Keep the vertical 9:16 framing phone-readable. Use a lightweight chrome phone frame to hold the UI; no marketing interstitials, invented feature claims, fabricated RC questions or answers, and no false workout completion states.

## Runtime and format
20 seconds exactly; 1080 × 1920; 30 fps; no voiceover. Each scene occupies the full composition and hands off with a short opacity/position transition.

## 20-second storyboard

| Time | Screen and precise action | Motion / hold |
|---|---|---|
| 0.00–3.00 | **Today.** App shell and Auctor mark settle in. `Today` and “Your free daily activities. Pick one to begin.” appear. Today's Activities panel rises in; the three real tabs `Daily RC`, `Workout`, `Word Hunt` arrive in order. Daily RC panel appears with `Daily RC Challenge`, `One passage. Build your reading accuracy.`, `8 min`, and actual `Start Challenge` CTA. Show real captured progress `0 of 3 completed today.` | 0.35s shell; heading 0.45s; panel 0.45s; tabs stagger at ~0.16s; CTA receives hover tint / 0.98 press and returns. Keep text settled. |
| 3.00–7.00 | **Daily Workout.** Transition to actual workout-ready state. Reveal `TODAY'S FOCUS`, `Daily Workout`, actual intro, then `Speed Drill`, `Vocabulary Lab`, `Reading Comprehension`, `Micro Skills` cards one by one. Cursor moves to and presses the real `Start Workout` label. | UI elements stagger up with soft opacity/scale settle. CTA press only; do not claim a resulting completed state. Workout preparation steps are explicitly not shown as done. |
| 7.00–10.50 | **RC Practice.** Show the actual captured Daily Reading Challenge interface from `exports/mobile-rc-review/final-state.png`, cropped to its top controls and panel headers so no question, passage, answer, or analysis copy is visible. Reveal timer, `0 Attempted / 4 Remaining`, `Submit Test`, `READING PASSAGE`, and question navigation. Cursor taps the captured, already-active `1` question-navigation control; no answer is selected and no new state is implied. | Captured screenshot comes in as the genuine app state. Separate control labels/highlight rings reveal in sequence; cursor click and selected navigation state remain truthful to the capture. |
| 10.50–13.50 | **Vocabulary.** Recreate the real WordBank top panel: `WordBank`, `Your personal vocabulary revision queue.`, and the real `Start a Revision Drill →` CTA. Supporting stats reveal as actual fields (`Total Words`, `Saved Words`, `Need Enrichment`) without fabricated values. | Label then heading; CTA slides in and gets one subtle focus ring. No user-specific count is fabricated. |
| 13.50–17.20 | **Birbal.** Open the real mentor panel. Show Birbal avatar/name, `Your Personal Reading Mentor`, `Online`, and the four source quick prompts: `How to improve inference questions?`, `How should I read RC faster?`, `What is tone detection?`, `How to find main idea quickly?` | Avatar/header, greeting, then existing prompts one by one. No generated response is shown. |
| 17.20–20.00 | **Today / close.** Return to Today screen, reveal `Today`, the Daily RC Challenge panel and actual `0 of 3 completed today` progress label. Settle on a clean Auctor Labs product view. | Soft return transition; progress UI reveals without changing its captured value; 0.6s quiet end hold. |

## Source state notes
- Today screen and its `0 of 3 completed today` value use the repo's captured `exports/mobile-ux-audit/implemented/today-390x844.png` state.
- RC uses the captured `exports/mobile-rc-review/final-state.png` only as a real screen crop. The source capture is a test state; frame it to avoid showing fixture passage text or options. No answer is selected or invented.
- Workout cards and labels follow the ready state in `components/DailyWorkoutFlow.jsx`. Do not use its building state or fake completed prep rows.
- Vocabulary uses exact labels in `components/VocabLab.jsx`. Do not invent word counts.
- Birbal prompts and greeting use `components/ChatMentor.jsx`; do not fabricate a response.

## Visual system
- Canvas: `#070d1a` / `#0b1425`; elevated panels `#111d31`; fine borders `#2a3c57`.
- Text: `#f5f7fb`; supporting text `#a8b7cc`.
- Brand accents sampled from app captures: blue `#a8ceff`, indigo `#4f46e5`, cyan `#22d3ee`, workout orange `#f97316`.
- System sans-serif, medium-to-bold headings, 1px rules, 14–24px corner radii.

## Audio
Use the bundled `happy-beats-business-moves-vol-10` bed at a restrained level, with a short fade-in/out. Beat grid: 0.27, 0.82, 1.37, 1.90, 2.46, 3.01, 3.55, 4.10, 4.64, 5.19, 5.74, 6.28, 6.82, 7.35, 7.79, 8.22, 8.73, 9.29, 9.83, 10.38, 10.93, 11.47, 12.02, 12.56, 13.11, 13.64, 14.20, 14.73, 15.28, 15.82, 16.38, 16.93, 17.47, 18.01, 18.55, 19.10, 19.64. Treat these as optional: use natural pacing for readable labels. Align scene transitions near 3.01, 7.35, 10.38, 13.64, 17.47; major close reveal near the strong cue at 18.55. Sparse soft UI clicks only on cursor presses. No voice track.

## Share copy
Auctor Labs brings daily CAT VARC practice, vocabulary revision and Birbal guidance into one focused student experience.
