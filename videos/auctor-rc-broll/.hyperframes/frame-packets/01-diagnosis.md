# Frame packet: 01-diagnosis

## Project inputs

- Project: C:\Projects\rc-mentor-ai\videos\auctor-rc-broll
- Design tokens: C:\Projects\rc-mentor-ai\videos\auctor-rc-broll\frame.md
- RULES_DIR: C:\Users\NERAJ\.agents\skills\hyperframes-animation\rules

## Assigned storyboard block

## Frame 1 — Diagnosis

- scene: An authentic inference question is answered, challenged and corrected inside an Auctor review screen.
- src: compositions/frames/01-diagnosis.html
- duration: 5.1s
- transition_in: cut
- status: outline
- type: feature_showcase
- persuasion: Product demonstration
- beat: wrong answer to diagnosis to correction
- blueprint: compose
- asset_candidates: focal: assets/screens/answer-review-crop.jpg; roles: assets/screens/answer-review-crop.jpg — source of authentic question, passage, four options and answer rationale (supporting); assets/images/auctor-logo.png — Auctor identity (supporting)

Question and option copy stays verbatim to the provided product screen. Reveal the passage, question, and four independent option rows in order; animate A as the selected wrong answer, show a red cross and the product's `Unsupported Inference` trap, then show C as correct with a green tick. Reconstruct the moving rows as native UI elements instead of holding a screenshot.

### Visual direction

Scene 1 (0.0–1.2s): Dark premium ground, Auctor header, phone shell, passage and exact inference question enter in that order. Keep the composition centered with generous outer negative space; the phone is the sole hero.
Scene 2 (1.2–2.5s): Four separate answer rows reveal sequentially. Keep each option's exact wording, clear hierarchy and consistent spacing.
Scene 3 (2.5–3.25s): A receives a brief tap ripple, selected-state outline, then a prominent red cross. The selected row remains visible.
Scene 4 (3.25–4.0s): A compact `UNSUPPORTED INFERENCE` diagnosis chip connects visually to A with a fine line.
Scene 5 (4.0–5.1s): C receives a green tick and correct-state tint. Hold the connected mistake → diagnosis → correction read.
