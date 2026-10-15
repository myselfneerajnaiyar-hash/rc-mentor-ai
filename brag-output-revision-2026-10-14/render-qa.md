# Auctor VARC Bootcamp revision — render QA

- Deliverable: `Auctor-VARC-Bootcamp-Revision.mp4` (1080×1920, 30 fps, 38 seconds)
- Composition source: `composition/index.html`
- The existing opening, end card, and score were retained. The source score WAV matches the prior final's SHA-256.
- Reworked the 5–20 second section around the verified RC sample: sequential options, selected wrong answer A, red strike, the supported diagnosis `UNSUPPORTED INFERENCE`, and correct answer C. Birbal feedback follows in three separate beats using crops from the authentic response.
- Reworked the training-journey scene as a sequential five-step path followed by a wipe reveal of the authentic Bootcamp activity rail.
- Validation: HyperFrames lint reported 0 errors and 0 warnings; headless browser validation reported no console errors. The MP4 rendered successfully.
- Visual QA: exported one frame per second to `qa-frames/` and reviewed the revised answer sequence, all three Birbal beats, journey steps and activity-rail reveal, opening, and end card. The connector/headline overlap found in the first render was corrected before this final render.

## Remaining limitation

The Birbal copy is authentic but comes from raster UI captures, so small text is a little soft when enlarged in the portrait frame. It remains readable at the rendered size. No voiceover was added.
