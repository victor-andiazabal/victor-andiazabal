# Round 3: verify log (Step 4)

Preview: `npx vite preview --port 4182 --strictPort` on the production build made in this run (run from `vigil/`). No code or CSS was changed during verification; every result is from the committed round-3 code. Scripts are in the session scratchpad (`shots-r3v.mjs`, `tour3.mjs`, `flow3.mjs`, `rtc2.mjs`, `blue.mjs` / `blue-r3.mjs`, `component-sheet-seeded.mjs`). Same procedure as `rounds/2/verify.md`.

## Build gates
```
npx vitest run     Test Files 10 passed (10) | Tests 98 passed (98)      (round 2: 95)
npx tsc -b         exit 0, no output
npm run lint       oxlint, exit 0, no output
npm run build      built in 638ms, PWA precache 20 entries (935.61 KiB); JS 388.31 kB + Trends 377.75 kB + BodyMap 14.22 kB, CSS 65.46 kB (round 2: 62.7)
```

## sitecheck
`python ~/.claude/skills/studio-loop/tools/sitecheck.py http://localhost:4182/`: PASS, 0 errors, 1 warning (missing-og-image, no real domain yet; same as rounds 1 and 2).

## Contrast
Tokens in `src/styles.css` are identical to round 2 (checked light block against the round-2 flattened file: no differences), so the token ratios are unchanged. Run again with `contrast.py --pair` (dark from `src/styles.css`, light from a freshly flattened `scratchpad/light-tokens-r3.css`):
| Pair | Dark | Light |
|---|---|---|
| text on bg / s1 / s2 / s3 (need 7) | 16.44 / 15.14 / 13.91 / 12.45 | 17.09 / 18.51 / 16.44 / 15.12 |
| text-2 on bg / s1 / s2 / s3 (need 7) | 9.30 / 8.57 / 7.87 / 7.05 | 8.37 / 9.07 / 8.06 / 7.41 |
| text-muted on bg / s1 / s2 / s3 (need 4.5) | 6.11 / 5.62 / 5.17 / 4.62 | 5.26 / 5.70 / 5.06 / 4.65 |
| on-action on action / hover / press | 6.08 / 7.72 / 4.69 | 5.48 / 6.95 / 8.43 |
| green / amber / red on s1 | 9.92 / 9.68 / 5.88 | 6.14 / 6.17 / 6.00 |
| brand on s1 (UI, need 3) | 9.49 | 4.23 |
All pass.

Rendered text (`rtc2.mjs`: every text node on 10 views plus the open tutorial, dark and light, 1440 and 390, composited background including the buttons' `::before` fill): **no failing text**.

## impeccable
`npx --yes impeccable detect --json src` returns `[]`.

## Captures
- `capture.mjs` 1440 and 390 with the first-run tutorial open: `desktop.png`, `desktop-fold.png`, `mobile.png`, `mobile-fold.png` (all "ok"). `--widths 1440 --reduced-motion`: `reduced/desktop-reduced.png`, `reduced/desktop-fold-reduced.png`.
- Tutorial-free set (`vigil:tour:v2` = done) in `screens/<name>-<theme>-<width>.png`, 49 files, each from scrollTop 0 with no dialog open (checked, 0 dialogs):
  - dark at 1440, 867 and 390: today, checkin-step1, checkin-step3, checkin-step4, checkin-step5, body, alerts, trends, routine, ground, settings, learn, pvt (39 files);
  - light at 1440 and 390: today, checkin, settings, alerts, routine (10 files).
- Tutorial, 7 steps at 1440 and 390: `screens/tour-<n>-<width>.png` (14 files). Ring boxes measured: step 1 status [264,88,700,422]; 2 next action [473,353,376,72]; 3 body map [972,88,444,422]; 4 Check-in nav [4,122,231,64] (at 390 the bottom-bar item [75,777,91,72]); 5 field [289,330,311,240]; 6 band [289,436,311,28]; 7 Alerts nav [4,272,231,64] (390: [224,777,91,72]). Done closes it, h1 "Today's status: Act now", 0 dialogs left.
- Flow screens: `screens/flow-symptoms-1440.png`, `screens/flow-review-1440.png`. 65 files in `screens/` in total.
- Viewed: today dark 1440, settings dark 390, alerts light 1440, tour step 6 at 390, the button and card sheets. No clipping, no overlap; the tutorial ring sits on the baseline band at 390 and the card is above the bottom bar.

## Overflow and console
`scrollWidth - innerWidth` = 0 on all 49 screens (390, 867, 1440, both themes). Console errors and warnings plus page errors across the shot run, the tour walk and the flow run (3 widths): **none**.

## One-action-blue-per-view
`blue.mjs` over today, checkin, alerts, body, routine, settings, 3 widths, 2 themes (36 views): Today ("Start check-in"), Check-in ("Next") and Alerts ("Send today's report") have exactly one action-blue button in all 18 views; Body map, Routine and Settings have none. The first pass reported 0 for Today and Check-in at light 390: the script waits 400 ms and read the button mid theme transition. `blue-r3.mjs` (1200 ms wait, otherwise identical) gives 1 on all 18, and a direct probe shows `::before` = rgb(47, 95, 224) = `--action`. Not a code defect.

## Component sheets
`component-sheet-seeded.mjs` (tour flag seeded, no overlay): `components-button.png`, `components-badge.png`, `components-card.png`, `inventory.json`, per-element crops in `components/`. Found: button 42, badge 10, card 29 (round 2: 41, 10, 29).
- Buttons: desktop 48px (nav rows, crew tabs, theme segments, crew chips, help), 56px primary (one), 44px link button; mobile adds 56px bottom-bar items. Weights 400/500/600. Radius reads 0px (clip-path chamfer). New against round 2: one mobile element at 62px and radius 12px, "Open body map. Brain and behavior..." That is the round-3 compact body-map row on Today at 390 (`bodymap.css:92`, `min-height: 62px`, card radius), which replaces the 200px figure and is a tappable card row, not a button in the family. It clears the 44px minimum. Kept.
- Badges: 24px / 13px status and day pills, 22px nav count, 18px "Open" pill at 390; radius full.
- Cards: 162px "Needs attention" tiles and 124px "In range" tiles (new in round 3, `.ind-tile.range { min-height: 124px }`), 12px radius everywhere. Each group is uniform (6 at 162 and 9 at 124 on desktop; 6 and 8 at 390, one range tile hidden under the bottom bar in the crop). Deliberate hierarchy, so not an outlier.
Nothing to fix.

## Smoothness
`smoothness.mjs`, 2 runs (fresh profile, tutorial open on load, 1440): p50 8.3 / 8.3 ms, p95 8.4 / 8.5 ms, dropped 0% / 0%, longest task 0 / 0, CLS total 0.0069 / 0.0010 (load 0.0023 / 0.0010). Frames 123 / 130. Pass both (limits 20 ms, 5%, 0.02). Round 2 was 10.4 ms. `smoothness.json` holds both runs.

## Primary flow by hand (Playwright, keyboard), 1440, 867 and 390: all pass
`flow3.mjs`, fresh profile, no seeded flags:
- First run: tutorial open; 8 Tabs keep focus inside; ArrowRight advances ("Next action"), ArrowLeft back; Esc closes and focus leaves the dialog; the "?" button reopens it.
- Crew tabs: 4 `role=tab`; ArrowRight CDR to FE1 with focus following; End goes to MS1, Home to CDR, ArrowLeft wraps; exactly one tabbable tab; accessible name "Commander, Act now".
- Start check-in is 56px tall on Today. Enter on Start check-in, Confirm all on steps 1 to 3, None today, Save check-in: 6 actions. Back on Today the next action reads "Run reaction test" and the status word is visible.
- The script's own "exactly one action-blue button (0)" line prints FAIL at all three widths: it reads the button's own `background-color`, but the fill is drawn on `::before` since round 2. Same known false failure as round 2; `blue.mjs` above is the correct check.

## Not changed on purpose
- Textareas keep the 1px resize grip (vertical only).
- Full-page screenshots show the fixed bottom bar once mid-page at 867 and 390 (stitched-capture artefact, visible in `settings-dark-390.png`).

## Result
Gates pass (98 tests, tsc, lint, build, sitecheck, impeccable), no failing text, 0 overflow, 0 console errors, one action-blue per view, p95 8.5 ms at worst, flow and keyboard pass at three widths. Nothing needed fixing, so no re-run was required.
