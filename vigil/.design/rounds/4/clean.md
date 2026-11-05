# Round 4: clean log (Step 3, light)

Scope: the strings and styles changed in round 4: Learn, Alerts, Ground, Fold.tsx, the Check-in header, Routine (and data/routine.ts), NumberField `headAction`, with their CSS (alerts, ground, learn, routine, check-in, screens). Read and grepped directly (no git). The user's choices were not touched: chamfered control family, crew icon tabs, no coloured card edges. No medical rule, threshold or source was edited.

## unslop (audit against signs.md)
Grep over the scoped .tsx, .ts and .css files plus the rendered screens in `screens/` (trends, ground, learn, body in light; check-in at 390):
| Sign | Result |
|---|---|
| Gradients, glows, blur, text-shadow, `transition: all`, weights above 600, uppercase labels | None in the scoped CSS |
| Raw hex in component CSS | None, all colour via tokens |
| Gradient text, colour blobs, emoji, coloured side strips | None; `impeccable detect` returns `[]` |
| Fold rows | Learn indicator rows and the All sources row use the one 48px chamfered `.fold` row (Fold.tsx), same as the Alerts and Ground Watch rows; no variants |
| Sibling sizes | Controls 44 / 48 / 56 by role, pills 24px / 13px, tiles 162 / 124; the 62px body-map row is now chamfered (radius 0px in the inventory) |
Nothing needed fixing.

## no-ai-slop (edit mode, visible strings)
Read in full: Learn (5 hazards, "How VIGIL decides", intro, section labels), Alerts header and comm copy, Ground header, grid note, empty states and placeholder, Check-in header lines and footer hint, Routine intro, "Why a routine", streak notes and the task labels and reasons in data/routine.ts, NumberField labels. Scanned for em or en dashes, exclamation marks, banned words (seamless, robust, leverage, crucial, ensure, simply, just, really, very, actually, essentially, journey and similar), throat-clearing, binary contrasts, hype and trailing periods on labels. Only `!==` operators matched; no string needed an edit.
- Every number and source is unchanged and traceable (24 min one-way delay to Mars, 600 mSv career limit, 14 pre-flight days, 2 L hydration, 8.5 h sleep slot, about 6 h ISS average).
- Left on purpose: "The ground confirms later; you reassess now." (Check-in re-measure note) and "Every VIGIL alert carries its own reason and checklist." are medical-workflow statements, kept verbatim.
- Settings tour line still matches `TOUR_STEPS.length` (7).
No edits were made.
