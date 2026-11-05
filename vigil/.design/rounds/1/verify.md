# Round 1: verify log (Step 4)

Preview: `npx vite preview --port 4180` on the production build. All commands run from `vigil/` unless noted. Final run after the last code change.

## Build gates
```
npx vitest run     Test Files 10 passed (10) | Tests 90 passed (90)
npx tsc -b         exit 0, no output
npm run lint       oxlint: Found 0 warnings and 0 errors (70 files, 116 rules)
npm run build      tsc -b && vite build: built, PWA precache 20 entries (915.8 KiB), 16 files in dist/assets
```

## sitecheck
`python ~/.claude/skills/studio-loop/tools/sitecheck.py http://localhost:4180/`
```
PASS: 0 errors, 1 warnings.
  missing-og-image: no og:image (needs an absolute URL on a real domain; none exists yet)
```
First run had a second warning, missing-h1 (the h1 is rendered by React); fixed with a `<noscript>` h1 in index.html.

## Contrast
Token pairs from `src/styles.css` computed per theme (the official `contrast.py` was cross-checked on two pairs: 5.01:1 and 5.70:1, same as my numbers). Rendered check: every visible text node on all 10 views plus the open tutorial, dark and light, at 1440 and 390, against its real composited background: no failing text (4.5:1 normal, 3:1 large).

| Pair | Dark | Light |
|---|---|---|
| text on bg / s1 / s2 / s3 (need 7) | 16.4 / 15.1 / 13.9 / 12.5 | 17.1 / 18.5 / 16.4 / 15.1 |
| text-2 on bg / s1 / s2 / s3 (need 7) | 9.3 / 8.6 / 7.9 / 7.1 | 8.4 / 9.1 / 8.1 / 7.4 |
| text-muted on bg / s1 / s2 (need 4.5) | 5.44 / 5.01 / 4.60 | 5.26 / 5.70 / 5.06 |
| text-muted on s3 | 4.12 (see note) | 4.65 |
| on-action on action / hover / press (need 4.5) | 6.08 / 7.72 / 4.69 | 5.48 / 6.95 / 8.43 |
| action focus ring on bg / s1 (need 3) | 6.08 / 5.60 | 5.06 / 5.48 |
| brand on s1 / bg (UI, need 3) | 9.49 / 10.30 | 4.23 / 3.90 |

Status text on its own tint (need 4.5), dark: green 7.86, amber 7.74, red 5.11 (all pass).

Light, failures found and fixed (token values changed in `src/styles.css` and `.design/design-system.md`):

| Token | Was | Now | Worst pair before | After (on tint over bg / s2) |
|---|---|---|---|---|
| --green | #1d7f46 | #17703c | 4.07 | 4.94 / 4.75 |
| --amber | #9a5b00 | #8f5300 | 4.37 | 4.96 / 4.77 |
| --red | #c42b2b | #bd2828 | 4.47 | 4.72 / 4.57 |

The light `--*-bg` tints follow the new hues. `brief.md` still lists the old light hexes (the brief is the authority; flagged for the Senior).
Note: dark muted on surface 3 (4.12) is under 4.5 on paper, but no muted text is rendered on a surface-3 background (the rendered check found none); the brief specifies muted on surface 1 only.

## impeccable
`npx --yes impeccable detect --json src`: 3 findings, all `side-tab` (4px coloured left border): checkin.css:8 (re-measure note), checkin.css:129 (urgent symptom chip), styles.css:197 (finding cards). These are the 4px left status edge the brief specifies in 5.2 and 5.4; kept deliberately.

## Captures
- `capture.mjs` 1440 and 390 (first-run tutorial open): `rounds/1/desktop.png`, `desktop-fold.png`, `mobile.png`, `mobile-fold.png`.
- `capture.mjs --widths 1440 --reduced-motion`: `rounds/1/reduced/desktop-reduced.png`, `desktop-fold-reduced.png`. Zero console errors on both runs.
- Tutorial-free set (localStorage `vigil:tour:v2`=done) in `rounds/1/screens/`: Today, Check-in step 1, Body map, Alerts, Trends, Routine, Ground at 1440, 390 and 867 in dark; Today and Check-in at 1440 and 390 in light (`<screen>-<theme>-<width>.png`). Also `flow-symptoms-1440.png` and `flow-review-1440.png` from the flow run. Zero console errors, zero horizontal overflow at 390, 867 and 1440 (checked per view).

## Component sheets
`component-sheet.mjs` found: button 37, input 2, badge 14, card 31. Sheets: `rounds/1/components-{button,badge,card,input}.png` (the tool does not seed the tutorial flag, so the dim overlay is on in the sheets). Inventory (`rounds/1/inventory.json`, desktop):
- buttons: 48px nav rows, theme segments and crew chips; 56px primary (Start check-in, Next, Save); 44px text links (Open check-in, Skip tour). Radius 8px on all filled ones. Weights 400/500/600.
- input: one select, 48px, 8px radius.
- pills: 12px/22px tile pills were the outlier; fixed, all status pills are 13px and 24px now. Nav count badge 22px round, day pill 24px.
- cards: tiles 12px radius, 16px padding, heights 162 or 179 depending on whether the label wraps (wish in clean.md); tutorial card 16px radius, 24px padding.

## Smoothness
`smoothness.mjs --json rounds/1/smoothness.json`, 3 runs after the fix: p95 frame 8.5-8.6ms, dropped 0, longest task 0, CLS total 0.0062-0.0063, pass true each time.
Before the fix: CLS 0.0182 (pass), then 0.0226 (fail on re-run). Cause found with a layout-shift observer: the lazy body map swapped a short placeholder for the 320px figure and pushed the page down. Fixed by reserving the height (`.bm-fallback`).

## Window sizes
867x880: Today, Check-in, Body map, Alerts, Trends, Routine, Ground captured in `screens/*-867.png`; bottom-bar layout, no overflow, flow passes (below). Body-map panel height measured next to the status panel at 1440, 1024, 867 and 390: 406, 449, 387, 387 px, no overlap.

## Primary flow by hand (Playwright, keyboard), at 1440, 867 and 390: all pass
Fresh profile, no seeded flags:
- first run: tutorial dialog open; 8 Tabs keep focus inside the dialog; ArrowRight goes to step 2 (Next action), ArrowLeft back; Esc closes; focus leaves the dialog; the "?" button (Show the tutorial) reopens it; Esc closes again.
- Today shows Start check-in (56px tall), exactly one action-blue button on the page.
- Enter on Start check-in, then Confirm all on this step on steps 1, 2 and 3 (each one advances to the next step), None today on Symptoms (goes to Review), Save check-in: 6 actions in total, all by keyboard focus plus Enter. Back on Today the next action reads "Run reaction test".
- Console and page errors across the three runs: none.
