# Hyperframes brief — Auctor Labs Instagram Reel

Create the `brag-plan.md` storyboard as a 20-second vertical launch film (1080×1920, 30fps). The creative purpose is to make the question “am I actually improving?” feel immediate, then move the viewer into the real Auctor daily workout, RC practice controls and Birbal guidance. This is an editorial product ad, not a dashboard montage.

## Visual / animation contract

- Keep a deep ink/navy field, real Auctor blue/indigo accents, and warm white type. Use local assets only.
- Build the hook from large typography; reveal each phrase as an individual element. Avoid starting on a small dashboard.
- Recreate the ready-state workout from `components/DailyWorkoutFlow.jsx` with individually animated cards and actual CTA. Use a camera-style scale/pan into the real Reading Comprehension card, then match transition into RC.
- The available RC capture in `assets/screens/rc-captured.png` is a browser-test fixture. Reconstruct only source-backed interface labels and the `Submit Test` control; never show fixture passage/question/options/answer/review/score or question numbers. Animate a button press only; show no resulting state or student outcome.
- Use actual default Birbal welcome and prompts from `components/ChatMentor.jsx`; reveal each in turn. Do not make up a reply.
- Finish with supplied lines `Make a little progress, every day.` and `Start your VARC workout.`
- Create seek-safe, paused GSAP timeline registered on `window.__timelines.root`. Official v0.8.109 docs: supported motion properties include opacity, x/y, scale, scaleX/Y, rotation, width, height and visibility; use absolute timeline positions. Use deliberate `power2.out` / `power3.out`, short 0.35–0.6s settles, with readable holds and overlapping scene transitions. No ambient CSS animation or canvas-based screenshot playback.
- Five keyframe stills/contact sheet must be captured and reviewed before final render. Use a draft preview and inspect the whole 20s before rendering final.

## Audio

Use bundled vol-12 track at 0.30 with a short fade in/out. Its bundled Brag cue sheet is `../.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; cue times are hints, not a timing mandate. Sparse CC0 interface clicks, `impactSoft_medium_001.ogg` for the hook, and low-level `card-slide-1.ogg` on the camera move. No narration.

