# Verification Report — Auctor Labs Product Demo

- Hyperframes: 0.8.109.
- `hyperframes check`: passed; 0 lint errors/warnings, 0 runtime errors, 0 layout issues, 0 motion issues, 70/70 WCAG AA text contrast checks passed.
- Preview: inspected locally at `http://127.0.0.1:3002/#project/composition`; a 12-frame contact sheet sampled 0.5s, 2.6s, 3.5s, 5.5s, 7.5s, 9.5s, 11.0s, 12.8s, 14.0s, 16.0s, 18.1s, and 19.5s. Individual card, control, label, CTA and scene entrances are visible in the captured frames.
- Render: HyperFrames high quality, 30 fps, low-memory profile, one worker; 600 frames; completed successfully.
- MP4: H.264, 1080×1920, 30/1 fps, 20.000s. AAC LC, 48 kHz, stereo, 20.000s. Both streams start at 0.000s; no duration offset. File size: 2,662,355 bytes after poster bake.
- Poster: `brag.jpg`, 1080×1920, extracted at 2.6s after the Today screen settled; the image is baked into frame 0 of `brag.mp4`. Re-probed the final MP4 after muxing; duration, frame rate, resolution and audio alignment remain unchanged.
- Content fidelity: Today progress remains the captured `0 of 3 completed today`; workout preparation is not shown as complete; RC is cropped to captured status/navigation controls with fixture passage and answer content outside the frame; no generated Birbal response or personal word counts are shown.
- Workspace: all composition and delivery artifacts are isolated in this output folder. App source and the app `package.json` were not edited.

## Representative exported frames

The final-video contact sheet is at `quality-check/final-video-sheet.jpg`; frame zero is at `quality-check/frame-zero.png`. It covers Today, Workout, RC Practice, Vocabulary, Birbal, and the close across the complete runtime.
