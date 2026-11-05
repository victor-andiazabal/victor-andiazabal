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
| --text-muted | #7c8a98 | #5b6876 |
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


## Type
--font: 'Space Grotesk', system-ui, sans-serif (400/500/600)
--mono: 'IBM Plex Mono', ui-monospace, monospace (400/500), always with `font-variant-numeric: tabular-nums`
Scale (px): status 56/40, h1 28/24, h2 20/18, h3 16, body 16, small 13, readout 32/28, field 40/36. Line heights per brief section 3.

## Space, size, radius
--s-1 4 · --s-2 8 · --s-3 12 · --s-4 16 · --s-6 24 · --s-8 32 · --s-12 48 · --s-16 64
--hit-primary 56px · --hit 48px · --hit-dense 36px (ground tables only) · minimum 44px
--r-control 8px · --r-card 12px · --r-panel 16px · --r-pill 999px
Shell: rail 240px, top bar 64px, content padding 32/16px, max 1280px. Bottom bar <1024: 64px.

## Buttons (one family)
| Variant | Height | Padding | Radius | Fill | Text |
|---|---|---|---|---|---|
| .btn-primary | 56 | 16 / 32 | 8 | --action | --on-action, 16px 600 |
| .btn (secondary) | 48 | 12 / 24 | 8 | --surface-2 + 1px --line-strong | --text, 16px 500 |
| .btn-ghost | 48 | 12 / 16 | 8 | transparent | --text-2, 16px 500 |
| .btn-sm | 36 | 8 / 16 | 8 | as secondary | 13px 500 (dense ground/table only) |
| .icon-btn | 48 x 48 | 12 | 8 | transparent, hover --surface-2 | 20px 1px-stroke icon |
States: hover (action-hover / surface step, 140ms), pressed (action-press / translateY(1px)), disabled (40% opacity, no pointer), focus-visible (2px --action ring, 2px offset). Loading: label kept, 16px spinner replaces the leading icon.

## Motion
--ease: cubic-bezier(0.16, 1, 0.3, 1) · --t-fast 140ms · --t-menu 200ms · --t-step 360ms · --t-glide 480ms · --t-sweep 700ms
All motion inside `@media (prefers-reduced-motion: no-preference)` or zeroed under `reduce`.
