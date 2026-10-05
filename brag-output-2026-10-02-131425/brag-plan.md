# Brag Plan: Auctor Labs

## What is this app?
Auctor RC is a reading-practice app with daily activities, a guided workout, passage practice, a vocabulary WordBank, and Birbal as an AI Reading Mentor.

## The angle
Show the actual learning surface as a product in use: one clean Today screen leads into a guided workout, a real empty RC passage workspace, WordBank revision, and Birbal’s built-in welcome. Refined motion gives each control a clear turn. The demo stays grounded in shipped UI and keeps generated questions, answers, metrics, and mentor replies out of frame.

## Hook (first 2–3 seconds)
The Auctor RC shell resolves into “Today”; “Today’s Activities” and its real activity cards lift into place one by one, ending on the real “Start Workout” CTA.

## Key moments (the middle)
- “Start Workout” is clicked, then the Daily Workout overview appears with its real focus label, four module cards, and button.
- The RC workspace reveals its actual tabs and blank “Paste Your RC Passage” state. The demo does not fabricate a passage or question.
- WordBank reveals its revision copy and the existing “Start a Revision Drill” control from its eligible UI state.
- Birbal’s authored welcome and two existing quick prompts appear; no response is generated.

## Outro / punchline
Return to Auctor RC’s home UI, settle the four progress cards using the component’s initial state values (Reading IQ 0, Accuracy 0%, Speed 0 WPM, Streak 0 Days), then hold the Auctor Labs wordmark.

## User flow worth showing
Today’s Activities → Start Workout / Daily Workout overview → RC passage workspace → WordBank revision → Birbal suggestions → Today progress view.

## Tone
- Preset: polished
- Creative direction: highly refined, hands-on SaaS product demo; deliberate cursor-driven interactions and component-level motion
- Interpretation: calm, clear, precise motion with short eases, readable holds, minimal decoration, and no cinematic title cards.

## Format: vertical — 1080×1920
## Duration: 20 seconds

## Visual identity (from the project)
- Background: `#020617` (Slate 950 in the app’s global stylesheet)
- Accent: `#4f46e5` primary indigo; cyan `#0ea5e9` secondary; orange and emerald are used by the actual activity cards
- Text: white / Slate 100; supporting copy uses Slate 400
- Display font: system UI / Segoe UI, matching the global stylesheet
- Body font: system UI / Segoe UI
- Strongest visual element: the real card-based Today Activities panel and the distinct indigo, orange, and emerald activity accents

## Share copy (draft)
Auctor RC brings daily reading practice, vocabulary revision, and Birbal’s coaching into one focused learning flow.

## Audio direction
- Role: quiet professional support
- Music: local Brag bundle, `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: 0.20 volume, short fade-in and fade-out; understated under the UI
- Music cue guidance: bundled cue file `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; use 8.74s for the RC workspace reveal and 17.47s for the return to home if these do not compromise clarity; card text reveals use natural stagger timing and hold afterward.
- Audio-reactive treatment: skip; subtle motion from opacity, position, and focus is sufficient, and the local audio-reactive helper is unavailable while the skill bundle fetch is offline.
- SFX posture: sparse, polished, motion-matched
- Audio-coupled moments: subtle card landings and the two real cursor presses
- Restraint rule: no voiceover, no bright repeated clicks, and no music-driven pulsing.

## Storyboard

### Scene 1 — Today — 3s (0–3s)
Reveal the actual Auctor RC top bar, “Today” heading, “Today’s Activities”, and the three activity cards. The Daily Workout card comes forward last with “Start Workout”. A cursor taps the CTA; give the pressed state a short scale settle before the card-to-card transition.
Sequential/interaction: yes — panel, activity cards, CTA, cursor tap.
Audio intent: quiet bed; one soft click at the press.
Audio-coupled idea: CTA click.
Transition mood: soft slide → Daily Workout.

### Scene 2 — Daily Workout — 4s (3–7s)
Show the ready overview state from `DailyWorkoutFlow`: “TODAY’S FOCUS”, “Daily Workout”, the existing workout intro, four actual module cards (Speed Drill, Vocabulary Lab, Reading Comprehension, Micro Skills), and “Start Workout”. Reveal the card titles and their exact source descriptions in order. At 6.3s, the cursor presses the actual CTA. No preparation checkmarks and no invented completed state. The following scene is a separate RC workspace highlight, not a claim that the workout opened an RC question.
Sequential/interaction: yes — four workout cards and a real CTA press.
Audio intent: restrained music; no completion sound.
Audio-coupled idea: cards enter in a natural, readable stagger; click at CTA press.
Transition mood: clean lateral handoff → RC.

### Scene 3 — RC practice — 3.5s (7–10.5s)
Reveal the real RC controls (“Generate”, “Paste”, “Profile”, “History”), then the blank passage workspace from `MentorView`: “Paste Your RC Passage”, its existing explanation, `Paste your RC passage here...`, and the real zero-word/zero-paragraph blank-state values. Cursor selects “Paste”. No passage, question, answer, or analysis is shown.
Sequential/interaction: yes — controls, blank workspace, cursor selection.
Audio intent: one quiet selection click; no dramatic analysis cue.
Audio-coupled idea: control selection.
Transition mood: soft crossfade → WordBank.

### Scene 4 — Vocabulary — 3s (10.5–13.5s)
Reveal the real “WordBank” label, “Your personal vocabulary revision queue.” heading, the existing explanatory copy, and the “Start a Revision Drill →” CTA from the component’s eligible state. The button receives a subtle focus ring and restrained hover settle. Do not show a fabricated queue count.
Sequential/interaction: yes — label, headline, CTA focus.
Audio intent: quiet and precise.
Audio-coupled idea: low-level CTA focus accent only.
Transition mood: soft panel open → Birbal.

### Scene 5 — Birbal — 3.7s (13.5–17.2s)
Open the real mentor panel with its built-in “Welcome back! I'm Birbal — your AI Reading Mentor.” greeting. Reveal two existing quick prompts in sequence: “How to improve inference questions?” and “How should I read RC faster?” Do not show a generated reply.
Sequential/interaction: yes — panel, greeting, two existing prompts.
Audio intent: one gentle panel reveal; no voice or typing simulation.
Audio-coupled idea: prompts reveal sequentially and then hold.
Transition mood: soft crossfade → Today / progress.

### Scene 6 — Home and Auctor Labs — 2.8s (17.2–20s)
Return to the actual home header and progress-card layout. Reveal the source component’s initial stats (Reading IQ 0, Accuracy 0%, Speed 0 WPM, Streak 0 Days) without counting them upward. Settle the Auctor Labs brand lockup and hold to the final frame.
Sequential/interaction: yes — four progress cards, then brand lockup.
Audio intent: quiet bed fades cleanly; no false success cue.
Audio-coupled idea: final brand hold near the strong cue around 18.56s if the transition permits.
Transition mood: clean final hold.

**Music mood for this video:** warm, steady, restrained. Keep readable content on screen long enough to scan; never use flashes or whip zooms.

## Source and capture notes
- Product material inspected: `components/home-v2/TodayActivity.jsx`, `components/home-v2/Header.jsx`, `components/DailyWorkoutFlow.jsx`, `components/RCView.jsx`, `components/MentorView.jsx`, `components/VocabLab.jsx`, `components/ChatMentor.jsx`, `components/mobile/TodayHub.jsx`, and `components/home-v2/ShadowHomeView.jsx`.
- `localhost:3000` returned a generic Next.js starter screen, not Auctor. No authenticated Auctor capture or user data was available. Composition presentation is therefore reconstructed from the exact app copy, colors, states, and controls in these source components.
- The RC scene is the real blank passage state. It contains no invented learning content.
- Birbal suggestions are existing defaults. No AI response is included.
- The workout cards are static source-defined module labels/descriptions. The workout-running question screen is omitted because its questions are generated from live data and no captured session was available.
- The revision CTA is conditional in source (`revisionReadyCount >= 10`). It is shown only as the existing CTA in its eligible component state, with no count asserted in the demo.
- Progress values shown in the ending are the literal initial values in `ShadowHomeView`/`Header`; there is no count-up animation.
