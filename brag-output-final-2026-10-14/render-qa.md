# Final render QA

- **Output:** `Auctor-VARC-Bootcamp-Final.mp4`
- **Duration:** 38.000 seconds
- **Format:** H.264 High Profile video, AAC stereo audio at 48 kHz
- **Frame:** 1080 × 1920, 30/1 fps, vertical 9:16
- **Size:** 15,473,625 bytes (about 14.8 MB)
- **Audio level probe:** mean −22.8 dB, peak −7.9 dB. The locally generated score fades through the end. No voiceover.

## Checks performed

- Hyperframes lint: 0 errors, 0 warnings.
- Hyperframes validation: no console errors; 60 text elements pass WCAG AA contrast.
- Rendered MP4 extracted to 38 one-second review frames across the full duration, plus a representative contact sheet.
- Checked full-size frames from the opening, question/options sequence, answer/error reveal, Birbal feedback, guided activity path, transitions, and end card.
- Confirmed the sample choice A, correct answer C, and “Unsupported inference” label against the genuine product review and feedback captures.
- Confirmed the end card holds the logo, Bootcamp name, training CTA, and `auctorlabs.in`; the CTA is visible from approximately 33.4 seconds through the end.
- `ffprobe` confirms video/audio streams, dimensions, frame rate, duration, and codecs. FFmpeg audio analysis confirms the track is present with a clean level range.

## Review limitation

Visual review used extracted rendered frames at one-second intervals and full-size scene samples rather than continuous human playback in a video player. The MP4 itself was probed end-to-end; the local original score was generated programmatically and checked for levels and its end fade.
