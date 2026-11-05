# VIGIL design system (tokens)

Source of truth for CSS variable names. Defined in `src/styles.css` on `:root` (dark default) and `:root[data-theme='light']`. Every component uses these names; no raw hex in component CSS.

## Colour
| Token | Dark | Light |
|---|---|---|
| --bg | #0b0f14 | #f4f6f8 |
| --surface-1 | #121921 | #ffffff |
| --surface-2 | #18212b | #eef2f5 |
| --surface-3 | #1f2a36 | #e3e9ee |
| --text | #e8eef4 | #0e141b |
| --text-2 | #a9b6c3 | #3d4a57 |
| --text-muted | #85939f (4.6:1 on --surface-3, 5.6:1 on --surface-1) | #5b6876 |
| --line | rgba(232,238,244,0.08) | rgba(14,20,27,0.10) |
| --line-strong | rgba(232,238,244,0.16) | rgba(14,20,27,0.18) |
| --brand | #4fd1c5 | #0e8a80 |
| --action | #5b8cff | #2f5fe0 |
| --action-hover | #7aa2ff | #2550c4 |
| --action-press | #4a78e6 | #1f45aa |
| --on-action | #0b0f14 | #ffffff |
| --green | #3ddc84 | #17703c |
| --amber | #ffb020 | #8f5300 |
| --red | #ff5d5d | #bd2828 |
| --green-bg / --amber-bg / --red-bg | status at 12% alpha | status at 10% alpha |
| --scrim | rgba(0,0,0,0.6) | rgba(14,20,27,0.45) |
| --shadow-panel | none | 0 1px 2px rgba(14,20,27,0.06), 0 8px 24px rgba(14,20,27,0.06) |
| --shadow-overlay | none | 0 16px 48px rgba(14,20,27,0.16) |
| --focus-ring | = --action | = --action |
| --cf-highlight | rgba(232,238,244,0.05) | rgba(255,255,255,0.9) |
| --cf-highlight-action | rgba(255,255,255,0.28) | rgba(255,255,255,0.22) |
| --cf-divider | rgba(11,15,20,0.28) | rgba(255,255,255,0.34) |
| --cf-edge-key (secondary key hairline) | = --line-strong | rgba(14,20,27,0.30) |


## Type
--font: 'Space Grotesk', system-ui, sans-serif (400/500/600)
--mono: 'IBM Plex Mono', ui-monospace, monospace (400/500), always with `font-variant-numeric: tabular-nums`
Scale (px): status 56/40, h1 28/24, h2 20/18, h3 16, body 16, small 13, readout 32/28, field 40/36. Line heights per brief section 3.

## Space, size, radius
--s-1 4 · --s-2 8 · --s-3 12 · --s-4 16 · --s-6 24 · --s-8 32 · --s-12 48 · --s-16 64
--hit-primary 56px · --hit 48px · --hit-dense 36px (ground tables only) · minimum 44px
--r-control 8px (legacy; text fields are now chamfered, cut 8) · --r-card 12px · --r-panel 16px · --r-pill 999px · --chamfer-lg 10px · --chamfer 8px · --chamfer-sm 6px (controls, see below)
Shell: rail 240px, top bar 64px, content padding 32/16px, max 1280px. Bottom bar <1024: 64px.

## Controls: one chamfered family (user's choice, 2026-11-05)
Every button, tab and toggle is a chamfered panel: the **top-left and bottom-right** corners are cut at 45 degrees (the diagonal pair from the 21st.dev HUD Button, id 2547, ported to plain CSS). The diagonal pair was chosen over four cut corners because at 48px four 8px cuts turn the key into an octagon and eat the label's rectangle; the pair keeps a clear rectangle with one directional cut, reads as an instrument key, and leaves the square corners to align with panels and grids.

Tokens (`src/styles.css`): `--chamfer-lg: 10px` (56px primary, 56px number box), `--chamfer: 8px` (48px controls, tracks, nav rows), `--chamfer-sm: 6px` (36px / 44px small buttons, icon buttons, steppers, thumbs, step markers, scale options). Per theme: `--focus-ring` (= --action), `--cf-highlight` (1px top highlight on secondary keys), `--cf-highlight-action` (same on the primary), `--cf-divider` (the 1px divider before the primary's trailing icon).

Mechanism: each member sets `--c` (cut), `--cf-fill` and `--cf-edge`. `::before` is the fill clipped to the shape; `::after` is the 1px hairline drawn as an even-odd ring clipped to the same shape (inner cut c - 0.59px keeps the diagonal 1px), so the outline follows the cut exactly and translucent fills never tint it. Keyboard focus turns `::after` into the hairline in `--focus-ring` plus a 2px ring 2px outside, still following the cut; options inside a track (segmented, KSS / mood / stress) draw the 2px ring inside the cell instead. No coloured edge strips anywhere.

| Variant | Height | Padding | Cut | Fill / hairline | Text |
|---|---|---|---|---|---|
| .btn-primary | 56 | 16 / 24 / 16 / 32 | 10 | --action / --action, 1px top highlight | --on-action, 16px 600, trailing 20px icon after a 1px divider (`BtnTrail`: arrow, or check on Save / Done) |
| .btn (secondary) | 48 | 12 / 24 | 8 | --surface-2 / --line-strong | --text, 16px 500 |
| .btn-ghost | 48 | 12 / 16 | 8 | transparent (hover --surface-2) | --text-2, 16px 500 |
| .btn-sm / .btn.sm | 36 / 44 | 8 / 16 | 6 | as secondary | 13px 500 |
| .btn-destructive / .btn.danger | 48 | 12 / 24 | 8 | --surface-2 or --red-bg / --red | --red |
| .icon-btn | 48 x 48 | 12 | 6 | transparent (hover --surface-2 / --line) | 20px 1px-stroke icon |
| .link-btn | 44 min | 0 | 6 (focus ring only) | transparent | underlined text |
States: hover (action-hover / one surface step, 140ms), pressed (translateY(2px); primary also --action-press), disabled (40% opacity, no pointer), focus-visible (chamfered 2px --focus-ring with 2px gap). Loading: label kept, 16px spinner replaces the leading icon.

Other members, same shape: segmented track (8) and sliding thumb (6), comm tabs, nav rail rows (active = --surface-2 fill + --line hairline + the 2px cyan marker inside the fill), bottom bar items (active marker 24x2 on the top edge), check-in step markers (32px, cut 6), KSS / mood / stress scale track and options, number-field steppers (48, cut 6) and the 56px value box (cut 10), the Select wrapper, symptom keys (red-flag ones show the word "urgent"; ticked = --red-bg fill + --red hairline), cue-card toggle, body-map system list and Trend buttons, crew chips, the file-picker button, and the top-bar crew tabs.

Crew tabs (top bar, T4 from 21st.dev Tabs with Icons id 24990): role="tablist" / "tab" with aria-selected, roving tabindex, arrows / Home / End, selection follows focus. Each tab is 48px: 20px role icon, mono callsign from the role code (CDR, FE1, FE2, MS1), status dot; the accessible name carries the callsign and the status word. Selected = --surface-3 fill + --line-strong hairline + 2px --action underline along the bottom edge (stops at the cut). Below 768px the tabs become icon keys (44px wide) with the callsign under the icon at 12px and the dot on the icon's corner.

Toggles and fields (round 3): checkbox and radio are a 24px chamfered box (cut 6, 1px hairline, the real input stretched invisibly over it via `Check` in ui.tsx; on = --surface-3 fill, --action hairline, tick or inner 10px chamfered square; 48px row hit area; focus ring follows the cut). The range thumb is a 24x24 chamfered square in --text (--action on keyboard focus). The file picker is a hidden input behind a 48px secondary key 'Choose file' with the file name in 14px --text-2. Text inputs and textareas use the same diagonal pair as the select (cut 8): the 1px border draws the straight sides, two gradients draw the diagonals, and keyboard focus is a 2px --focus-ring drawn inside the clip.

Not in the family: panels and cards (radius 12 / 16), status pills (999), finding cards (12, one even hairline, no status edge, not clickable).

## Motion
--ease: cubic-bezier(0.16, 1, 0.3, 1) · --t-fast 140ms · --t-menu 200ms · --t-step 360ms · --t-glide 480ms · --t-sweep 700ms
All motion inside `@media (prefers-reduced-motion: no-preference)` or zeroed under `reduce`.
