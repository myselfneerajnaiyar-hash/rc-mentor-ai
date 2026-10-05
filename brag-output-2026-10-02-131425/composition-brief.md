# HyperFrames Composition Brief: Auctor Labs

## Objective
Create a 20-second vertical, premium product demo for Auctor RC / Auctor Labs. Make the real interface feel tactile through deliberate element-level reveals, a visible cursor, actual CTA language, and clean transitions between source-grounded UI states.

## Output
- Composition directory: `brag-output-2026-10-02-131425/composition/`
- Rendered video: `brag-output-2026-10-02-131425/brag.mp4`
- Format: vertical — 1080×1920
- Duration: 20 seconds

## Source Material
- Project root: `C:/Projects/rc-mentor-ai`
- Primary files: `components/home-v2/TodayActivity.jsx`, `components/home-v2/Header.jsx`, `components/home-v2/ShadowHomeView.jsx`, `components/DailyWorkoutFlow.jsx`, `components/RCView.jsx`, `components/MentorView.jsx`, `components/VocabLab.jsx`, `components/ChatMentor.jsx`, `components/mobile/TodayHub.jsx`, `app/globals.css`
- Product name: Auctor RC; requested umbrella branding: Auctor Labs
- Copy that must appear verbatim: “Today’s Activities”, “Daily Workout”, “Start Workout”, “TODAY’S FOCUS”, “Speed Drill”, “Vocabulary Lab”, “Reading Comprehension”, “Micro Skills”, “Paste Your RC Passage”, “WordBank”, “Your personal vocabulary revision queue.”, “Start a Revision Drill →”, “Welcome back! I'm Birbal — your AI Reading Mentor.”, “How to improve inference questions?”, “How should I read RC faster?”
- Local product assets: `public/logo.png`, `public/Birbal avatar.jpeg`
- Local preview limitation: port 3000 serves a generic Next.js starter, not Auctor. Reconstruct only the required screen presentation from inspected app source. Do not include personal data or claim an authenticated live capture.

## Creative Direction
- Tone preset: polished
- Creative direction: highly refined animated SaaS product demo, UI-first and interaction-led
- Interpretation: individually animated controls/cards, short move-in and opacity settles, careful readable holds, no cinematic title cards, no full-screen screenshot animation, no decorative claims.
- Angle: take a viewer through Today, the ready Daily Workout overview, the real empty RC editor state, the existing WordBank revision CTA, and Birbal’s authored greeting and prompts.
- Hook: Today’s heading and activity cards resolve sequentially, ending on “Start Workout”.
- Outro: source-backed home progress cards settle beside Auctor Labs branding.
- Avoid: invented questions, completed steps, generated answers, unsupported queue counts, invented progress values, private/user data, generic SaaS claims.

## Visual Identity
- Background: app Slate 950 `#020617`
- Text: white / Slate 100 with Slate 400 supporting copy
- Accent: source indigo `#4f46e5`, secondary cyan `#0ea5e9`; preserve activity card orange and emerald accents
- Typography: local system UI / Segoe UI, matching `app/globals.css`
- Local imagery: app logo and Birbal avatar only; no stock media

## Storyboard
Use `brag-plan.md` as the creative contract.

1. Today — 3.0s — app shell, heading, Today’s Activities, real activity cards, real Start Workout CTA and visible cursor press.
2. Daily Workout — 4.0s — real TODAY’S FOCUS ready state, source-defined workout cards, CTA press; no fake preparation checkmarks or workout completion.
3. RC — 3.5s — actual RC controls and blank Paste Your RC Passage state; no question or answer.
4. WordBank — 3.0s — actual WordBank heading and conditional revision CTA in its eligible component state; no count assertion.
5. Birbal — 3.7s — actual authored welcome plus two existing suggestion prompts; no generated response.
6. Home / finish — 2.8s — initial progress-card values from source and Auctor Labs lockup.

## Audio
- Audio role: quiet professional support
- Audio arc: restrained local bed throughout, brief clicks for cursor presses, clean fade at the final hold
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music volume: 0.20
- Music cue guidance: bundled cue metadata in `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`. Candidate strong cues: 8.74s for RC focus; 17.47s for home return; optional 18.56s for the settled brand. Natural timing takes priority over cue-locking readable text.
- Audio-reactive treatment: skip; extraction skill files are unavailable offline and motion should stay restrained.
- SFX: use a very small number of low-risk interface clicks for the actual cursor presses. Do not sound fake completion.
- Audio assets: copy local free assets into `composition/assets/` and use relative paths.

## HyperFrames Instructions
Follow the official `hyperframes-core`, `hyperframes-animation`, `hyperframes-keyframes`, `hyperframes-creative`, and `hyperframes-cli` guidance. Animation reference: official GSAP guidance, using registered paused root timeline, `gsap.fromTo`, `power3.out` for entrances, `power2.out` for secondary focus, and `sine.inOut` for smooth scene handoffs. Use a short stagger with a post-reveal hold. All visual elements remain separate DOM nodes. Keep motion seek-safe and deterministic; no timers, network fetches, unseeded random values, or animation of `.clip` lifecycle properties.

Brag owns product selection, source grounding, format, and delivery. HyperFrames owns its composition structure, validation, Studio preview, and rendering workflow. Use the official local CLI: `hyperframes check`, `hyperframes preview --background` / `hyperframes preview --status`, `hyperframes snapshot`, and `hyperframes render`.
