# Picks (user chose 2026-11-05)

Direction: **C, Flight Deck + Procedures.** Read like an instrument, enter like a checklist.
Tell-someone: the health app where you see go or no-go in one glance, and the daily check-in walks you through in under two minutes.
User answers: feel = precise and technical; theme = dark default + designed light; scope = full redesign (keep features, data, rules, sources). Components = the direction's set, no swaps.

## Recipe
- gold: teenage-engineering -> instrument labelling, small-caps units, tabular numerals, hairline rules
- gold: oura -> lead with one readiness answer, detail on demand
- godly: Griffin (https://godly.design/website/griffin) -> dark layered panels, 1px borders, no shadows
- godly: Rerun (https://godly.design/website/rerun) -> light-theme precision for the daylight variant
- 21st: Product Tour + Wizard Steps -> spotlight tutorial on the real UI; stepped check-in
New (ours): a Today screen with exactly three things: status word + reason, the one next action, the body map. Everything else is one tap away.

## Palette and type
Hull #0b0f14 (ground), Panel #131a22 (ground), Instrument cyan #4fd1c5 (brand), Action blue #5b8cff (action), Caution amber #ffb020 (status), Readout white #e8eef4 (text). Status red/green keep the existing level semantics.
Display Space Grotesk / Text Inter / Numerals IBM Plex Mono.

## Motion
Status ring sweeps on save, tiles update in sequence; check-in steps slide with a filling step rail; tutorial spotlight glides between real elements. No ambient layer. Reduced-motion fallback for all.

## Components
| Code | Name | id | URL | Category | Motion layer |
|---|---|---|---|---|---|
| C1 | Product Tour | 26918 | https://21st.dev/@laziekiki/components/product-tour | Tutorial | interaction |
| C2 | Wizard Steps | 23576 | https://21st.dev/@ddoemonn/components/wizard-steps | Check-in flow | transition |
| C3 | Number Field | 28180 | https://21st.dev/@coss.com/components/number-field | Input | interaction |
| C4 | Segmented Control | 23552 | https://21st.dev/@ddoemonn/components/segmented-control | Interactive | interaction |
| C5 | Uptime Card | 39964 | https://21st.dev/@kokonutd/components/uptime-card | Status history | interaction |
| C6 | Animate Digits | 20071 | https://21st.dev/@unlumen/components/animate-digits | Numbers | state change |
| C7 | Timeline | 35051 | https://21st.dev/@kuratlielia/components/timeline | Routine | entrance |

## Product additions from research (fold into the flow)
1. One-tap Karolinska Sleepiness Scale (1-9) next to the reaction test, with a "feels fine but slow / feels tired but fast" mismatch note (Kaida 2006, doi 10.1016/j.clinph.2006.03.011; Dev 2024, doi 10.3389/fphys.2024.1451269 found self-ratings don't track performance).
2. A "why this check" cue card on each check-in step: what to measure, how, why it matters in space (answers the challenge's "why is an exam needed").
3. Two-minute mode: prefilled from wearable/yesterday so most steps are "confirm"; a time budget shown; after an Act-now alert, a "re-measure in 30 min" prompt (Russell 2023 ExMC CDS concept, doi 10.1038/s41526-023-00284-1).
4. Glove-friendly targets: min 56px touch targets on crew screens (NASA JSC touchscreen evaluations, NTRS 20140006198).
