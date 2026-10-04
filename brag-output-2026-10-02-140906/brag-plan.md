# Auctor Labs — launch film storyboard

## Creative angle
A focused student workspace, revealed as a sequence of real controls. The camera stays close to the product: the active panel, four workout modules, captured RC controls, a revision action, and Birbal's actual greeting prompts. Type and interface parts take turns leading; nothing is presented as an outcome the app has not captured.

## Runtime and format
20 seconds, vertical 1080×1920, 30 fps. No voiceover. Existing licensed-in-project music bed at restrained level.

## Storyboard

| Time | Scene | Individual reveals and interaction |
|---|---|---|
| 0.00–3.00 | Today | Brand/header settles first; the real Today heading and subtitle follow. The daily-activity panel rises, then tabs, challenge title, description, CTA and captured `0 of 3 completed today` note appear in order. CTA receives a small press/release. |
| 3.00–7.00 | Daily Workout | Transition into the ready state. Focus label and title appear, then the four source workout cards stagger individually. Cursor travels to the real Start Workout CTA and presses it. Remain on the ready state; no completion is implied. |
| 7.00–10.50 | RC Practice | Actual captured RC interface enters as a cropped panel. Timer, attempt status, Submit Test region and question navigation get sequential outlines. Cursor selects the captured active `1` navigation control; the test capture is the only state shown. |
| 10.50–13.50 | WordBank | WordBank label and real revision-queue headline reveal separately. Start a Revision Drill CTA enters and receives one quiet focus pulse. No personal counts are invented. |
| 13.50–17.20 | Birbal | Actual mentor banner and avatar enter; existing greeting appears, then the four real suggestion chips reveal one by one. No generated reply is shown. |
| 17.20–20.00 | Today close | Return to Today and sequentially restore the actual activity panel, CTA and captured `0 of 3 completed today` progress. Hold the interface and Auctor Labs sign-off cleanly. |

## Motion system
Separate DOM elements use paused GSAP timelines and absolute timeline positions. Entrances use opacity, short y movement, restrained scale settles, and `power2.out` / `power3.out`; scene handoffs use brief opacity and y transitions. Timing is seek-safe. Cursor clicks only at visible existing controls. No whole-screen screenshot animation, fake checkmarks, or fabricated values.

## Composition changes from prior cut
The prior version left large unused zones around a small, repeated phone shell and leaned on whole-scene fades. This pass enlarges the app surface, tightens the portrait framing, adds layered depth to actual panels/cards, and gives every featured interface element its own reveal. The supplied reference clips were not present in the project or attachments, so this storyboard follows the written creative direction and does not claim a reference comparison.

## Reference study and baseline audit
The accessible local `Reference.mp4` is a 23-second, 576×1024, 30 fps portrait film with audio. A one-second sampling pass shows a short numeric opening, then alternating oversized white headlines with a restrained violet emphasis and clean browser/product windows that enter as distinct layers. The edit holds each claim long enough to read, advances through feature headlines, and closes on a concise brand/CTA lockup. Sound is present throughout; the sampled file metadata confirms aligned 23-second audio/video streams. The linked YouTube page resolves to “SaaS Demo Video Example for Fintech Companies,” but browser access exposes metadata rather than playable frames, so its exact motion/sound was not inspected.

The previous Auctor render (used because `brag(1).mp4` was not present) is technically clean but visually repetitive: the same tall phone shell appears for every feature, UI is concentrated in the upper half, and broad empty areas dominate the lower canvas. Titles and cards are readable but modest in scale; the rhythm depends on scene fades and small upward reveals. The RC and vocabulary scenes read as sparse app captures rather than composed feature moments. This redesign increases interface scale, pushes real headings and cards forward, layers depth into actual panels, and gives controls and cards their own animation beats.
