# Auctor Labs — Reel storyboard

**Format:** 20 seconds · 1080×1920 · 30 fps · no voiceover  
**Direction:** cinematic editorial launch film, grounded in the actual Auctor student UI. Large type leads; the interface becomes the proof. The vertical frame moves through meaningful UI targets instead of shrinking a dashboard to fit.

## Shot list

| Time | Picture, text and focal point | Camera / transition | Sound |
|---|---|---|---|
| 0.00–3.00 | Dark ink-blue field. Oversized `CAT is getting closer.` lands in two designed lines; `But are you actually improving?` follows, with `actually improving?` held as the hook. | Headline words reveal in two beats; restrained 1.04× settle, background light shifts behind type. At 2.75s the question slides upward and the workout card enters from below. | Low, warm bundled music bed; one soft impact on the question. |
| 3.00–7.00 | Source-faithful ready-state `Daily Workout`: `TODAY'S FOCUS`, `Daily Workout`, the source intro, four actual cards—Speed Drill, Vocabulary Lab, Reading Comprehension, Micro Skills—and the real `Start Workout` CTA. | Card group assembles in a two-by-two stagger. Cursor presses the real CTA. Other content dims and the camera isolates the actual `Reading Comprehension` card, which enlarges to fill the focal area before match-cutting into RC. No completion state is shown. | Quiet click aligned to CTA. |
| 7.00–13.00 | Source-guided reconstruction of the real Daily Reading Challenge header and control shell: `Daily Reading Challenge`, `READING PASSAGE`, and the real `Submit Test` button. On-screen line: `Practice. Understand. Improve.` The available capture is a browser-test fixture, so no question numbers, passage, answers, score or review are included. | Header, panel and reading label reveal in sequence. Cursor travels to and presses the actual `Submit Test` control; no post-submit result is shown. The source does not include a verified student question/answer/review state. A clean panel transition carries into Birbal. | One restrained UI click on the button press; music continues. |
| 13.00–17.00 | Real Birbal panel identity, welcome copy and all four existing quick prompts: `How to improve inference questions?`, `How should I read RC faster?`, `What is tone detection?`, `How to find main idea quickly?` Supporting line: `Your practice, guided by Birbal.` No generated answer is shown. | Portrait and name reveal, welcome message opens, then prompts enter in a readable stagger. Camera eases back to make room for the CTA transition. | Soft interface tick on the first prompt; no synthetic reply sound. |
| 17.00–20.00 | Auctor Labs end card. `Make a little progress, every day.` and `Start your VARC workout.` Logo stays clear and centered. | Product panel recedes to the ink background; logo and headline settle on one quiet end frame. Hold through 20s. | Music resolves and fades. |

## Content fidelity and source notes

- Workout labels and descriptions come from `components/DailyWorkoutFlow.jsx` ready state. Its preparation state is not used, and no completed step is implied.
- RC page structure and labels come from the real student-facing `components/assessment/RCExperience.jsx`; the available visual capture is `exports/mobile-rc-review/final-state.png`, a browser-test fixture. The composition reconstructs only source-backed labels and controls; it does not imply a particular captured student state. No verified question, answer or review dataset is checked into the project, so the composition contains no question numbers, passage text, answer selection, score or review outcome.
- Birbal welcome and suggestion prompts come from `components/ChatMentor.jsx` default UI. The video shows no generated response.
- Hook and end-card lines are the supplied campaign copy; they make no performance claim.
- Previously completed exports are retained; all new assets and outputs are in this timestamped directory.

## Music cue guidance

Bundled Brag track `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` at 0.30; its bundled cue sheet estimates 109.96 BPM. Optional strong cue near 8.74s; final brand landing near 17.47s. Use timing only when it supports readability. Bed has a short fade at both ends. CC0 Brag SFX: `impactSoft_medium_001.ogg` at 1.42s, `card-slide-1.ogg` on the 6.52s camera move, and sparse `click_001.ogg` accents on button presses.

