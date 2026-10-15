# Final Render QA

## Artifact
- `Auctor-CAT26-VARC-Bootcamp-Reel-Final.mp4`
- 45.000 seconds, 1080 × 1920, 9:16, 30fps
- H.264 video, AAC stereo audio at 48 kHz
- 17,126,368 bytes after baking the selected poster frame into frame 0
- Poster: `Auctor-CAT26-VARC-Bootcamp-Reel-Poster.jpg` (selected at 43.5s)

## Validation and visual review
- Hyperframes check: 0 errors, 0 warnings; 49/49 text contrast checks pass WCAG AA.
- FFprobe confirmed dimensions, frame rate, codecs, audio presence and duration.
- Extracted 45 one-second frames and 35 selected animation frames into `qa-frames/`; reviewed the contact sheet plus full-size and 360×640 samples around the question, diagnosis, trainer, reveal, training path and CTA.
- Confirmed the source question, passage excerpt, choices A–D, A selection, C correction and `Unsupported Inference` diagnosis against the authentic product review. The rationale wording is grounded in the real Birbal feedback.
- Confirmed the logo reveal is clean, CTA and URL sit above the Reels bottom overlay area, and poster is present at frame 0 while the opening follows immediately.
- Existing score retained. Sparse card, selection, diagnosis and logo cues added; no voiceover.

## Accuracy and limitations
- Mock scores and the repeating-error history are ad illustrations labeled `ILLUSTRATIVE`; they are not real student data or a real saved history.
- The authentic question is shown with a short excerpt of its passage rather than the entire passage. At 360×640, the options and feedback are readable but the supporting excerpt is small; the complete reasoning cannot be read word for word in the short scene.
- The crowded mock-card stack intentionally occludes some earlier scores as later cards arrive; the final score remains visible.
- Visual QA used extracted frames rather than continuous human playback. Audio streams and encoding were verified, but the finished mix was not auditioned in real time.
