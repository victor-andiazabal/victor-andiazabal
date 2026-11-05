# Round 1: clean log (Step 3)

Skills run: `unslop` (polish mode, direction step skipped, audit against references/signs.md on the rendered app at 1440, 867 and 390, dark and light) and `no-ai-slop` (edit mode over every visible string in src). Palette, type and structure from the brief were not touched. Screens: `screens/`.

## unslop audit (signs.md)
Clean, no change needed: gradients, glows, gradient text, colour blobs (none; only a neutral repeating dash gradient in comm.css); emoji (script over all .ts/.tsx/.css: none; only functional arrows and the middle dot); uppercase tracked labels (none); weights above 600 (none); `transition: all` (none); shadows in dark theme (none, light panels only); hype and exclamation marks (none); greeting headlines (none); looping motion (only the 0.8s button spinner); radii (8/12/16/999, plus 5px nested thumbs inside 8px tracks with 3px padding, which is the nested-radius rule); `.pill` radius used only for status pills and the nav count.

Found and fixed:
| Sign | Where | Fix |
|---|---|---|
| Clipped content | Alerts, Crew overview table: "Flags" column and "6 · surgeon" cut off at the panel edge | `.alerts-crew td.num` may wrap, min-width 64px (alerts.css) |
| Clipped content | Ground view crew grid: last column (PVT RT) cut off at 1440 | cell padding 8 to 4px, cell gap 8 to 4px; the 15-column grid now fits the panel at 1440 (ground.css) |
| Inconsistent sibling sizes | Status pills: tiles used 12px/22px, every other pill 13px/24px | tile pill now uses the base pill size, only padding 2px 8px (today.css); tiles re-checked, no layout break |
| Repeated name, looks like a bug | Source lines such as "NASA Human Research Program: NASA Human Research Program" | compact `SourceLinks` labels two documents from the same body by title instead of repeating the org; every source link is kept (ui.tsx). Inline 12px style raised to the 13px small token |
| Dead CSS, off-scale value | `.scale` rules with a 42px min-height (below the 44px floor), unused | removed (styles.css) |
| Layout shift | Today: the lazy body map swapped a one-line placeholder for a 320px figure and pushed every section down (CLS 0.0226) | placeholder reserves 320px (`.bm-fallback`), CLS now 0.006 |
| Contrast | Light theme status text (green, red, amber) under 4.5:1 on the 10% tints | light status tokens darkened, see verify.md |
| No `<h1>` in static HTML | index.html | `<noscript>` h1 fallback |

Kept on purpose (the brief mandates them): 4px left status edge on finding cards and the red-flag symptom chip (brief 5.2 and 5.4; impeccable flags 3 side-tab lines, all of this kind); the segmented tracks, tiles and the cyan baseline band.

Wishes for the Senior (not changed, they touch the brief's structure or choices):
1. Mission patch emblems on Routine mix a digit ("1", "7", "14"), a check mark, two letters ("RT", "EX") and a block glyph. They read as placeholders. A single 1px line-icon set, as for the nav, would be more consistent.
2. The Alerts page ends in a long comm block (link settings, "In transit", send form, "Delivered") that is taller than the findings and looks like a second app. Ground view repeats the pattern with three empty full-width panels. Could be one panel with tabs.
3. Review step: the "Symptoms and notes" panel stretches to the height of "Sleep and alertness" with one line inside.
4. Symptom labels are capitalised mid-sentence in the unusual-symptom findings ("Unusual fatigue, Headache reported ..."). Left alone because `bodymap.ts symptomsInFinding` matches the reason text against the exact label, and a test covers it. Fix would be to match on lowercase.
5. Tile labels wrap to 2 lines in some tiles ("Blood pressure, diastolic"), so tile heights differ by one text line (162 vs 179px).
6. The brief's light status hexes (#1d7f46, #9a5b00, #c42b2b) fail 4.5:1 on their own tints; tokens changed in code and design-system.md, brief.md left as written.

## no-ai-slop pass (edit mode)
Scope read: indicators.ts (what, how, reference, whySpace), countermeasures.ts, bodySystems.ts, tour.ts, rules.ts titles, reasons and actions, badges.ts, routine.ts, and the strings in Today, StatusPanel, CheckIn, Alerts, Learn, Settings, Routine, Ground, Trends, ReactionTest, CameraPulse, BodyMap. Patterns checked: banned words, filler adverbs, throat-clearing, binary contrasts, hype, exclamation marks, trailing periods on labels and buttons, em dashes, weasel attribution, superlatives without a source. The copy was already plain; the pass found five items. Every number and source is unchanged.

| File | Before | After | Why |
|---|---|---|---|
| data/indicators.ts (temp `what`) | "...which matters a lot in a closed cabin." | "...which matters in a closed cabin." | empty intensifier |
| data/countermeasures.ts (radiation) | "...and will clear the all-clear." | "...and will call the all-clear." | wrong verb, read as a slip |
| data/countermeasures.ts (mood) | "...the two strongest levers you control." | "...both are in your control." | unsourced superlative |
| components/CheckIn.tsx | "Wearable values are pre-filled" | "Wearable values are prefilled" | one spelling, matches the rest of the app |
| components/ui.tsx | repeated organisation in source lines | title for same-body sources | see above |

No test-asserted string was changed. Tests: 90/90 before and after.

## Memorability self-check
- Tell-someone sentence (brief): "It's the health app where you see your status in one glance, and the daily check-in walks you through it in two minutes." Checked against the screen: Today opens on the status word, one reason line and one blue button, and the flow takes 6 actions with prefilled values (Start check-in, Confirm all x3, None today, Save check-in). It holds.
- Colour identity: cool blue-black ramp, instrument cyan only on the baseline band, logo, active nav marker and tutorial ring, one action blue (exactly one blue button on Today, measured at 1440, 867 and 390), status hues for meaning only. Cyan and blue never swap roles.
- Moments per motion layer: transition = check-in step slide with the filling rail (360ms); interaction = tutorial spotlight glide (480ms), number steppers, segmented thumb (200ms), tile day-strip tooltip; state = digit-by-digit readouts (160ms); entrance = routine timeline draw and tile refresh stagger (40ms); signature = status ring sweep on save (700ms) with the word fade. No ambient layer, no loops; reduced motion shows the ring at its final arc, steps swap instantly, the tutorial jumps.
- Components adopted (7 of 7 from the brief): Product Tour (26918), Wizard Steps (23576), Number Field (28180), Segmented Control (23552), Uptime Card day strip (39964), Animate Digits (20071), Timeline (35051). Ring, rail and nav are our own.
- Registry difference: KRAG One was warm near-black with an ember accent and Archivo; the research paper was light newsprint with a serif. VIGIL is a cool graphite ramp with cyan brand, a blue action colour and a grotesk plus mono pair, with a light theme designed from the same roles. The baseline band under every readout is the one detail only this product has.
