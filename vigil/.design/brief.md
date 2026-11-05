# Design Brief: VIGIL crew health (redesign, round 1)

## 0. Job
- Type: Functional (secondary: none). Builder mode for averlo-studio: **functional**.
- Core function: a crew member checks their own health in about two minutes a day and knows at once whether they are fine, what to do next, and whether the flight surgeon needs to hear about it.
- Primary action: **Start check-in** (one label everywhere). After today's check-in is saved, the Today screen's single next-action button changes to the next step (see 5.1).
- What the crew member must believe: "I can trust this answer, I know exactly where every number goes, and it costs me two minutes."
- Existing brand to keep: the VIGIL name and pulse-ring logo mark, the three status words **Nominal / Watch / Act now** (they are in every rule, test and doc), all features, data, rules and sources. Everything visual changes.

## 1. Direction (picked by the user: C, Flight Deck + Procedures; not reopened)
- Character: instrument-calm, exact, procedural.
- World: a spacecraft display panel and a flight procedure card. Read like an instrument, enter like a checklist.
- Theme: dark default ("Hull"), plus a designed light theme ("Daylight panel") via tokens. Differs from the last two registry rows: KRAG One was warm near-black with an ember accent and Archivo; the research paper was light newsprint with a Zodiak serif. This is a cool blue-black instrument ramp with cyan brand, a blue action colour and a grotesk + mono pair.
- Palette strategy and method: Restrained (functional job, user asked for precise and technical) using tonal + contrast: a cool graphite ramp, instrument cyan for brand moments, one action blue, status hues for meaning only.
- Signature moment: on saving a check-in, the Today status ring sweeps once from 0 to its final arc (700ms) while the status word fades in, then the indicator tiles update in reading order (40ms stagger).
- Supporting moments: (1) check-in steps slide in direction-aware with the step rail filling (transition layer); (2) the first-run tutorial spotlight glides between real elements (interaction layer); (3) readouts change digit by digit when a value updates (state layer).
- Tell-someone sentence: "It's the health app where you see your status in one glance, and the daily check-in walks you through it in two minutes."
- Signature detail: the **baseline band**: a thin cyan bar under every readout showing the person's own normal range with a tick where today's value sits. It appears on indicator tiles, in check-in fields (live, as you type) and in Trends. Nowhere else.
- The rut we refuse: the generic health-app look (pastel rings, cartoon hearts, wellness gradients, stock smiling people) and the generic admin template (12 equal cards, emoji nav icons, everything bold).
- References (mechanisms, never layouts):
  - gold: teenage-engineering (https://teenage.engineering): one stroke weight for icons, borders and dividers (1px), tabular numerals, no shadows.
  - gold: oura (https://ouraring.com): lead with one answer, detail on demand; one saturated colour reserved for the primary action; one button height for labelled buttons.
  - godly: Griffin (https://godly.design/website/griffin): dark layered panels separated by surface steps and hairlines.
  - godly: Rerun (https://godly.design/website/rerun): light-theme precision and grid for the daylight variant.
  - 21st: Product Tour + Wizard Steps: a spotlight tutorial on the real UI and a stepped check-in with a progress rail.
  - Fusion: none of these sources pairs a one-word status instrument with a procedure-style data entry flow; that pairing, plus the baseline band, is ours.

## 2. Color
Dark ("Hull") is the default; light ("Daylight") is designed with the same roles.

| Role | Dark | Light | Notes |
|---|---|---|---|
| Brand (instrument cyan) | #4fd1c5 | #0e8a80 | baseline band, logo, active nav marker, tutorial spotlight ring. Never on buttons |
| Background (page) | #0b0f14 | #f4f6f8 | |
| Surface 1 (panel) | #121921 | #ffffff | cards and panels |
| Surface 2 (raised) | #18212b | #eef2f5 | inputs, tiles inside panels, hover |
| Surface 3 (overlay) | #1f2a36 | #e3e9ee | menus, sheets, tutorial card |
| Text primary | #e8eef4 | #0e141b | ≥ 12:1 on page in both |
| Text secondary | #a9b6c3 | #3d4a57 | ≥ 7:1 on surface 1 |
| Text muted | #7c8a98 | #5b6876 | ≥ 4.5:1 on surface 1; labels and units only |
| Hairline | rgba(232,238,244,0.08) | rgba(14,20,27,0.10) | every border, divider, icon stroke 1px |
| Hairline strong | rgba(232,238,244,0.16) | rgba(14,20,27,0.18) | input borders, focus-adjacent |
| Action (primary button, focus ring) | #5b8cff | #2f5fe0 | the only saturated fill on any screen |
| Text on action | #0b0f14 | #ffffff | dark ≈ 6:1, light ≈ 5.6:1 |
| Status Nominal | #3ddc84 | #17703c | meaning only |
| Status Watch | #ffb020 | #8f5300 | meaning only |
| Status Act now | #ff5d5d | #bd2828 | meaning only |
| Status tint (bg) | status at 12% | status at 10% | finding cards, pills |

Rules: status is always word + shape + colour (pill text, ring arc, dot), never colour alone. Cyan never fills a control. Only one action-blue filled button per view.

## 3. Typography
- Families (two): **Space Grotesk** (Google Fonts, OFL; headings, UI and body) and **IBM Plex Mono** (Google Fonts, OFL; every number, unit, time and code). Self-host through `@fontsource/space-grotesk` (400, 500, 600) and `@fontsource/ibm-plex-mono` (400, 500) so the PWA works offline; preload nothing extra. Inter is dropped to stay at two families; Space Grotesk's square terminals carry the instrument character and it reads fine at 16px.

| Role | Size (≥1024 / <1024) | Line height | Tracking | Weight |
|---|---|---|---|---|
| Status word (Today) | 56 / 40 | 1.0 | -0.03em | 600 |
| Page title (H1) | 28 / 24 | 1.15 | -0.02em | 600 |
| Section / card title (H2) | 20 / 18 | 1.2 | -0.02em | 600 |
| Item title (H3) | 16 | 1.3 | -0.01em | 500 |
| Body | 16 / 16 | 1.5 | 0 | 400 |
| Small / meta | 13 | 1.45 | 0 | 400 |
| Readout (tile value) | 32 / 28 Plex Mono | 1.0 | -0.01em | 500, tabular-nums |
| Readout small (tables, units) | 13 Plex Mono | 1.4 | 0 | 400, tabular-nums |
| Check-in field value | 40 / 36 Plex Mono | 1.0 | -0.02em | 500, tabular-nums |

Sentence case everywhere. No uppercase micro-labels, no letter-spaced eyebrows, no numbered section counters except step numbers inside the check-in rail (procedure format).

## 4. Spacing, radius, depth
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- App shell: left rail 240px (≥1024), content padding 32px (≥1024) / 16px (<640), content max width 1280px. Top bar 64px.
- Gaps: 24px between panels; 16px inside a panel; 8px between a label and its value.
- Touch targets (glove-friendly, NASA JSC touchscreen evaluations, NTRS 20140006198): **primary crew actions 56px tall**; secondary buttons, nav rows, segmented options and steppers 48px; never under 44px. Button padding 16/32 at 56px, 12/24 at 48px, 8/16 at 36px (36px only for in-table and dense ground-view controls).
- Radius: controls 8px, tiles and cards 12px, panels 16px, pills 999px only for status pills. Nested radius = outer minus padding.
- **Controls use chamfers (user's choice, 2026-11-05).** Every button, tab and toggle is a chamfered panel (top-left and bottom-right cut at 45 degrees: 10px on 56px, 8px on 48px, 6px on 36px / icon controls), with a 1px hairline and a focus ring that follow the cut. Panels, cards, text inputs and status pills keep the radii above. No coloured edge strips anywhere: finding cards, red-flag symptoms and notes carry status through the pill (dot + word) and the word "urgent". Details in design-system.md.
- Depth: dark uses surface steps + 1px hairlines, no shadows. Light uses `0 1px 2px rgba(14,20,27,0.06), 0 8px 24px rgba(14,20,27,0.06)` on panels only. Overlays (menu, tutorial card, sheet) use Surface 3 and, in light, `0 16px 48px rgba(14,20,27,0.16)`. No glass, no glows.

## 5. Layout, screen by screen

### 5.1 Today (replaces Dashboard; default view)
- Task: "Am I OK, and what do I do now?"
- 1-2-3: 1) status readout (ring + word + one-line reason) 2) the single next-action button 3) body map thumbnail and indicator tiles.
- Reading: F. Eye starts top-left on the status word.
- Composition (≥1024): top row is a 1.6fr / 1fr split. Left panel "Status": ring 160px with the status word to its right, reason line under it ("2 items need action: short sleep, slow reaction time"), mission day + crew member + environment as a small meta line, then the **next-action button** (56px, action blue, full width of the text column, max 360px). Right panel: compact body map (figure 200px tall) with the worst system named under it, tap opens Body map.
- Next-action logic, in order: no check-in today → **Start check-in**; check-in done, no reaction test today → **Run reaction test**; any Act now finding today → **Re-measure in 30 min** (opens the flagged indicator's check-in step; shows the 30-minute guidance from the ExMC decision-support concept, Russell 2023, doi 10.1038/s41526-023-00284-1, added as a source); otherwise → **Send today's report**. A secondary text link under it always offers "Open check-in".
- Second row: indicator tiles, 4 per row (≥1280), 3 (≥1024), 2 (<1024). Each tile 12px radius, 16px padding: label (13px muted), readout (32px mono) + unit, the **baseline band**, a 14-day status strip (C5 Uptime Card mechanism: 14 bars, 4px wide, 2px gap, coloured by that day's level, tap a bar for that day's value), trend arrow. Tile tap → Trends for that indicator.
- Third row: "Crew" strip with the other crew members' status pills (one line, scrolls horizontally <640).
- Mobile: status panel first, then body map row, then tiles 2-up, then crew.

### 5.2 Check-in (stepped procedure; C2 Wizard Steps + C3 Number Field)
- Task: enter today's values fast and correctly.
- Five steps, rail at the top: 1 Vitals (BP systolic/diastolic, resting HR with the Camera pulse button, SpO2, temperature) · 2 Body (fasting glucose, body mass on weekly days, exercise minutes, dosimeter reading) · 3 Sleep and alertness (sleep hours, **Karolinska Sleepiness Scale 1-9**, mood 1-5, stress 1-5) · 4 Symptoms (tap grid, red-flag symptoms marked with the word "urgent" (no edge, per the user 2026-11-05)) · 5 Review (every value, what will flag, Save).
- Each step = one panel: left 1.4fr fields, right 1fr **cue card** ("What it is", "How to measure on board", "Why it matters in space" from `indicators.ts` `what`/`how` + a new `whySpace` line per indicator citing the existing hazard sources). <1024: cue card collapses into a 48px "How to measure" disclosure above the fields.
- Fields: label above; value in 40px mono inside a 56px-tall field with − / + steppers (48px squares) on either side; unit to the right; the baseline band live under the field; prefilled values carry a "from wearable" or "from yesterday" chip; one-tap "Confirm all on this step" secondary button at the step bottom when every field is prefilled.
- 1-5 scales (KSS, mood, stress) are segmented controls (C4) with 48px options, each option showing its number and, for KSS, its short anchor on hover/focus and under the selected option ("7, sleepy, no effort to stay awake" per Åkerstedt/Kaida wording).
- Footer: Back (secondary 48px) left, Next / Save (primary 56px) right, "about 2 min" time budget and step n of 5 in mono small at the left of the rail.
- Keyboard: Enter = next, Shift+Enter = back, arrows change scales, +/- keys step values.

### 5.3 Body map
Keep the existing figure and panel, restyle to tokens: figure strokes 1px hairline-strong, region fills = status tint, selected region 2px cyan outline, panel sections separated by hairlines. Fix the eyes hit area so it no longer covers the centre of the head (eyes rect only over the eyes, 36x10).

### 5.4 Trends, Alerts, Routine, Ground view, Learn, Settings, Reaction test
Same functions, restyled to the system: panels, hairlines, one primary button per view, tables 44px rows with mono right-aligned numbers, sticky headers. Routine uses a vertical timeline (C7) with a "now" marker and 48px check rows. Alerts: finding cards (one even hairline, no status edge; superseded 2026-11-05), status pill, "Why" and "Do now" as two labelled paragraphs, checklist rows 48px. Reaction test: one huge 320px target zone, readout of the last RT in 56px mono.

### 5.5 Navigation
- ≥1024: left rail 240px, rows 48px: Today, Check-in, Body map, Trends, Alerts (count badge), then a hairline, then Routine, Reaction test, Ground view, Learn, Settings. Active row: Surface 2 fill + 2px cyan marker on the left edge. Icons: one 1px-stroke line set (inline SVG, 20px), no emoji.
- <1024: bottom bar with 5 items (Today, Check-in, Body, Alerts, More), 64px tall, 56px targets; More opens a sheet with the rest.
- Top bar 64px: logo + "VIGIL", crew member tabs (48px icon tabs, replaced the selector 2026-11-05), mission day pill in mono, help "?" button (48px) that replays the tutorial, theme toggle (C4 segmented, Dark/Light).

### 5.6 First-run tutorial (C1 Product Tour)
- Shown once on first open (flag `vigil:tour:v2`), replayable from the "?" button and Settings.
- 7 steps, each spotlighting a real element with a card beside it (Surface 3, 16px radius, max 360px, title 18px, body 16px, Back/Next 48px, "Skip tour" link, step dots): 1 Status readout: "This is today's answer: Nominal, Watch or Act now, and the reason." 2 Next action: "One button always tells you what to do next." 3 Check-in nav: "Every number goes here, in five short steps. Values from your wearable are already filled in; you confirm or correct them." 4 A tile's baseline band: "The cyan band is your own normal from 14 pre-flight days. VIGIL compares you with yourself, not only with textbook ranges." 5 Body map: "Tap a body system to see what space does to it and what to do." 6 Alerts: "Every alert says why it fired, what to do now, and the source." 7 Ground view / send report: "Reports reach the flight surgeon after the real light-time delay. Assess first; the ground confirms later."
- Dim layer rgba(0,0,0,0.6) (dark) / rgba(14,20,27,0.45) (light) with a spotlight cutout (8px padding, 12px radius, 2px cyan ring). Focus trapped in the card; Esc skips; arrow keys move; reduced motion = no glide, instant jump.

## 6. Components (21st.dev)

### Sweep log (11 searches, 9 categories; full list in .design/scout/fit.md)
| Category | Query | Candidates (id) | Pick | Why |
|---|---|---|---|---|
| Cards | health vitals dashboard card status | 8619, 39964, 1375, 7461 | 39964 | day strip = drift at a glance |
| Tutorial | onboarding tour spotlight tooltip steps | 26918, 5587, 29891, 8244 | 26918 | spotlights real UI, keyboard + reduced motion |
| Flow | multi-step form stepper wizard | 23576, 28551, 28546 | 23576 | progress rail, direction-aware, keyboard |
| Progress | radial gauge meter ring | 22095, 38114, 1757 | own ring | existing SVG ring restyled |
| Routine | timeline schedule daily routine | 35051, 28289 | 35051 | now-marker timeline |
| Input | number slider stepper input large touch | 28180, 29208, 29940 | 28180 | big +/- steppers |
| Background | dot grid background technical | 34704 | none | functional chrome stays still |
| Numbers | animated number count up ticker | 20071, 29887, 1282 | 20071 | only changed digits move |
| Navigation | sidebar navigation app shell dock | 29334, 31454 | own rail | the rail is simple; no dock magnify |
| Alerts | alert notification list severity | 19366, 38095 | own cards | status edge cards |
| Interactive | segmented control toggle theme switch | 23552, 34763 | 23552 | accessible radio group |

### Adopted (7)
| Use | Component | id / URL | Motion layer | Restyle |
|---|---|---|---|---|
| Tutorial | Product Tour | 26918 https://21st.dev/@laziekiki/components/product-tour | interaction | port to plain React + CSS (no framer-motion dependency); Surface 3 card, cyan ring, 12px cutout radius, Space Grotesk |
| Check-in | Wizard Steps | 23576 https://21st.dev/@ddoemonn/components/wizard-steps | transition | square step markers 32px with mono numbers, rail 2px hairline filled in cyan, 360ms slide 24px |
| Fields | Number Field | 28180 https://21st.dev/@coss.com/components/number-field | interaction | 56px field, 48px square steppers, 8px radius, press-and-hold repeat after 400ms, no drag-scrub |
| Scales + theme | Segmented Control | 23552 https://21st.dev/@ddoemonn/components/segmented-control | interaction | 48px options, Surface 2 track, Surface 3 thumb with hairline-strong border, 200ms thumb slide |
| Tile day strip | Uptime Card | 39964 https://21st.dev/@kokonutd/components/uptime-card | interaction | 14 bars inside tiles, no magnify, tap/focus shows the day in a tooltip |
| Readouts | Animate Digits | 20071 https://21st.dev/@unlumen/components/animate-digits | state | 160ms slide 6px, no blur |
| Routine | Timeline | 35051 https://21st.dev/@kuratlielia/components/timeline | entrance | 1px hairline rail, cyan now-marker, rows 48px |
Builder: read each with `mcp__21st__get_component` once and port the mechanism into this codebase's plain React + CSS. No new runtime dependency except the two @fontsource packages.

## 7. Motion
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` everywhere. Durations: 140ms feedback, 200ms menus/segmented thumb, 360ms step slide, 480ms tutorial glide, 700ms ring sweep (once per save).
- Hover: 140ms surface step (Surface 1 → 2). Press: 1px translateY + surface step. Focus: 2px action-blue ring, 2px offset, always visible on keyboard focus.
- No ambient layer, no looping motion. Existing red-region pulse on the body map is replaced by a static 2px status edge.
- Reduced motion: ring appears at final arc, steps cross-fade 0ms, tutorial jumps, digits swap instantly.

## 8. Imagery
No photos. The product visuals are the status ring, the body map figure, readouts and charts, drawn in code. Icons: one 1px-stroke 20px line set drawn inline.

## 9. Copy
- Voice: plain, exact, calm. Banned: hype words, exclamation marks, "AI", emoji, trailing periods on buttons/labels.
- Status reason line template: "<n> item(s) need action: <short titles>" / "All readings inside your normal range" / "<n> to watch: <titles>".
- Buttons: Start check-in, Run reaction test, Re-measure in 30 min, Send today's report, Confirm all on this step, Next, Back, Save check-in, Skip tour, Replay tutorial.
- Claims needing proof: none new beyond cited sources; KSS wording and the 30-minute reassessment must carry their sources.

## 10. Acceptance criteria
1. Today shows status word, reason line and exactly one action-blue button above the fold at 1440x900, 1024x768 and 390x844.
2. Every interactive control is ≥44px; every primary crew action is 56px; nav rows and steppers 48px.
3. Only the primary button and the focus ring use the action colour; cyan appears only on the baseline band, logo, active nav marker and tutorial ring.
4. Status is never conveyed by colour alone (word or shape present everywhere a status colour appears).
5. Two font families only; all numbers in IBM Plex Mono with tabular-nums; fonts load offline (no network font requests).
6. Check-in is five steps with a rail, cue card per step, steppers on numeric fields, prefilled chips, Confirm all, keyboard navigation; a full check-in of prefilled values takes ≤ 8 taps.
7. KSS 1-9 is collected, stored, trended and has one cited mismatch rule; tests cover it.
8. The tutorial runs on first open, spotlights 7 real elements, is keyboard operable, skippable, replayable from "?" and Settings, and respects reduced motion.
9. Dark and light themes both pass contrast: body text ≥ 7:1, muted ≥ 4.5:1, text on action ≥ 4.5:1.
10. No shadows in dark theme; every border is the 1px hairline token; radii only 8/12/16/999.
11. Zero console errors, no horizontal overflow at 390px, lint 0 warnings, all tests pass.
12. Every feature from before the redesign is still reachable in ≤ 2 taps from Today.
