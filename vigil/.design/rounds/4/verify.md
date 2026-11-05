# Round 4: verify log (Step 4)

Preview: `npx vite preview --port 4183 --strictPort` on the production build made in this run (run from `vigil/`), stopped at the end. No code or CSS was changed during verification; every result is from the committed round-4 code. Scripts are in the session scratchpad (`shots-r4v.mjs` = round-3 `shots-r3v.mjs` with a wider light set, `tour4.mjs` / `flow4.mjs` = round-3 scripts pointed at port 4183 and `rounds/4`, `blue-r3.mjs`, `rtc2.mjs`, `component-sheet-seeded.mjs`). Same procedure as `rounds/3/verify.md`.

## Build gates
```
npx vitest run     Test Files 10 passed (10) | Tests 98 passed (98)      (round 3: 98)
npx tsc -b         exit 0, no output
npm run lint       oxlint, exit 0, no output
npm run build      built in 782ms, PWA precache 20 entries (941.22 KiB); JS 390.24 kB + Trends 377.75 kB + BodyMap 14.22 kB, CSS 69.02 kB (round 3: 65.46)
```

## sitecheck
`python ~/.claude/skills/studio-loop/tools/sitecheck.py http://localhost:4183/`: PASS, 0 errors, 1 warning (missing-og-image, no real domain yet; same as rounds 1 to 3).

## Contrast
Tokens in `src/styles.css` are identical to round 3 (dark block and the light block flattened into `scratchpad/light-tokens-r4.css`, compared token by token with `light-tokens-r3.css`: no differences), so the ratios are unchanged. Re-run with `contrast.py --pair`:
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
- Tutorial-free set (`vigil:tour:v2` = done) in `screens/<name>-<theme>-<width>.png`, 69 files, each from scrollTop 0 with no dialog open (checked, 0 dialogs):
  - dark at 1440, 867 and 390: today, checkin-step1, checkin-step3, checkin-step4, checkin-step5, body, alerts, trends, routine, ground, settings, learn, pvt (39 files);
  - light at 1440, 867 and 390: today, checkin, settings, alerts, routine, trends, ground, learn, body, pvt (30 files; round 3 had 10 and no 867).
- Tutorial, 7 steps at 1440 and 390: `screens/tour-<n>-<width>.png` (14 files). Ring boxes: step 1 status [264,88,700,422] (390: [8,72,374,460]); 2 next action [473,353,376,72]; 3 body map [972,88,444,422] (390 compact row [8,383,374,78]); 4 Check-in nav [4,122,231,64] (390 bottom-bar item [75,777,91,72]); 5 field [289,323,311,254] (round 3: height 240, the field head now carries the camera key); 6 band [289,436,311,28]; 7 Alerts nav [4,272,231,64] (390: [224,777,91,72]). Done closes it, h1 "Today's status: Act now", 0 dialogs left.
- Flow screens: `screens/flow-symptoms-1440.png`, `screens/flow-review-1440.png`. 85 files in `screens/` in total.
- Viewed: components-button and components-card sheets, trends light 1440, ground light 390, learn light 867, check-in step 1 dark 390. No clipping or overlap; the check-in head action (camera key) sits on its own row above the field at 390.

## Overflow and console
`scrollWidth - innerWidth` = 0 on all 69 screens (390, 867, 1440, both themes). Console errors and warnings plus page errors across the shot run, the tour walk and the flow run (3 widths): **none**.

## One-action-blue-per-view
`blue-r3.mjs` (1200 ms wait) over today, checkin, alerts, body, routine, settings, 3 widths, 2 themes (36 views): Today ("Start check-in"), Check-in ("Next") and Alerts ("Send today's report") have exactly one action-blue button in all 18 views; Body map, Routine and Settings have none (18 views).

## Component sheets
`component-sheet-seeded.mjs` (tour flag seeded, no overlay): `components-button.png`, `components-badge.png`, `components-card.png`, `inventory.json`, per-element crops in `components/`. Found: button 42, badge 10, card 29 (round 3: 42, 10, 29).
- Buttons: heights 44 / 48 / 56 as in round 3, radius reads 0px everywhere (clip-path chamfer), weights 400/500/600, one font. The one 62px element ("Open body map. Brain and behavior..." compact row on Today at 390) now reads radius 0px (it was 12px in round 3), so it joins the chamfered family. Clears the 44px minimum. Kept.
- Badges: 24px / 13px status pills, 22px nav count, 18px "Open" pill at 390; radius full.
- Cards: 162px "Needs attention" tiles and 124px "In range" tiles, 12px radius. Each group uniform. Deliberate hierarchy.
Nothing to fix.

## Smoothness
`smoothness.mjs`, 2 runs (fresh profile, tutorial open on load, 1440): p50 8.3 / 8.3 ms, p95 8.5 / 8.5 ms, dropped 0% / 0%, longest task 0 / 0, CLS total 0.0069 / 0.0052 (load 0.0023 / 0.0006). Frames 127 / 147. Pass both (limits 20 ms, 5%, 0.02). Round 3 was 8.4 / 8.5 ms. `smoothness.json` holds both runs.

## Primary flow by hand (Playwright, keyboard), 1440, 867 and 390: all pass
`flow4.mjs`, fresh profile, no seeded flags:
- First run: tutorial open; 8 Tabs keep focus inside; ArrowRight advances ("Next action"), Esc closes and focus leaves the dialog; the "?" button reopens it.
- Crew tabs: 4 `role=tab`; ArrowRight CDR to FE1 with focus following; End to MS1, Home to CDR, ArrowLeft wraps; exactly one tabbable tab; accessible name "Commander, Act now".
- Start check-in is 56px tall on Today. Enter on Start check-in, Confirm all on steps 1 to 3, None today, Save check-in: 6 actions. Back on Today "Run reaction test" and the status word are visible.
- The script's own "exactly one action-blue button (0)" line prints FAIL at all three widths: it reads the button's own `background-color`, but the fill is drawn on `::before`. Known false failure since round 2; `blue-r3.mjs` above is the correct check.

## Motion frames
Copied (not re-shot) from `rounds/4/a/` into `motion/`: 15 `motion-*.png` frames (step-slide, tile-stagger, tour-glide) and 3 `sheet-*.png` contact sheets.

## Not changed on purpose
- Textareas keep the 1px resize grip (vertical only).
- Full-page screenshots show the fixed bottom bar once mid-page at 867 and 390 (stitched-capture artefact, visible in `ground-light-390.png` and `learn-light-867.png`).

## Result
Gates pass (98 tests, tsc, lint, build, sitecheck, impeccable), no failing text, 0 overflow on 69 screens, 0 console errors, one action-blue per view, p95 8.5 ms in both runs, flow and keyboard pass at three widths. Nothing needed fixing, so no re-run was required.
