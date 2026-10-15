# Render QA — Auctor VARC Bootcamp Cinematic

## Artifact

- `Auctor-VARC-Bootcamp-Cinematic-Final.mp4`
- 1080 × 1920, 30 fps, 45.0 seconds, MP4 with audio
- Encoded output: approximately 6.2 MB
- Final source: `composition/index.html`

## Validation

- `hyperframes check`: passed. No lint, runtime, layout, motion, or contrast issues; 78/78 contrast checks passed.
- Render pipeline validated the MP4. `ffprobe` confirmed 1080 × 1920, 30/1 fps, and 45.0-second duration.
- Extracted 45 frames at one frame per second. Reviewed the full [contact sheet](qa-frames/contact-sheet.jpg) and native-size samples at seconds 4, 8–9, 14–17, 20–23, 27, 30, 38, and 41–43.

## Scene checks

- **Question and selection (0–5s):** The real inference prompt and four separate option rows appear in sequence. A is selected before the “YOU GOT IT WRONG” / “BUT DO YOU KNOW WHY?” interpretation lands.
- **Diagnosis and correction (5–11s):** A is crossed out, `UNSUPPORTED INFERENCE` attaches to it, the relevant passage limitation is highlighted, and C enters as the correct answer. The diagnosis is specific to the verified question rationale.
- **Birbal feedback (11–18s):** Correct C remains in view while the authentic `WHY IT FAILED`, `THE TRAP`, and `WHAT TO DO NEXT TIME` copy replaces itself beat by beat.
- **History (18–25s):** The previous-review diagnosis card travels into a small history rail as a different authentic RC prompt arrives. The frame does not present a simulated database or claim that one response establishes a persistent weakness.
- **Daily loop (25–33s):** Warm-up, RC, VA, Review, and Next Session cards assemble in sequence; Day 01–03 markers follow.
- **Promise and end card (33–45s):** “YOU SHOW UP.”, “WE TAKE CARE OF THE REST.”, `ONE MISSION. CAT 2026.` resolve into the Auctor CTA. The black field in the supplied logo has been blended into the navy backdrop.

## Remaining limitations

- The history-rail travel is a motion-design metaphor. The review and next-question copy are authentic, but this is not a literal screen recording of stored history being retrieved.
- The existing 38-second instrumental was stretched to 45 seconds (about 18%) and faded over the final 3 seconds. No voiceover was added. The final mix was validated in the render, but not subjectively listened through on reference speakers.
- Text is legible in native 1080 × 1920 frame reviews; at small social-preview sizes, the passage and option wording will naturally be harder to read.

The original final and earlier revision remain unchanged. The candidate renders from the visual QA pass are also kept in this new dated directory.
