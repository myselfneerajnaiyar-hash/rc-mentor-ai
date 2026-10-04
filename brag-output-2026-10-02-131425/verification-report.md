# Auctor Labs demo — verification

## Deliverables

- `auctor-labs-demo.mp4` — final vertical demo, with the poster baked into frame 0.
- `auctor-labs-demo.jpg` — matching full-resolution poster.
- `share-copy.txt` — short caption.
- `composition/` — Hyperframes source, local GSAP dependency, and local music/SFX/image assets.
- `brag-plan.md` and `composition-brief.md` — storyboard and implementation brief.

## Composition and source fidelity

The six sections follow the requested 0–3s Today, 3–7s Daily Workout, 7–10.5s RC, 10.5–13.5s Vocabulary, 13.5–17.2s Birbal, and 17.2–20s progress finish plan. DOM elements animate individually with the documented GSAP timeline/keyframe workflow. Hyperframes `check` passed with 0 lint/runtime/motion errors, 0 layout issues across 9 samples, and 91/91 text contrast checks passing WCAG AA.

The localhost app route available during inspection was a generic Next starter, so the composition recreates the presentation from Auctor's source components and exact UI copy, rather than claiming a live app capture. The RC state remains the real empty Paste interface and its initial controls/stats; the mentor view uses the built-in greeting and two existing prompt suggestions without fabricating a response. Workout preparation is shown without completion checkmarks. The finish uses the initial progress values from the source home component (0, 0%, 0 WPM, 0 Days); no animated metric change is implied.

## Preview and render

- Hyperframes version: 0.8.109.
- Official preview server: `http://127.0.0.1:3003/#project/composition`; key moments were previewed and corrected before rendering.
- Official render command: `hyperframes render . --quality high --workers 1 --low-memory-mode --output ../auctor-labs-demo-render.mp4`; the verified delivery file is poster-baked from that Hyperframes render.
- The render used Hyperframes' low-memory screenshot profile and completed without memory errors.
- Before the poster bake, the official render was 4.7 MB and Hyperframes reported a 20.0s video. The poster bake replaced only frame 0 and copied audio unchanged.

## Final MP4 checks

`ffprobe` on the final file reports:

- H.264 video, 1080×1920, 9:16, 30 fps, 600 frames, 20.000 seconds.
- AAC stereo audio, 48 kHz, start time 0.000 seconds, duration 20.000 seconds.
- Video start time 0.000 seconds and duration 20.000 seconds; audio and video start and end together.
- Poster is extracted from the settled 19.2s progress/branding frame, then baked as frame 0. The final MP4 still has 600 frames and exactly 20.000 seconds duration.

Twenty representative frames (one per second) were extracted from the final MP4 and reviewed in `verification-contact-sheet.jpg`; the frame-0 poster was inspected separately. The captured sequence shows the Today activity reveal and workout CTA click, staggered workout modules and Start Workout click, RC Paste selection and controls, vocabulary revision CTA, Birbal greeting/prompts, and branded progress finish.

The click SFX starts are aligned to the visible press beats: Today at 2.55s, workout at 6.15s, and RC Paste at 8.48s.

## Notes

All visual and audio assets are local/free. The Auctor app source and root `package.json` were not changed. A local GSAP dependency is included only in `composition/` so the animation does not depend on an external CDN.
