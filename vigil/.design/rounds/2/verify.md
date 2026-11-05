# Round 2: verify log (Step 4)

Preview: `npx vite preview --port 4181` on the production build made in this run. Run from `vigil/`. No code or CSS was changed during verification, so every result below is from the committed round-2 code. Scripts used are in the session scratchpad (`shots-r2v.mjs`, `flow2.mjs`, `rtc2.mjs`, `component-sheet-seeded.mjs`, `tour2.mjs`, `blue.mjs`, `rm.mjs`).

## Build gates
```
npx vitest run     Test Files 10 passed (10) | Tests 95 passed (95)      (round 1: 90)
npx tsc -b         exit 0, no output
npm run lint       oxlint, exit 0, no output (0 warnings, 0 errors)
npm run build      tsc -b && vite build: built in 658ms, PWA precache 20 entries (930.58 KiB); JS 386.9 kB + Trends 377.8 kB + BodyMap 14.1 kB, CSS 62.7 kB
```

## sitecheck
`python ~/.claude/skills/studio-loop/tools/sitecheck.py http://localhost:4181/`
```
PASS: 0 errors, 1 warnings.   missing-og-image (no real domain yet; same as round 1)
```

## Contrast
`contrast.py --css src/styles.css` (dark) and on a merged light token file (the tool does not read `:root[data-theme='light']`, so the light tokens were flattened into `scratchpad/light-tokens.css`).
| Pair | Dark | Light |
|---|---|---|
| text on bg / s1 / s2 / s3 (need 7) | 16.44 / 15.14 / 13.91 / 12.45 | 17.09 / 18.51 / 16.44 / 15.12 |
| text-2 on bg / s1 / s2 / s3 (need 7) | 9.30 / 8.57 / 7.87 / 7.05 | 8.37 / 9.07 / 8.06 / 7.41 |
| text-muted on bg / s1 / s2 / s3 (need 4.5) | 6.11 / 5.62 / 5.17 / 4.62 | 5.26 / 5.70 / 5.06 / 4.65 |
| on-action on action / hover / press | 6.08 / 7.72 / 4.69 | 5.48 / 6.95 / 8.43 |
| green / amber / red on s1 | 9.92 / 9.68 / 5.88 | 6.14 / 6.17 / 6.00 |
| brand on s1 (UI, need 3) | 9.49 | 4.23 |
Dark: 20 of 20 pairs meet 4.5. Light: 23 of 23 meet their level. The round-1 latent failure (dark muted on surface 3, was 4.12) is fixed: 4.62.

Rendered text, every text node on 10 views plus the open tutorial, dark and light, 1440 and 390, against its composited background: **no failing text**. Note: the round-1 script reads only `background-color`; the chamfered buttons now draw their fill on `::before`, so the unmodified script reported 12 false failures (ratio about 1.0 on "Start check-in", "Next", "Save"). `rtc2.mjs` adds the `::before` fill to the background stack and reports none (the buttons now measure at or above 4.5:1).

## impeccable
`npx --yes impeccable detect --json src` returns `[]`. Round 1 had 3 `side-tab` findings; all gone with the removal of the coloured edges.

## Captures
- `capture.mjs` 1440 and 390 (first-run tutorial open): `desktop.png`, `desktop-fold.png`, `mobile.png`, `mobile-fold.png`. `--widths 1440 --reduced-motion`: `reduced/desktop-reduced.png`, `reduced/desktop-fold-reduced.png`. Both viewed: tutorial spotlight ring on the status panel (1440) and mobile card above the bottom bar, no clipping; reduced output identical to normal at rest.
- Tutorial-free set (`vigil:tour:v2`=done) in `screens/<name>-<theme>-<width>.png`: today, checkin-step1, checkin-step3, checkin-step5, body, alerts, trends, routine, ground, settings at 1440, 867 and 390 in dark (30 files); today, checkin-step1, checkin-step3, checkin-step5 at 1440, 867, 390 in light (12 files). Each captured from scrollTop 0, no dialog open (checked in the script).
- Tutorial, all 7 steps at 1440 and 390: `screens/tour-<n>-<width>.png`; ring boxes measured, steps 5 and 6 open the real check-in field and baseline band, step 4 rings the Check-in nav item (bottom bar at 390).
- Flow screens: `screens/flow-symptoms-1440.png`, `screens/flow-review-1440.png`.

## Overflow and console
Per view, per width, per theme: `scrollWidth - innerWidth` = 0 for all 42 shots (390, 867, 1440). Console and page errors across the shot runs, the flow runs (3 widths), the tour walk and a reduced-motion plus normal-motion pass over all 10 views and the save flow: **none** (errors and warnings both).

## Component sheets
`component-sheet-seeded.mjs` (a copy of the tool with the tour flag seeded so there is no dim overlay): `components-button.png`, `components-badge.png`, `components-card.png`, inventory in `inventory.json`; no input or toggle element appears on the screens the tool visits (the select and checkboxes live on other views). Found: button 41, badge 10, card 29.
- Buttons (desktop): 48px nav rows, crew tabs and secondary; 56px primary (one); 44px link buttons. Mobile adds 56px bottom-bar items. Weights 400/500/600. Radius reads 0px because the shape is a clip-path chamfer (this is the family the user picked); the sheet shows the same diagonal cut on tabs, nav rows, theme segments, the primary and the help button.
- Badges: 24px / 13px status and day pills, 22px nav count (18px at 390 for the "Open" link pill in the body-map card); radius full.
- Cards: 15 tiles at 162px, 12px radius, desktop and mobile (round 1 outlier 179px gone).
Nothing to fix.

## Smoothness
`smoothness.mjs --json smoothness.json`, 2 runs (fresh profile, tutorial open on load): p95 frame 10.4-10.5ms, dropped 0 to 0.9%, longest task 0, CLS total 0 and 0.0053. Pass both times (limits 20ms, 5%, 0.02). Round 1 was 8.5ms; the extra 2ms is the chamfer pseudo-elements.

## Primary flow by hand (Playwright, keyboard), at 1440, 867 and 390: all pass
Fresh profile, no seeded flags (`flow2.mjs`):
- First run: tutorial dialog open; 8 Tabs keep focus inside; ArrowRight advances (to "Next action"), ArrowLeft back; Esc closes; focus leaves the dialog; the "?" button (Show the tutorial) reopens it; Esc closes.
- Crew tabs: 4 `role=tab`; ArrowRight moves selection from CDR to FE1 and focus follows; End goes to MS1, Home to CDR, ArrowLeft wraps to MS1; exactly one tab has tabindex 0; accessible name "Commander, Act now".
- Today shows Start check-in at 56px. Exactly one action-blue button per view on Today, Check-in and Alerts, dark and light, at all three widths (the fill is now on `::before`, `blue.mjs` checks both; Body map, Routine and Settings have none).
- Enter on Start check-in, Confirm all on this step on steps 1, 2 and 3, None today, Save check-in: 6 actions. Back on Today the next action reads "Run reaction test". Same result with reduced motion.
- Tutorial walk (`tour2.mjs`): 7 steps at 1440 and 390, Done closes it, h1 "Today's status: Act now", no dialog left.
(The unmodified round-1 flow script printed "FAIL exactly one action-blue button (0)" at all three widths: same cause as the contrast script, it reads the button's own background. The `blue.mjs` result above is the correct one.)

## Not changed on purpose
- Textareas show a vertical-resize grip. Round 2 (styles.css:332) draws a 1px grip on purpose and limits resize to vertical.
- Full-page screenshots show the fixed bottom bar once mid-page at 867 and 390; that is a screenshot artefact (viewport-fixed element in a stitched capture), not a layout bug.

## Result
All gates pass, no failing text, 0 overflow, 0 console errors, flow and keyboard pass at three widths. Nothing needed fixing.
