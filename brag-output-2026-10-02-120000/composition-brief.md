# Hyperframes Composition Brief: Auctor Labs

## Objective
Create a premium 20-second launch film for the student-facing CAT VARC practice experience. Follow `brag-plan.md` exactly; the user's requested timing and copy are the contract.

## Output
- Composition directory: `brag-output-2026-10-02-120000/composition/`
- Rendered video: `brag-output-2026-10-02-120000/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 20 seconds

## Source Material
- Project root: `C:/Projects/rc-mentor-ai`
- Primary files read: `components/HomeView.jsx`, `components/VocabLab.jsx`, `components/BirbalCoachCard.jsx`, `components/WorkoutEngine.jsx`, `public/logo.png`, `public/Birbal avatar.jpeg`, `app/page.js`, `app/globals.css`
- Product name: Auctor Labs
- Tagline: “Train for CAT VARC. Every day.” (user-provided)
- Product copy / labels used: “Daily RC Arena”, “Today's 30-Min Workout”, “Speed Drill”, “Vocabulary”, “2 RC Passages”, “Tone / Main Idea”, “Vocabulary Lab”, “Saved words”, “Birbal's Coaching Plan”, “Strength”, “Weakness”.
- Copy that must appear verbatim:
  - “Reading isn't the problem. Understanding is.”
  - “Meet Auctor Labs”
  - “Practice.” / “Analyse.” / “Improve.”
  - “Train for CAT VARC. Every day.”
  - `www.auctorlabs.in`
- Screens are faithful visual reconstructions of existing student-facing component source, not direct captures of a signed-in learner session. No account data is used. The vocabulary word/meaning/example are from `app/data/vocabLessons.js`; no learner scores, testimonials, passage claims or AI outcomes are invented.

## Creative Direction
- Tone preset: cinematic
- Creative direction: restrained premium technology launch film with real study UI
- Angle: the hard part is understanding; Auctor turns it into a daily loop of focused practice and guidance.
- Hook: dark study pressure and the two-line user-provided statement.
- Outro: Auctor Labs mark, daily CAT VARC line, website.
- Avoid generic stock footage, invented claims, noisy template graphics, and unreadable text.

## Visual Identity
- Background: `#0F172A` with darker `#080D18` stage shadows
- Text: `#E2E8F0` and white
- Accent: restrained blue/indigo (`#3B82F6`, `#6366F1`) with small cyan light details
- Display font: local Georgia / system serif for the hook; system Segoe UI for the brand
- Body font: system UI / Segoe UI
- Real references: copied app mark and Birbal avatar in `composition/assets/images/`; other UI labels, component arrangements, and the dark/indigo styling derive from app source.

## Storyboard
1. The reading pressure — 3s — dark editorial hook.
2. Auctor reveal — 3s — real brand mark and Meet Auctor Labs.
3. RC Arena — 2s — real practice label and question UI.
4. Daily Workout — 2s — real workout title/modules.
5. Vocabulary Lab — 2s — real title and saved-word context.
6. Birbal guidance — 2s — real avatar and coaching headings.
7. The loop — 4s — Practice / Analyse / Improve.
8. End card — 2s — logo, user-provided line, website.

## Audio
- Audio role: cinematic support; original synthesized score and sparse synthetic UI accents.
- Audio arc: low opening pulse, warm brand lift, restrained rhythmic UI transitions, resolved 18-second end note and fade.
- Music: original 20-second score produced locally for this composition from basic oscillators; no third-party song or paid asset.
- Music cue guidance: custom generated audio; visual beats at 3s, 6s, 14s, 18s.
- Audio-reactive treatment: subtle authored blue-light breathing aligned with the scene energy; no generic visualizer.
- Audio-coupled moments: opening low hit, mark reveal, paired UI ticks, three loop beats, final resolved tone.
- SFX analysis: use generated local sound only; no bundled recordings with unverified redistribution terms.

## Hyperframes Instructions
Use local composition files only. Keep all video assets inside this output directory. Check the composition with Hyperframes, render a 20-second 1080x1920 portrait MP4 with audio, extract a settled end-card poster frame, bake it as frame zero, and verify duration, dimensions, audio stream, file health and playback. Do not modify app source or package manifests.
