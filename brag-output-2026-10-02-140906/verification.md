# Auctor Labs video verification

## Deliverables
- `brag.mp4`: final 20-second H.264 MP4, 1080×1920, 30 fps, 600 frames.
- `brag.jpg`: settled Today-state poster sampled at 19.2 seconds; 1080×1920. Poster image is baked into video frame 0.
- `composition/index.html`: Hyperframes composition source; local assets include the genuine screen captures, Auctor logo, Birbal artwork, music bed, and generated 100 ms UI tick.
- `brag-plan.md`, `composition-brief.md`, `share-copy.txt`: storyboard, build brief, and caption.

## Checks
- `hyperframes check`: passed; 0 lint/runtime/layout/motion errors or warnings; 70/70 contrast checks meet WCAG AA.
- `hyperframes preview`: started at `http://127.0.0.1:3003/#project/composition`; inspected 21 time samples across 0–19.4 s, then spot-checked the workout cursor, RC selection, and WordBank focus.
- Exported stream metadata via `ffprobe`: video H.264, 1080×1920, 30/1 fps, start 0.000 s, duration 20.000 s, 600 frames; audio AAC stereo 48 kHz, start 0.000 s, duration 20.000 s. Audio/video stream duration delta: 0 ms.
- Final MP4 sampled at 1 fps over the full 20-second sequence; representative frames reviewed at opening, activity reveal, workout, captured RC controls, WordBank CTA, Birbal, and final Today view. No encoding artifacts or missing scenes in the exported frames.
- Poster is 1080×1920 and its artwork matches the extracted frame 0. Media file size: 2,795,342 bytes.
- Audio spot checks around 5.9–6.3 s and 9.2–9.7 s show audible-level peaks of -19.6 dB and -18.3 dB, respectively, covering the two UI click accents over the music bed.

## Reference and comparison notes
- Reviewed the accessible local `Reference.mp4` (23 s, 576×1024, 30 fps, AAC stereo 44.1 kHz) with a 1 fps contact sheet. It uses oversized concise headlines, a restrained violet emphasis, clean product-window layers, and readable holds. Its audio/video stream durations match at 23 s.
- The linked YouTube item resolves as [SaaS Demo Video Example for Fintech Companies](https://www.youtube.com/watch?v=wwIt5ZvROrs), but playback frames were unavailable in browser access; no visual or sound analysis is claimed for it.
- `brag(1).mp4` was not present beside the supplied local reference. The previous Auctor export was used as the baseline: small repeated phone framing, unused lower canvas, and fade-led transitions. This version enlarges the interface, stages real elements separately, choreographs the two cursor actions, and adds a clean closing view.
- App files, `package.json`, and the earlier video output were left unchanged.
