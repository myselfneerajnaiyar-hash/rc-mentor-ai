# Hyperframes Composition Brief — Auctor Labs

Build the 20-second / 1080×1920 / 30fps storyboard in `brag-plan.md` as a premium, highly refined animated product demo. This is an animated app experience: individual UI labels, panels, cards, controls, cursor and CTA must enter, move, respond and transition one by one. Avoid the existing cinematic-film approach and avoid animating an entire screenshot as a single card.

Use source-grounded app copy from the plan. Recreate the Today, workout-ready, WordBank and Birbal UI with separate DOM elements following the repo's actual component states. Use the captured Today screenshot only to verify the visual design/state. For RC, use the genuine capture in `assets/screens/rc-captured.png` as a clipped/cropped captured screen state limited to visible timer/status/control/header regions; never expose its fixture passage, question wording, answers or analysis. Do not fabricate numbers, question content, results, word counts, responses, or finished workout steps. Today progress value remains precisely `0 of 3 completed today`.

## Composition/timing
Follow the six intervals in the storyboard exactly: Today 0–3s; Workout 3–7s; RC 7–10.5s; Vocabulary 10.5–13.5s; Birbal 13.5–17.2s; Today close 17.2–20s. Use full-canvas composition ID `root`, 1080×1920. Use Hyperframes native timing attributes on media (`data-start`, `data-duration`), and a paused GSAP timeline registered at `window.__timelines.root`. The official installed docs (`hyperframes docs data-attributes`, `hyperframes docs gsap`) specify paused timelines; supported tween properties are opacity, x/y, scale/scaleX/scaleY, rotation, width and height. Prefer opacity/y/scale reveals and short cross-scene transitions, with ease `power2.out` / `power3.out`, 0.28–0.48s entrances, 0.12–0.18s stagger intervals, and gentle 0.97→1 settles. Make all timeline state deterministic when sought. Avoid infinite loops, unsupported CSS/GSAP motion props and relying on ambient browser animation.

## Sound
Use the bundled music in `assets/music.mp3` quietly with a brief fade at both ends; minimal click accents are optional. The bundled vol. 10 cue guide indicates ~110 BPM and strong cues at 15.82s, 18.01s, 18.55s. Optional grid: 3.01, 7.35, 10.38, 13.64, 17.47, 18.55. Prioritize readable holds; voiceover disabled.

## Design
Use ink/navy app surfaces (`#070d1a`, `#0b1425`, `#111d31`), subtle borders (`#2a3c57`), white and muted slate text, app blue/indigo/cyan, and workout orange only within the workout scene. Sans-serif system typography, compact phone UI scale, high text contrast. A quiet centered product shell, no decorative abstraction or marketing title cards.

## Verification and delivery
Run `hyperframes check` in `composition/`, fix all errors. Run `hyperframes preview`, inspect the full sequence and revise if UI elements don't visibly animate independently. Render only after preview review. Export 20 seconds at 1080×1920/30fps with synced music, extract a settled Today-state poster and bake it into frame zero per the Brag delivery instructions. Write `share-copy.txt` and `verification.md` with measured stream duration, resolution, audio/video duration match, sampled-frame review and check results. Keep all output in this folder and don't edit the app or package manifest.
